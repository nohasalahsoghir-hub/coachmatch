create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

do $$
begin
  if to_regprocedure('public.book_with_package(uuid,uuid,date,time without time zone,text,text)') is not null
     and to_regprocedure('private.book_with_package(uuid,uuid,date,time without time zone,text,text)') is null then
    alter function public.book_with_package(uuid,uuid,date,time without time zone,text,text) set schema private;
  end if;
  if to_regprocedure('public.cancel_booking_v3(uuid,text)') is not null
     and to_regprocedure('private.cancel_booking_v3(uuid,text)') is null then
    alter function public.cancel_booking_v3(uuid,text) set schema private;
  end if;
  if to_regprocedure('public.capture_package_purchase_test(uuid,text)') is not null
     and to_regprocedure('private.capture_package_purchase_test(uuid,text)') is null then
    alter function public.capture_package_purchase_test(uuid,text) set schema private;
  end if;
  if to_regprocedure('public.capture_test_payment(uuid)') is not null
     and to_regprocedure('private.capture_test_payment(uuid)') is null then
    alter function public.capture_test_payment(uuid) set schema private;
  end if;
  if to_regprocedure('public.complete_booking_v3(uuid)') is not null
     and to_regprocedure('private.complete_booking_v3(uuid)') is null then
    alter function public.complete_booking_v3(uuid) set schema private;
  end if;
  if to_regprocedure('public.create_checkout_intent(uuid,date,time without time zone,text,text)') is not null
     and to_regprocedure('private.create_checkout_intent(uuid,date,time without time zone,text,text)') is null then
    alter function public.create_checkout_intent(uuid,date,time without time zone,text,text) set schema private;
  end if;
  if to_regprocedure('public.is_admin()') is not null
     and to_regprocedure('private.is_admin()') is null then
    alter function public.is_admin() set schema private;
  end if;
  if to_regprocedure('public.settle_payout_test(uuid)') is not null
     and to_regprocedure('private.settle_payout_test(uuid)') is null then
    alter function public.settle_payout_test(uuid) set schema private;
  end if;
end $$;

revoke all on function private.book_with_package(uuid,uuid,date,time without time zone,text,text) from public, anon;
revoke all on function private.cancel_booking_v3(uuid,text) from public, anon;
revoke all on function private.capture_package_purchase_test(uuid,text) from public, anon;
revoke all on function private.capture_test_payment(uuid) from public, anon;
revoke all on function private.complete_booking_v3(uuid) from public, anon;
revoke all on function private.create_checkout_intent(uuid,date,time without time zone,text,text) from public, anon;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.settle_payout_test(uuid) from public, anon;

grant execute on function private.book_with_package(uuid,uuid,date,time without time zone,text,text) to authenticated, service_role;
grant execute on function private.cancel_booking_v3(uuid,text) to authenticated, service_role;
grant execute on function private.capture_package_purchase_test(uuid,text) to authenticated, service_role;
grant execute on function private.capture_test_payment(uuid) to authenticated, service_role;
grant execute on function private.complete_booking_v3(uuid) to authenticated, service_role;
grant execute on function private.create_checkout_intent(uuid,date,time without time zone,text,text) to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.settle_payout_test(uuid) to authenticated, service_role;

create or replace function public.book_with_package(p_package_id uuid,p_coach_id uuid,p_session_date date,p_start_time time without time zone,p_location text,p_idempotency_key text)
returns table(booking_id uuid,coach_id uuid,session_date date,start_time time without time zone,total_amount numeric,remaining_sessions integer)
language sql security invoker set search_path = ''
as $$ select * from private.book_with_package($1,$2,$3,$4,$5,$6); $$;

create or replace function public.cancel_booking_v3(p_booking_id uuid,p_reason text default '')
returns table(refunded numeric,message text)
language sql security invoker set search_path = ''
as $$ select * from private.cancel_booking_v3($1,$2); $$;

create or replace function public.capture_package_purchase_test(p_coach_id uuid,p_idempotency_key text)
returns table(package_id uuid,payment_id uuid,reference text,coach_name text,total_amount numeric)
language sql security invoker set search_path = ''
as $$ select * from private.capture_package_purchase_test($1,$2); $$;

create or replace function public.capture_test_payment(p_intent_id uuid)
returns table(booking_id uuid,payment_id uuid,reference text,coach_name text,total_amount numeric)
language sql security invoker set search_path = ''
as $$ select * from private.capture_test_payment($1); $$;

create or replace function public.complete_booking_v3(p_booking_id uuid)
returns void
language sql security invoker set search_path = ''
as $$ select private.complete_booking_v3($1); $$;

create or replace function public.create_checkout_intent(p_coach_id uuid,p_session_date date,p_start_time time without time zone,p_location text,p_idempotency_key text)
returns table(intent_id uuid,coach_id uuid,expires_at timestamp with time zone,subtotal numeric,checkout_fee numeric,platform_commission numeric,total_amount numeric,coach_name text)
language sql security invoker set search_path = ''
as $$ select * from private.create_checkout_intent($1,$2,$3,$4,$5); $$;

create or replace function public.is_admin()
returns boolean
language sql security invoker set search_path = ''
as $$ select private.is_admin(); $$;

create or replace function public.settle_payout_test(p_payout_id uuid)
returns table(payout_id uuid,status text,amount numeric,reference text)
language sql security invoker set search_path = ''
as $$ select * from private.settle_payout_test($1); $$;

revoke execute on function public.book_with_package(uuid,uuid,date,time without time zone,text,text) from public, anon;
revoke execute on function public.cancel_booking_v3(uuid,text) from public, anon;
revoke execute on function public.capture_package_purchase_test(uuid,text) from public, anon;
revoke execute on function public.capture_test_payment(uuid) from public, anon;
revoke execute on function public.complete_booking_v3(uuid) from public, anon;
revoke execute on function public.create_checkout_intent(uuid,date,time without time zone,text,text) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.settle_payout_test(uuid) from public, anon;

grant execute on function public.book_with_package(uuid,uuid,date,time without time zone,text,text) to authenticated, service_role;
grant execute on function public.cancel_booking_v3(uuid,text) to authenticated, service_role;
grant execute on function public.capture_package_purchase_test(uuid,text) to authenticated, service_role;
grant execute on function public.capture_test_payment(uuid) to authenticated, service_role;
grant execute on function public.complete_booking_v3(uuid) to authenticated, service_role;
grant execute on function public.create_checkout_intent(uuid,date,time without time zone,text,text) to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.settle_payout_test(uuid) to authenticated, service_role;
