-- Private social graph and invitation inbox. Presence is per tab/device, never frame-by-frame.
alter table public.hush_presence drop constraint hush_presence_pkey;
alter table public.hush_presence add column client_id uuid not null default gen_random_uuid();
alter table public.hush_presence add primary key(user_id,client_id);
create index hush_presence_recent on public.hush_presence(user_id,seen_at desc);

create function public.hush_search(p_query text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor();q text:=lower(trim(p_query));r jsonb;begin
 if q is null or q !~ '^[a-z0-9_]{3,20}$' then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into r from(
  select p.id,p.handle,p.display_name from public.hush_profiles p where starts_with(p.handle,q) and p.id<>u
  and not exists(select 1 from public.hush_blocks b where (b.user_id=u and b.blocked_id=p.id) or (b.user_id=p.id and b.blocked_id=u))
  order by p.handle limit 10)s;return r;
end $$;
create function public.hush_social() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor();result jsonb;begin
 select jsonb_build_object(
 'friends',coalesce((select jsonb_agg(to_jsonb(f)) from(
  select p.id,p.handle,p.display_name,coalesce(pr.state,'offline') state,pr.seen_at,case when pr.state='lobby' then pr.room_code end room_code,coalesce(pr.strategy,'default') strategy
  from public.hush_friendships fs join public.hush_profiles p on p.id=case when fs.a=u then fs.b else fs.a end
  left join lateral(select x.* from public.hush_presence x where x.user_id=p.id and x.seen_at>now()-interval '90 seconds' and x.state<>'offline'
  order by (x.state='playing') desc,(x.state='lobby') desc,x.seen_at desc limit 1)pr on true
  where (fs.a=u or fs.b=u) and public.hush_is_friend(p.id) order by p.handle limit 100)f),'[]'::jsonb),
 'requests',coalesce((select jsonb_agg(to_jsonb(r)) from(
  select q.id,q.sender_id,q.recipient_id,q.created_at,p.handle,p.display_name from public.hush_friend_requests q
  join public.hush_profiles p on p.id=case when q.sender_id=u then q.recipient_id else q.sender_id end
  where q.status='pending' and (q.sender_id=u or q.recipient_id=u)
  and not exists(select 1 from public.hush_blocks b where (b.user_id=u and b.blocked_id=p.id) or (b.user_id=p.id and b.blocked_id=u)) order by q.created_at desc limit 100)r),'[]'::jsonb),
 'invites',coalesce((select jsonb_agg(to_jsonb(i)) from(
  select q.id,q.sender_id,q.room_code,q.strategy,q.expires_at,p.handle,p.display_name from public.hush_invites q join public.hush_profiles p on p.id=q.sender_id
  where q.recipient_id=u and q.status='pending' and q.expires_at>now() and public.hush_is_friend(q.sender_id) order by q.created_at desc limit 30)i),'[]'::jsonb),
 'blocked',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'handle',p.handle,'display_name',p.display_name)) from public.hush_blocks b join public.hush_profiles p on p.id=b.blocked_id where b.user_id=u),'[]'::jsonb)
 ) into result;return result;
