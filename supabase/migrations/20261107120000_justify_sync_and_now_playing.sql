-- Justify ⇄ ТИШЕ: общий аккаунт, синхронизация медиатеки Justify и «Слушает…» для друзей по игре.
-- Применяется к проекту Supabase игры «Тише» (SanLARAN's Project, ppylutuhhmvhgqqqnldm).
-- Только новые объекты justify_*; таблицы и функции hush_* не меняются (используется готовая hush_is_friend).

-- Медиатека Justify: одна строка на пользователя, data = gzip(JSON) в base64. Пишется только через RPC
-- с проверкой версии (оптимистичная блокировка): два устройства не затрут изменения друг друга.
create table if not exists public.justify_library (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  version bigint not null default 1,
  size integer not null default 0,
  device text,
  updated_at timestamptz not null default now()
);
alter table public.justify_library enable row level security;
drop policy if exists justify_library_read on public.justify_library;
create policy justify_library_read on public.justify_library for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.justify_library_push(p_data text, p_base bigint, p_device text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid := auth.uid(); cur bigint;
begin
  if u is null then raise exception 'not_authenticated'; end if;
  if p_data is null or length(p_data) = 0 or length(p_data) > 12000000 then raise exception 'bad_payload'; end if;
  select l.version into cur from public.justify_library l where l.user_id = u for update;
  if cur is not null and cur <> coalesce(p_base, 0) then
    return jsonb_build_object('ok', false, 'conflict', true, 'version', cur);
  end if;
  insert into public.justify_library as l (user_id, data, version, size, device, updated_at)
  values (u, p_data, 1, length(p_data), left(p_device, 60), now())
  on conflict (user_id) do update set data = excluded.data, version = l.version + 1, size = excluded.size, device = excluded.device, updated_at = now()
  returning l.version into cur;
  return jsonb_build_object('ok', true, 'version', cur);
end $$;
revoke all on function public.justify_library_push(text, bigint, text) from public, anon;
grant execute on function public.justify_library_push(text, bigint, text) to authenticated;

-- «Слушает…»: что сейчас играет в Justify. Видят сам пользователь и его друзья по игре (как профиль и присутствие).
create table if not exists public.justify_now_playing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state text not null check (state in ('playing', 'paused')),
  title text not null,
  artist text,
  album text,
  cover text,
  link text,
  source text,
  duration integer,
  position integer,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.justify_now_playing enable row level security;
drop policy if exists justify_np_read on public.justify_now_playing;
create policy justify_np_read on public.justify_now_playing for select to authenticated
  using (user_id = (select auth.uid()) or public.hush_is_friend(user_id));

create or replace function public.justify_now_playing_set(
  p_state text, p_title text default null, p_artist text default null, p_album text default null,
  p_cover text default null, p_link text default null, p_source text default null,
  p_duration integer default null, p_position integer default null)
returns void language plpgsql security definer set search_path to '' as $$
declare u uuid := auth.uid();
  t text := nullif(trim(regexp_replace(left(coalesce(p_title, ''), 200), '[[:cntrl:]]', '', 'g')), '');
  pos integer := greatest(0, least(coalesce(p_position, 0), 86400));
begin
  if u is null then raise exception 'not_authenticated'; end if;
  if p_state = 'stopped' then delete from public.justify_now_playing where user_id = u; return; end if;
  if p_state is null or p_state not in ('playing', 'paused') or t is null then raise exception 'bad_now_playing'; end if;
  insert into public.justify_now_playing as n (user_id, state, title, artist, album, cover, link, source, duration, position, started_at, updated_at)
  values (u, p_state, t,
    nullif(trim(regexp_replace(left(coalesce(p_artist, ''), 200), '[[:cntrl:]]', '', 'g')), ''),
    nullif(trim(regexp_replace(left(coalesce(p_album, ''), 200), '[[:cntrl:]]', '', 'g')), ''),
    -- В PostgreSQL повтор в регулярном выражении не больше 255 — длину проверяем отдельно.
    case when length(p_cover) <= 1000 and p_cover ~ '^https://[^\s"<>]+$' then p_cover end,
    case when length(p_link) <= 1000 and p_link ~ '^https://[^\s"<>]+$' then p_link end,
    case when p_source in ('youtube', 'soundcloud', 'zaycev', 'audius', 'local', 'url', 'web') then p_source end,
    case when p_duration between 0 and 86400 then p_duration end,
    pos, now() - make_interval(secs => pos), now())
  on conflict (user_id) do update set state = excluded.state, title = excluded.title, artist = excluded.artist, album = excluded.album,
    cover = excluded.cover, link = excluded.link, source = excluded.source, duration = excluded.duration, position = excluded.position,
    started_at = excluded.started_at, updated_at = now();
end $$;
revoke all on function public.justify_now_playing_set(text, text, text, text, text, text, text, integer, integer) from public, anon;
grant execute on function public.justify_now_playing_set(text, text, text, text, text, text, text, integer, integer) to authenticated;

-- Для игры: кто из друзей сейчас что слушает (RLS пускает только к друзьям). Устаревшие записи (Justify закрылся
-- без «стоп») не показываем: играющий трек — если обновлялся последние 3 минуты, пауза — последние 30.
-- position для играющего трека досчитывается на сервере от started_at.
create or replace function public.justify_friends_listening()
returns table (user_id uuid, state text, title text, artist text, album text, cover text, link text, source text,
  duration integer, "position" integer, updated_at timestamptz)
language sql stable security invoker set search_path to '' as $$
  select n.user_id, n.state, n.title, n.artist, n.album, n.cover, n.link, n.source, n.duration,
    case when n.state = 'playing' then least(coalesce(n.duration, 86400), extract(epoch from now() - n.started_at)::integer) else n.position end,
    n.updated_at
  from public.justify_now_playing n
  where n.user_id <> (select auth.uid())
    and ((n.state = 'playing' and n.updated_at > now() - interval '3 minutes')
      or (n.state = 'paused' and n.updated_at > now() - interval '30 minutes'));
$$;
revoke all on function public.justify_friends_listening() from public, anon;
grant execute on function public.justify_friends_listening() to authenticated;

-- Вход в Justify по нику из игры: почту по нику узнаёт только сервер (Edge Function justify-auth), клиенту она не выдаётся.
-- Неудачные попытки считаются по нику/почте: после 8 за 15 минут вход временно закрыт.
create table if not exists public.justify_login_attempts (
  key text primary key,
  fails integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.justify_login_attempts enable row level security;

create or replace function public.justify_email_for_handle(p_handle text)
returns text language sql stable security definer set search_path to '' as $$
  select u.email::text from public.hush_profiles p join auth.users u on u.id = p.id where p.handle = lower(trim(p_handle)) limit 1;
$$;
revoke all on function public.justify_email_for_handle(text) from public, anon, authenticated;
grant execute on function public.justify_email_for_handle(text) to service_role;
