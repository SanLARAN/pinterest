-- Уже включено в 20261107120000 (файл исправлен). Эта миграция — для баз, где применена первая версия:
-- в PostgreSQL повтор в регулярном выражении не больше 255, а была проверка ссылок через {3,1000}.
-- Тело функции — как в 20261107120000_justify_sync_and_now_playing.sql (justify_now_playing_set).

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
