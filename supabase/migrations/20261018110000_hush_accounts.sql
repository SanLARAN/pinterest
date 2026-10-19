-- HUSH accounts. No password/email/audio in public tables. All mutations are authenticated RPCs.
create table public.hush_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check(handle ~ '^[a-z0-9_]{3,20}$'),
 display_name text not null check(length(display_name) between 1 and 14 and display_name !~ '[<>[:cntrl:]]'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index hush_profiles_handle_prefix on public.hush_profiles(handle text_pattern_ops);
create table public.hush_saves (
 user_id uuid primary key references public.hush_profiles(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=65536),
 version bigint not null default 0, initialized boolean not null default false,
 imported_at timestamptz, updated_at timestamptz not null default now()
);
create table public.hush_wallets (
 user_id uuid primary key references public.hush_profiles(id) on delete cascade,
 shards bigint not null default 0 check(shards between 0 and 1000000000),
 total bigint not null default 0 check(total>=shards), version bigint not null default 0
);
create table public.hush_purchases (
 user_id uuid not null references public.hush_profiles(id) on delete cascade,
 product_id text not null check(product_id in ('leshy','plague','cosmos','trueno')),
 price integer not null check(price>=0), source text not null check(source in ('legacy','purchase')),
 created_at timestamptz not null default now(), primary key(user_id,product_id)
);
create table public.hush_runs (
 user_id uuid not null references public.hush_profiles(id) on delete cascade, nonce uuid not null,
 started_at timestamptz not null default now(), finished_at timestamptz,
 earned integer check(earned between 0 and 256), summary jsonb,
 verification text not null default 'client_reported' check(verification='client_reported'),
 primary key(user_id,nonce)
);
create index hush_runs_recent on public.hush_runs(user_id,started_at desc);
create table public.hush_friend_requests (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.hush_profiles(id) on delete cascade,
 recipient_id uuid not null references public.hush_profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(sender_id<>recipient_id), unique(sender_id,recipient_id)
);
create index hush_requests_in on public.hush_friend_requests(recipient_id,status);
create table public.hush_friendships (
 a uuid not null references public.hush_profiles(id) on delete cascade, b uuid not null references public.hush_profiles(id) on delete cascade,
 created_at timestamptz not null default now(), check(a<b), primary key(a,b)
);
create index hush_friendships_b on public.hush_friendships(b);
create table public.hush_blocks (
 user_id uuid not null references public.hush_profiles(id) on delete cascade, blocked_id uuid not null references public.hush_profiles(id) on delete cascade,
 created_at timestamptz not null default now(), check(user_id<>blocked_id), primary key(user_id,blocked_id)
);
create table public.hush_presence (
 user_id uuid primary key references public.hush_profiles(id) on delete cascade,
 state text not null default 'online' check(state in ('online','lobby','playing','offline')),
 room_code text check(room_code ~ '^[A-HJ-NP-Z2-9]{4,8}$'),
 strategy text not null default 'default' check(strategy in ('default','nostr','torrent')),
 seen_at timestamptz not null default now()
);
create table public.hush_invites (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.hush_profiles(id) on delete cascade,
 recipient_id uuid not null references public.hush_profiles(id) on delete cascade,
 room_code text not null check(room_code ~ '^[A-HJ-NP-Z2-9]{4,8}$'),
 strategy text not null default 'default' check(strategy in ('default','nostr','torrent')),
 status text not null default 'pending' check(status in ('pending','accepted','declined','revoked')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '10 minutes'),
 check(sender_id<>recipient_id)
);
create index hush_invites_in on public.hush_invites(recipient_id,status,expires_at);
create table public.hush_events (
 id bigint generated always as identity primary key, user_id uuid not null references public.hush_profiles(id) on delete cascade,
 kind text not null check(kind in ('save','profile','friends','invite')), created_at timestamptz not null default now()
);
create index hush_events_user on public.hush_events(user_id,id desc);

create function public.hush_actor(p_owner uuid default null) returns uuid language plpgsql stable set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null then raise exception 'not_authenticated'; end if;
 if p_owner is not null and p_owner<>u then raise exception 'wrong_account'; end if;
 return u;
end $$;
create function public.hush_is_friend(p_other uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.hush_friendships f where f.a=least(auth.uid(),p_other) and f.b=greatest(auth.uid(),p_other))
 and not exists(select 1 from public.hush_blocks b where (b.user_id=auth.uid() and b.blocked_id=p_other) or (b.user_id=p_other and b.blocked_id=auth.uid()));
$$;
create function public.hush_notify(p_user uuid,p_kind text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.hush_events(user_id,kind) values(p_user,p_kind);
 delete from public.hush_events where user_id=p_user and id in(select id from public.hush_events where user_id=p_user order by id desc offset 100);
end $$;
create function public.hush_ensure(p_user uuid,p_name text default 'Путник') returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.hush_profiles(id,handle,display_name) values(p_user,'p_'||substr(replace(p_user::text,'-',''),1,16),coalesce(nullif(trim(regexp_replace(left(p_name,14),'[<>[:cntrl:]]','','g')),''),'Путник')) on conflict(id) do nothing;
 insert into public.hush_saves(user_id) values(p_user) on conflict do nothing;
 insert into public.hush_wallets(user_id) values(p_user) on conflict do nothing;
end $$;
create function public.hush_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.hush_ensure(new.id,coalesce(new.raw_user_meta_data->>'display_name','Путник'));return new;end $$;
create trigger hush_on_auth_user_created after insert on auth.users for each row execute function public.hush_new_user();

-- RLS remains enabled even though all writes go through small, owner-checked functions.
do $$ declare t text; begin
 foreach t in array array['hush_profiles','hush_saves','hush_wallets','hush_purchases','hush_runs','hush_friend_requests','hush_friendships','hush_blocks','hush_presence','hush_invites','hush_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy hush_profile_read on public.hush_profiles for select to authenticated using(id=auth.uid() or public.hush_is_friend(id));
create policy hush_save_read on public.hush_saves for select to authenticated using(user_id=auth.uid());
create policy hush_wallet_read on public.hush_wallets for select to authenticated using(user_id=auth.uid());
create policy hush_purchase_read on public.hush_purchases for select to authenticated using(user_id=auth.uid());
create policy hush_run_read on public.hush_runs for select to authenticated using(user_id=auth.uid());
create policy hush_request_read on public.hush_friend_requests for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy hush_friend_read on public.hush_friendships for select to authenticated using(a=auth.uid() or b=auth.uid());
create policy hush_block_read on public.hush_blocks for select to authenticated using(user_id=auth.uid());
create policy hush_presence_read on public.hush_presence for select to authenticated using(user_id=auth.uid() or public.hush_is_friend(user_id));
create policy hush_invite_read on public.hush_invites for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy hush_event_read on public.hush_events for select to authenticated using(user_id=auth.uid());

create function public.hush_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor();result jsonb; begin
 select jsonb_build_object('profile',to_jsonb(p),'save',to_jsonb(s),'wallet',jsonb_build_object('shards',w.shards,'total',w.total,'version',w.version,'owned',coalesce((select jsonb_agg(c.product_id order by c.product_id) from public.hush_purchases c where c.user_id=u),'[]'::jsonb))) into result
 from public.hush_profiles p join public.hush_saves s on s.user_id=p.id join public.hush_wallets w on w.user_id=p.id where p.id=u;
 return result;
end $$;
create function public.hush_bootstrap() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor();begin perform public.hush_ensure(u);return public.hush_snapshot();end $$;
create function public.hush_check_payload(p jsonb) returns void language plpgsql immutable set search_path='' as $$
begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>65536 or p->>'v' is distinct from '1' then raise exception 'bad_payload';end if;
 if exists(select 1 from jsonb_object_keys(p) k where k not in ('v','settings','outfit','atlas','scores')) then raise exception 'bad_payload';end if;
 if jsonb_typeof(p->'settings') is distinct from 'object' or jsonb_typeof(p->'outfit') is distinct from 'object' or jsonb_typeof(p->'atlas') is distinct from 'object' or jsonb_typeof(p->'scores') is distinct from 'array' then raise exception 'bad_payload';end if;
 if jsonb_array_length(p->'scores')>10 then raise exception 'bad_payload';end if;
end $$;
create function public.hush_initialize(p_owner uuid,p_payload jsonb,p_legacy jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);s public.hush_saves;bal bigint;tot bigint;prod text;begin
 select * into s from public.hush_saves where user_id=u for update;
 if not found then raise exception 'profile_missing';end if;
 if s.initialized then return public.hush_snapshot();end if;
 perform public.hush_check_payload(p_payload);
 if p_legacy is not null then
  if jsonb_typeof(p_legacy)<>'object' or octet_length(p_legacy::text)>4096 or coalesce(p_legacy->>'shards','') !~ '^[0-9]{1,7}$' or coalesce(p_legacy->>'total','') !~ '^[0-9]{1,10}$' or jsonb_typeof(p_legacy->'owned') is distinct from 'array' then raise exception 'bad_legacy';end if;
  bal:=(p_legacy->>'shards')::bigint;tot:=greatest(bal,(p_legacy->>'total')::bigint);
  if bal>1000000 or tot>1000000000 or jsonb_array_length(p_legacy->'owned')>4 then raise exception 'bad_legacy';end if;
  update public.hush_wallets set shards=bal,total=tot,version=version+1 where user_id=u;
  for prod in select jsonb_array_elements_text(p_legacy->'owned') loop
   if prod not in ('leshy','plague','cosmos','trueno') then raise exception 'bad_product';end if;
   insert into public.hush_purchases(user_id,product_id,price,source) values(u,prod,0,'legacy') on conflict do nothing;
  end loop;
 end if;
 update public.hush_saves set payload=p_payload,initialized=true,imported_at=case when p_legacy is not null then now() else null end,version=version+1,updated_at=now() where user_id=u;
 perform public.hush_notify(u,'save');return public.hush_snapshot();
end $$;
create function public.hush_save(p_owner uuid,p_version bigint,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);s public.hush_saves;nm text;begin
 perform public.hush_check_payload(p_payload);
 select * into s from public.hush_saves where user_id=u for update;
 if not found or not s.initialized then raise exception 'profile_not_ready';end if;
 if s.version<>p_version then return jsonb_build_object('conflict',true,'snapshot',public.hush_snapshot());end if;
 update public.hush_saves set payload=p_payload,version=version+1,updated_at=now() where user_id=u;
 nm:=trim(regexp_replace(left(p_payload#>>'{settings,name}',14),'[<>[:cntrl:]]','','g'));
 if length(nm)>0 then update public.hush_profiles set display_name=nm,updated_at=now() where id=u;end if;
 perform public.hush_notify(u,'save');return jsonb_build_object('conflict',false,'snapshot',public.hush_snapshot());
end $$;
create function public.hush_profile_update(p_owner uuid,p_handle text,p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);h text:=lower(trim(p_handle));n text:=trim(regexp_replace(left(p_name,14),'[<>[:cntrl:]]','','g'));begin
 perform 1 from public.hush_saves where user_id=u for update;
 if h is null or h !~ '^[a-z0-9_]{3,20}$' or coalesce(length(n),0)=0 then raise exception 'bad_profile';end if;
 update public.hush_profiles set handle=h,display_name=n,updated_at=now() where id=u;
 update public.hush_saves set payload=jsonb_set(payload,'{settings,name}',to_jsonb(n),true),version=version+1,updated_at=now() where user_id=u and initialized;
 perform public.hush_notify(u,'profile');return public.hush_snapshot();
end $$;
create function public.hush_buy(p_owner uuid,p_product text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);cost integer;bal bigint;begin
 cost:=case p_product when 'leshy' then 40 when 'plague' then 60 when 'cosmos' then 80 when 'trueno' then 86 else null end;
 if cost is null then raise exception 'bad_product';end if;
 select shards into bal from public.hush_wallets where user_id=u for update;
 if not exists(select 1 from public.hush_saves where user_id=u and initialized) then raise exception 'profile_not_ready';end if;
 if exists(select 1 from public.hush_purchases where user_id=u and product_id=p_product) then return public.hush_snapshot();end if;
 if bal<cost then raise exception 'insufficient_funds';end if;
 insert into public.hush_purchases(user_id,product_id,price,source) values(u,p_product,cost,'purchase');
 update public.hush_wallets set shards=shards-cost,version=version+1 where user_id=u;
 perform public.hush_notify(u,'save');return public.hush_snapshot();
end $$;
create function public.hush_begin_run(p_owner uuid,p_nonce uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);begin
 perform 1 from public.hush_wallets where user_id=u for update;
 if not exists(select 1 from public.hush_saves where user_id=u and initialized) then raise exception 'profile_not_ready';end if;
 if exists(select 1 from public.hush_runs where user_id=u and nonce=p_nonce) then return jsonb_build_object('ok',true);end if;
 if (select count(*) from public.hush_runs where user_id=u and finished_at is null and started_at>now()-interval '1 day')>=16 then raise exception 'too_many_runs';end if;
 insert into public.hush_runs(user_id,nonce) values(u,p_nonce);return jsonb_build_object('ok',true);
end $$;
-- P2P rewards are bounded client reports, NOT a claim of authoritative anti-cheat.
-- A server ticket, elapsed-time budget and idempotent receipt prevent direct balance writes / replay.
create function public.hush_finish_run(p_owner uuid,p_nonce uuid,p_earned integer,p_summary jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);r public.hush_runs;age numeric;begin
 if p_earned is null or p_earned not between 0 and 256 or p_summary is null or jsonb_typeof(p_summary)<>'object' or octet_length(p_summary::text)>4096 then raise exception 'bad_reward';end if;
 select * into r from public.hush_runs where user_id=u and nonce=p_nonce for update;
 if not found then raise exception 'run_missing';end if;
 if r.finished_at is not null then return jsonb_build_object('ok',true,'snapshot',public.hush_snapshot());end if;
 age:=greatest(0,extract(epoch from(now()-r.started_at)));
 if p_earned>8+floor(age) then return jsonb_build_object('ok',false,'retry_after',ceil(p_earned-8-age));end if;
 update public.hush_runs set finished_at=now(),earned=p_earned,summary=p_summary where user_id=u and nonce=p_nonce;
 update public.hush_wallets set shards=shards+p_earned,total=total+p_earned,version=version+1 where user_id=u;
 perform public.hush_notify(u,'save');return jsonb_build_object('ok',true,'snapshot',public.hush_snapshot());
end $$;

-- No default PUBLIC execute, including helper/trigger functions. Only the listed RPCs are exposed.
do $$ declare f record;begin
 for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and left(p.proname,5)='hush_' loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);end loop;
end $$;
grant execute on function public.hush_is_friend(uuid),public.hush_bootstrap(),public.hush_snapshot(),public.hush_initialize(uuid,jsonb,jsonb),public.hush_save(uuid,bigint,jsonb),public.hush_profile_update(uuid,text,text),public.hush_buy(uuid,text),public.hush_begin_run(uuid,uuid),public.hush_finish_run(uuid,uuid,integer,jsonb) to authenticated;
