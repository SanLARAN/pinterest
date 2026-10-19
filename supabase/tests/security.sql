-- Run as the project SQL administrator. All synthetic users and data roll back; no email is sent.
begin;
select set_config('hush.qa_a',gen_random_uuid()::text,true),set_config('hush.qa_b',gen_random_uuid()::text,true),set_config('hush.qa_c',gen_random_uuid()::text,true);
insert into auth.users(id,email) select current_setting(k)::uuid,'qa-'||current_setting(k)||'@example.invalid' from unnest(array['hush.qa_a','hush.qa_b','hush.qa_c']) k;
do $$
declare a uuid:=current_setting('hush.qa_a')::uuid;b uuid:=current_setting('hush.qa_b')::uuid;c uuid:=current_setting('hush.qa_c')::uuid;r uuid:=gen_random_uuid();client_a uuid:=gen_random_uuid();req uuid;inv uuid;x jsonb;caught boolean;p jsonb:='{"v":1,"settings":{},"outfit":{},"atlas":{},"scores":[]}'::jsonb;
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 x:=public.hush_initialize(a,p,'{"shards":100,"total":100,"owned":[]}');
 x:=public.hush_initialize(a,p,'{"shards":999,"total":999,"owned":[]}');if (x#>>'{wallet,shards}')::int<>100 then raise exception 'duplicate import';end if;
 x:=public.hush_buy(a,'leshy');x:=public.hush_buy(a,'leshy');if (x#>>'{wallet,shards}')::int<>60 then raise exception 'double debit';end if;
 caught:=false;begin perform public.hush_buy(b,'trueno');exception when others then caught:=true;end;if not caught then raise exception 'wrong-account write';end if;
 x:=public.hush_save(a,null,p);if x->>'conflict'<>'true' then raise exception 'NULL CAS bypass';end if;
 perform public.hush_begin_run(a,r);x:=public.hush_finish_run(a,r,3,'{}');x:=public.hush_finish_run(a,r,3,'{}');if (x#>>'{snapshot,wallet,shards}')::int<>63 then raise exception 'reward replay';end if;
 perform public.hush_friend_action(a,'request',b,null);select id into req from public.hush_friend_requests where sender_id=a and recipient_id=b;
 caught:=false;begin perform public.hush_friend_action(a,'accept',null,req);exception when others then caught:=true;end;if not caught then raise exception 'sender accepted own request';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);perform public.hush_friend_action(b,'accept',null,req);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform public.hush_heartbeat(a,client_a,'lobby','ABCDE','default');x:=public.hush_send_invite(a,client_a,b);inv:=(x->>'id')::uuid;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);caught:=false;begin perform public.hush_answer_invite(c,inv,true);exception when others then caught:=true;end;if not caught then raise exception 'third-party invite';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);x:=public.hush_answer_invite(b,inv,true);if x->>'room_code'<>'ABCDE' then raise exception 'wrong room';end if;
 perform public.hush_friend_action(b,'block',a,null);if public.hush_is_friend(a) then raise exception 'block did not remove friendship';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('hush.qa_a'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare caught boolean:=false;begin
 if(select count(*) from public.hush_profiles)<>1 then raise exception 'profile RLS leak';end if;
 if(select count(*) from public.hush_saves)<>1 then raise exception 'save RLS leak';end if;
 if exists(select 1 from public.hush_wallets where user_id<>auth.uid()) then raise exception 'wallet RLS leak';end if;
 begin update public.hush_wallets set shards=999;exception when insufficient_privilege then caught:=true;end;if not caught then raise exception 'direct wallet update';end if;
 caught:=false;begin perform public.hush_notify(current_setting('hush.qa_b')::uuid,'invite');exception when insufficient_privilege then caught:=true;end;if not caught then raise exception 'privileged helper exposed';end if;
end $$;
reset role;
rollback;
