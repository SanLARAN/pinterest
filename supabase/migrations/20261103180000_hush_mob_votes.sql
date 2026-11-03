-- 3.1s: the landing page's ballot box (site/votes.js) — «кто придёт следующим». Six candidate creatures; one vote per
-- visitor, changeable. A signed-in player votes as their account ('u:<uuid>'), anyone else as a random device token
-- the page keeps in localStorage ('d:<32 hex>'). The table is closed to everyone; only the two functions below read
-- or write it. Nothing existing changes.
--
-- Abuse guard: a device token is free to mint, so new voters are capped per network — at most 30 fresh ballots a day
-- from one client IP. The IP itself is never stored, only a salted md5 of it.

create table if not exists public.hush_mob_votes (
  voter text primary key,
  mob text not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hush_mob_votes drop constraint if exists hush_mob_votes_mob;
alter table public.hush_mob_votes add constraint hush_mob_votes_mob
  check (mob in ('gluhar', 'kukushka', 'gribnica', 'shatun', 'poludnica', 'pyaty'));
alter table public.hush_mob_votes drop constraint if exists hush_mob_votes_voter;
alter table public.hush_mob_votes add constraint hush_mob_votes_voter
  check (voter ~ '^(u:[0-9a-f-]{36}|d:[0-9a-f]{32})$');
create index if not exists hush_mob_votes_ip on public.hush_mob_votes (ip_hash, created_at);

alter table public.hush_mob_votes enable row level security;
revoke all on public.hush_mob_votes from public, anon, authenticated;

-- the counts, the total, and (if it can tell) which one is yours
create or replace function public.hush_mob_tally(p_device text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  dev text := case when p_device ~ '^[0-9a-f]{32}$' then 'd:' || p_device end;
  me text := case when auth.uid() is not null then 'u:' || auth.uid()::text else dev end;
  counts jsonb;
  total int;
  mine text;
begin
  select coalesce(jsonb_object_agg(t.mob, t.n), '{}'::jsonb), coalesce(sum(t.n), 0)::int into counts, total
    from (select v.mob, count(*)::int as n from public.hush_mob_votes v group by v.mob) t;
  if me is not null then select v.mob into mine from public.hush_mob_votes v where v.voter = me; end if;
  if mine is null and dev is not null then select v.mob into mine from public.hush_mob_votes v where v.voter = dev; end if;
  return jsonb_build_object('counts', counts, 'total', total, 'mine', mine);
end $$;

-- cast (or move) your vote; returns the fresh tally
create or replace function public.hush_mob_vote(p_mob text, p_device text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  dev text := case when p_device ~ '^[0-9a-f]{32}$' then 'd:' || p_device end;
  me text;
  hdr jsonb;
  ip text;
  h text;
begin
  if p_mob is null or p_mob not in ('gluhar', 'kukushka', 'gribnica', 'shatun', 'poludnica', 'pyaty') then
    raise exception 'bad_mob';
  end if;
  me := case when auth.uid() is not null then 'u:' || auth.uid()::text else dev end;
  if me is null then raise exception 'bad_device'; end if;
  hdr := nullif(current_setting('request.headers', true), '')::jsonb;
  ip := trim(split_part(coalesce(hdr ->> 'cf-connecting-ip', hdr ->> 'x-real-ip', hdr ->> 'x-forwarded-for', ''), ',', 1));
  h := case when ip = '' then null else md5('hush-mob-vote:' || ip) end;
  if not exists (select 1 from public.hush_mob_votes v where v.voter = me)
     and h is not null
     and (select count(*) from public.hush_mob_votes v where v.ip_hash = h and v.created_at > now() - interval '1 day') >= 30 then
    raise exception 'rate_limited';
  end if;
  -- signed in: the vote this device cast before moves to the account (one person, one ballot)
  if auth.uid() is not null and dev is not null then delete from public.hush_mob_votes v where v.voter = dev; end if;
  insert into public.hush_mob_votes as v (voter, mob, ip_hash) values (me, p_mob, h)
    on conflict (voter) do update set mob = excluded.mob, updated_at = now();
  return public.hush_mob_tally(p_device);
end $$;

revoke all on function public.hush_mob_tally(text), public.hush_mob_vote(text, text) from public;
grant execute on function public.hush_mob_tally(text), public.hush_mob_vote(text, text) to anon, authenticated;
