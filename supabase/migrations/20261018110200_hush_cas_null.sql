-- A NULL expected version must conflict, never bypass optimistic concurrency.
create or replace function public.hush_save(p_owner uuid,p_version bigint,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);s public.hush_saves;nm text;begin
 perform public.hush_check_payload(p_payload);
 select * into s from public.hush_saves where user_id=u for update;
 if not found or not s.initialized then raise exception 'profile_not_ready';end if;
 if s.version is distinct from p_version then return jsonb_build_object('conflict',true,'snapshot',public.hush_snapshot());end if;
 update public.hush_saves set payload=p_payload,version=version+1,updated_at=now() where user_id=u;
 nm:=trim(regexp_replace(left(p_payload#>>'{settings,name}',14),'[<>[:cntrl:]]','','g'));
 if length(nm)>0 then update public.hush_profiles set display_name=nm,updated_at=now() where id=u;end if;
 perform public.hush_notify(u,'save');return jsonb_build_object('conflict',false,'snapshot',public.hush_snapshot());
end $$;
