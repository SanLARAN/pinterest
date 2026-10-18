-- This is a dedicated, previously empty game project. Realtime DELETE records bypass RLS filtering;
-- disable them on the PUBLICATION, not just in our client, so hostile subscribers cannot see presence PKs.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and (schemaname<>'public' or tablename not in ('hush_events','hush_presence'))) then raise exception 'Review shared publication before changing publish options';end if;
  alter publication supabase_realtime set (publish='insert,update');
 end if;
end $$;