end $$;
create function public.hush_friend_action(p_owner uuid,p_action text,p_target uuid default null,p_request uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);v uuid:=p_target;r public.hush_friend_requests;changed boolean:=false;begin
 if p_action not in ('request','accept','decline','cancel','remove','block','unblock') then raise exception 'bad_action';end if;
 if p_action in ('accept','decline','cancel') then
  select * into r from public.hush_friend_requests where id=p_request;
  if not found or (r.sender_id<>u and r.recipient_id<>u) then raise exception 'request_missing';end if;
  v:=case when r.sender_id=u then r.recipient_id else r.sender_id end;
 end if;
 if v is null or v=u or not exists(select 1 from public.hush_profiles where id=v) then raise exception 'target_unavailable';end if;
 -- One lock order for both directions; reciprocal requests cannot race into duplicate friendships.
 perform 1 from public.hush_profiles where id in(u,v) order by id for update;
 if p_action='request' then
  if public.hush_is_friend(v) then return public.hush_social();end if;
  if exists(select 1 from public.hush_blocks where (user_id=u and blocked_id=v) or (user_id=v and blocked_id=u)) then raise exception 'target_unavailable';end if;
  if exists(select 1 from public.hush_friend_requests where sender_id=v and recipient_id=u and status='pending') then raise exception 'incoming_request';end if;
  if exists(select 1 from public.hush_friend_requests where sender_id=u and recipient_id=v and status='pending') then return public.hush_social();end if;
  if (select count(*) from public.hush_friend_requests where sender_id=u and status='pending')>=20 then raise exception 'request_limit';end if;
  if exists(select 1 from public.hush_friend_requests where sender_id=u and recipient_id=v and updated_at>now()-interval '1 day') then raise exception 'request_cooldown';end if;
  insert into public.hush_friend_requests(sender_id,recipient_id) values(u,v) on conflict(sender_id,recipient_id) do update set status='pending',created_at=now(),updated_at=now();
  changed:=true;
 elsif p_action in ('accept','decline','cancel') then
  select * into r from public.hush_friend_requests where id=p_request for update;
  if r.status<>'pending' then return public.hush_social();end if;
  if p_action='cancel' then
   if r.sender_id<>u then raise exception 'not_sender';end if;
   update public.hush_friend_requests set status='cancelled',updated_at=now() where id=r.id;
  else
   if r.recipient_id<>u then raise exception 'not_recipient';end if;
   if p_action='accept' then
    if exists(select 1 from public.hush_blocks where (user_id=u and blocked_id=v) or (user_id=v and blocked_id=u)) then raise exception 'target_unavailable';end if;
    if (select count(*) from public.hush_friendships where a=u or b=u)>=100 or (select count(*) from public.hush_friendships where a=v or b=v)>=100 then raise exception 'friend_limit';end if;
    insert into public.hush_friendships(a,b) values(least(u,v),greatest(u,v)) on conflict do nothing;
    update public.hush_friend_requests set status='accepted',updated_at=now() where (sender_id=u and recipient_id=v or sender_id=v and recipient_id=u) and status='pending';
   else update public.hush_friend_requests set status='declined',updated_at=now() where id=r.id;
   end if;
  end if;
  changed:=true;
 elsif p_action in ('remove','block') then
  delete from public.hush_friendships where a=least(u,v) and b=greatest(u,v);changed:=found;
  update public.hush_friend_requests set status='cancelled',updated_at=now() where (sender_id=u and recipient_id=v or sender_id=v and recipient_id=u);
  update public.hush_invites set status='revoked' where (sender_id=u and recipient_id=v or sender_id=v and recipient_id=u) and status='pending';
  if p_action='block' then insert into public.hush_blocks(user_id,blocked_id) values(u,v) on conflict do nothing;end if;
 elsif p_action='unblock' then
  delete from public.hush_blocks where user_id=u and blocked_id=v;
 end if;
 perform public.hush_notify(u,'friends');if changed then perform public.hush_notify(v,'friends');end if;
 return public.hush_social();
end $$;
create function public.hush_heartbeat(p_owner uuid,p_client uuid,p_state text,p_room text default null,p_strategy text default 'default') returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);begin
 if p_state is null or p_state not in ('online','lobby','playing','offline') or p_strategy is null or p_strategy not in ('default','nostr','torrent') then raise exception 'bad_presence';end if;
 if p_state<>'lobby' then p_room:=null;end if;
 if p_room is not null and p_room !~ '^[A-HJ-NP-Z2-9]{4,8}$' then raise exception 'bad_room';end if;
 insert into public.hush_presence(user_id,client_id,state,room_code,strategy) values(u,p_client,p_state,p_room,p_strategy)
 on conflict(user_id,client_id) do update set state=excluded.state,room_code=excluded.room_code,strategy=excluded.strategy,seen_at=now();
 delete from public.hush_presence where user_id=u and seen_at<now()-interval '10 minutes';
