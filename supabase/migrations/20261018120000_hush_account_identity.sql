-- Game/lobby settings cannot rename a signed-in account. Only hush_profile_update changes its callsign.
create or replace function public.hush_save(p_owner uuid,p_version bigint,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.hush_actor(p_owner);s public.hush_saves;canonical text;begin
 perform public.hush_check_payload(p_payload);
 select * into s from public.hush_saves where user_id=u for update;
 if not found or not s.initialized then raise exception 'profile_not_ready';end if;
 if s.version is distinct from p_version then return jsonb_build_object('conflict',true,'snapshot',public.hush_snapshot());end if;
 select display_name into canonical from public.hush_profiles where id=u;
 p_payload:=jsonb_set(p_payload,'{settings,name}',to_jsonb(canonical),true);
 update public.hush_saves set payload=p_payload,version=version+1,updated_at=now() where user_id=u;
 perform public.hush_notify(u,'save');return jsonb_build_object('conflict',false,'snapshot',public.hush_snapshot());
end $$;
-- Google supplies full_name/name; password signup supplies display_name. Do not derive a nick from email.
create or replace function public.hush_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin perform public.hush_ensure(new.id,coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','Путник'));return new;end $$;
