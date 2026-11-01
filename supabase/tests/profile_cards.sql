-- 3.0x profile cards and banners. Run as the project SQL administrator; everything rolls back.
begin;
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); x jsonb; caught boolean;
begin
  insert into auth.users(id, email) values (a, 'qa-a-' || a || '@example.invalid'), (b, 'qa-b-' || b || '@example.invalid'), (c, 'qa-c-' || c || '@example.invalid');
  insert into public.hush_profiles(id, handle, display_name) values (a, 'qa_a_' || left(replace(a::text, '-', ''), 10), 'A'), (b, 'qa_b_' || left(replace(b::text, '-', ''), 10), 'B'), (c, 'qa_c_' || left(replace(c::text, '-', ''), 10), 'C')
    on conflict (id) do nothing;
  insert into public.hush_friendships(a, b) values (least(a, b), greatest(a, b));
  -- A publishes a card and a banner
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  x := public.hush_card_publish(a, '{"nights":12,"wins":3}');
  x := public.hush_banner_set(a, a::text || '/banner-1.mp4', 'video');
  -- A cannot write for someone else, or point at someone else's folder
  caught := false; begin perform public.hush_card_publish(b, '{}'); exception when others then caught := true; end; if not caught then raise exception 'card for another account'; end if;
  caught := false; begin perform public.hush_banner_set(a, b::text || '/x.png', 'image'); exception when others then caught := true; end; if not caught then raise exception 'banner in another folder'; end if;
  caught := false; begin perform public.hush_banner_set(a, a::text || '/x.exe', 'program'); exception when others then caught := true; end; if not caught then raise exception 'bad kind accepted'; end if;
  caught := false; begin perform public.hush_card_publish(a, ('{"x":"' || repeat('z', 5000) || '"}')::jsonb); exception when others then caught := true; end; if not caught then raise exception 'oversized card'; end if;
  -- B (a friend) sees it
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  x := public.hush_profile_view(a);
  if (x #>> '{card,nights}')::int <> 12 or x ->> 'banner_kind' <> 'video' or (x ->> 'self')::boolean then raise exception 'friend view wrong: %', x; end if;
  -- C (not a friend) does not
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  caught := false; begin perform public.hush_profile_view(a); exception when others then caught := true; end; if not caught then raise exception 'stranger saw the profile'; end if;
  -- A clears the banner
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  x := public.hush_banner_set(a, null, null);
  x := public.hush_profile_view(a);
  if x ->> 'banner' is not null or not (x ->> 'self')::boolean then raise exception 'clear failed'; end if;
  raise notice 'profile cards: ok';
end $$;
rollback;