end $$;
create function public.hush_send_invite(p_owner uuid,p_client uuid,p_friend uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);pr public.hush_presence;res public.hush_invites;begin
 if not public.hush_is_friend(p_friend) then raise exception 'not_friends';end if;
 perform 1 from public.hush_profiles where id=u for update;
 select * into pr from public.hush_presence where user_id=u and client_id=p_client and state='lobby' and seen_at>now()-interval '90 seconds' and room_code is not null;
 if not found then raise exception 'not_in_lobby';end if;
 select * into res from public.hush_invites where sender_id=u and recipient_id=p_friend and room_code=pr.room_code and status='pending' and expires_at>now() order by created_at desc limit 1;
 if found then return to_jsonb(res);end if;
 if (select count(*) from public.hush_invites where sender_id=u and created_at>now()-interval '1 hour')>=60 then raise exception 'invite_limit';end if;
 insert into public.hush_invites(sender_id,recipient_id,room_code,strategy) values(u,p_friend,pr.room_code,pr.strategy) returning * into res;
 perform public.hush_notify(p_friend,'invite');return to_jsonb(res);
end $$;
create function public.hush_answer_invite(p_owner uuid,p_invite uuid,p_accept boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);i public.hush_invites;begin
 select * into i from public.hush_invites where id=p_invite and recipient_id=u for update;
 if not found or i.expires_at<=now() or i.status not in ('pending','accepted') then raise exception 'invite_expired';end if;
 if not public.hush_is_friend(i.sender_id) then raise exception 'not_friends';end if;
 if p_accept and not exists(select 1 from public.hush_presence where user_id=i.sender_id and room_code=i.room_code and state='lobby' and seen_at>now()-interval '90 seconds') then raise exception 'not_in_lobby';end if;
 update public.hush_invites set status=case when p_accept then 'accepted' else 'declined' end where id=i.id;
 perform public.hush_notify(u,'invite');return jsonb_build_object('room_code',i.room_code,'strategy',i.strategy);
end $$;
create function public.hush_join_friend(p_owner uuid,p_friend uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);r public.hush_presence;begin
 if not public.hush_is_friend(p_friend) then raise exception 'not_friends';end if;
 select * into r from public.hush_presence where user_id=p_friend and state='lobby' and room_code is not null and seen_at>now()-interval '90 seconds' order by seen_at desc limit 1;
 if not found then raise exception 'not_in_lobby';end if;
 return jsonb_build_object('room_code',r.room_code,'strategy',r.strategy);
end $$;
revoke all on function public.hush_search(text),public.hush_social(),public.hush_friend_action(uuid,text,uuid,uuid),public.hush_heartbeat(uuid,uuid,text,text,text),public.hush_send_invite(uuid,uuid,uuid),public.hush_answer_invite(uuid,uuid,boolean),public.hush_join_friend(uuid,uuid) from public,anon,authenticated;
grant execute on function public.hush_search(text),public.hush_social(),public.hush_friend_action(uuid,text,uuid,uuid),public.hush_heartbeat(uuid,uuid,text,text,text),public.hush_send_invite(uuid,uuid,uuid),public.hush_answer_invite(uuid,uuid,boolean),public.hush_join_friend(uuid,uuid) to authenticated;
-- Subscribe only to INSERT on the private inbox and INSERT/UPDATE on friend-visible presence.
-- Do not subscribe to DELETE records: old PKs must not leak private graph relationships.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='hush_events') then alter publication supabase_realtime add table public.hush_events;end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='hush_presence') then alter publication supabase_realtime add table public.hush_presence;end if;
 end if;
end $$;
