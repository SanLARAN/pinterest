-- 3.0x: full-screen profiles. A banner (PNG/JPG/GIF/MP4 up to 20 MB) in a private bucket, and a small public
-- «card» of stats the owner publishes. Both are seen by the owner and their friends only — the same rule as the
-- profile row and the presence (hush_is_friend). Nothing existing changes.

alter table public.hush_profiles
  add column if not exists card jsonb not null default '{}'::jsonb,
  add column if not exists banner text,
  add column if not exists banner_kind text,
  add column if not exists banner_at timestamptz;
alter table public.hush_profiles drop constraint if exists hush_profiles_card_size;
alter table public.hush_profiles add constraint hush_profiles_card_size check (jsonb_typeof(card) = 'object' and octet_length(card::text) <= 4096);
alter table public.hush_profiles drop constraint if exists hush_profiles_banner_kind;
alter table public.hush_profiles add constraint hush_profiles_banner_kind check (banner_kind is null or banner_kind in ('image', 'video'));

-- the bucket: private, 20 MB, the four formats the profile accepts
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hush-banners', 'hush-banners', false, 20971520, array['image/png', 'image/jpeg', 'image/gif', 'video/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- objects live under <owner uuid>/...: the owner writes there; the owner and their friends read
drop policy if exists hush_banner_read on storage.objects;
create policy hush_banner_read on storage.objects for select to authenticated
  using (bucket_id = 'hush-banners' and ((storage.foldername(name))[1] = auth.uid()::text
    or public.hush_is_friend(((storage.foldername(name))[1])::uuid)));
drop policy if exists hush_banner_insert on storage.objects;
create policy hush_banner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'hush-banners' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists hush_banner_update on storage.objects;
create policy hush_banner_update on storage.objects for update to authenticated
  using (bucket_id = 'hush-banners' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'hush-banners' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists hush_banner_delete on storage.objects;
create policy hush_banner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'hush-banners' and (storage.foldername(name))[1] = auth.uid()::text);

-- the owner publishes their card (self-reported, cosmetic: nights, wins, best night…)
create or replace function public.hush_card_publish(p_owner uuid, p_card jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := public.hush_actor(p_owner);
begin
  if p_card is null or jsonb_typeof(p_card) <> 'object' or octet_length(p_card::text) > 4096 then raise exception 'bad_card'; end if;
  update public.hush_profiles set card = p_card, updated_at = now() where id = u;
  return jsonb_build_object('ok', true);
end $$;

-- the owner points the profile at an uploaded banner (or clears it with null)
create or replace function public.hush_banner_set(p_owner uuid, p_path text, p_kind text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := public.hush_actor(p_owner);
begin
  if p_path is null then
    update public.hush_profiles set banner = null, banner_kind = null, banner_at = now(), updated_at = now() where id = u;
    return jsonb_build_object('ok', true);
  end if;
  if left(p_path, 37) <> u::text || '/' or p_path ~ '\.\.' or length(p_path) > 120 or p_kind not in ('image', 'video') then raise exception 'bad_banner'; end if;
  update public.hush_profiles set banner = p_path, banner_kind = p_kind, banner_at = now(), updated_at = now() where id = u;
  perform public.hush_notify(u, 'profile');
  return jsonb_build_object('ok', true);
end $$;

-- a profile to show: yourself, or a friend. Anyone else gets 'not_friend'.
create or replace function public.hush_profile_view(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := public.hush_actor(); r jsonb;
begin
  if p_id is null or (p_id <> u and not public.hush_is_friend(p_id)) then raise exception 'not_friend'; end if;
  select jsonb_build_object('id', p.id, 'handle', p.handle, 'display_name', p.display_name, 'created_at', p.created_at,
    'card', p.card, 'banner', p.banner, 'banner_kind', p.banner_kind, 'banner_at', p.banner_at, 'self', p.id = u)
    into r from public.hush_profiles p where p.id = p_id;
  if r is null then raise exception 'not_found'; end if;
  return r;
end $$;

revoke all on function public.hush_card_publish(uuid, jsonb), public.hush_banner_set(uuid, text, text), public.hush_profile_view(uuid) from public, anon;
grant execute on function public.hush_card_publish(uuid, jsonb), public.hush_banner_set(uuid, text, text), public.hush_profile_view(uuid) to authenticated;
