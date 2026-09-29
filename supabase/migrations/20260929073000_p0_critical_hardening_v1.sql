begin;

alter table public.coaches
  alter column accepting_bookings set default false,
  alter column is_available_today set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  metadata_phone text := nullif(new.raw_user_meta_data->>'phone','');
begin
  insert into public.profiles(id,linked_auth_id,full_name,phone,role,is_demo)
  values (new.id,new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'مستخدم جديد'),
    coalesce(metadata_phone,'seed-'||replace(new.id::text,'-','')),
    case when requested_role='coach' then 'coach'::public.user_role else 'athlete'::public.user_role end,
    false);

  if requested_role='coach' then
    insert into public.coaches(id,is_verified,accepting_bookings,is_available_today,is_demo)
    values(new.id,false,false,false,false)
    on conflict(id) do nothing;
  end if;
  return new;
end;
$function$;

insert into public.coaches(id,is_verified,accepting_bookings,is_available_today,is_demo)
select p.id,false,false,false,false
from public.profiles p
left join public.coaches c on c.id=p.id
where p.role='coach' and c.id is null
on conflict(id) do nothing;

alter table public.athlete_packages
  add column if not exists is_trial boolean not null default false;

create unique index if not exists one_trial_per_athlete
  on public.athlete_packages(athlete_id) where is_trial=true;

drop function if exists public.activate_package_direct(uuid,text);
drop function if exists private.activate_package_direct(uuid,uuid,text);

create or replace function private.activate_package_direct(p_user_id uuid,p_coach_id uuid)
returns table(package_id uuid,coach_id uuid,total_sessions integer,remaining_sessions integer,expires_at timestamptz,session_unit_price numeric)
language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare c public.coaches%rowtype; existing public.athlete_packages%rowtype; v_unit numeric(12,2);
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  select * into existing from public.athlete_packages
  where athlete_id=p_user_id and is_trial=true order by created_at asc limit 1;
  if existing.id is not null then
    raise exception 'أخدتِ الباقة التجريبية قبل كده. الباقة المجانية متاحة مرة واحدة فقط لكل حساب.';
  end if;
  select * into c from public.coaches where id=p_coach_id and is_verified=true for update;
  if c.id is null then raise exception 'المدرب غير موجود أو غير موثّق'; end if;
  if not c.accepting_bookings then raise exception 'المدرب لا يستقبل حجوزات حاليًا'; end if;
  if coalesce(c.package_8_rate,0)<=0 then raise exception 'الباقة غير متاحة لهذا المدرب'; end if;
  v_unit:=round((c.package_8_rate/8.0)::numeric,2);
  insert into public.athlete_packages(athlete_id,coach_id,total_sessions,remaining_sessions,price_paid,status,expires_at,is_demo,subtotal,checkout_fee,platform_commission,session_unit_price,session_coach_net,activation_key,is_trial)
  values(p_user_id,p_coach_id,8,8,0,'active',now()+interval '90 days',false,0,0,0,v_unit,v_unit,null,true)
  returning * into existing;
  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values(p_user_id,'package','تم تفعيل الباقة التجريبية','تم تفعيل باقة 8 حصص تجريبية. لا يوجد تحصيل إلكتروني حاليًا.','/dashboard',false);
  return query select existing.id,existing.coach_id,existing.total_sessions,existing.remaining_sessions,existing.expires_at,existing.session_unit_price;
exception
  when unique_violation then
    raise exception 'أخدتِ الباقة التجريبية قبل كده. الباقة المجانية متاحة مرة واحدة فقط لكل حساب.';
end;
$function$;

create function public.activate_package_direct(p_coach_id uuid)
returns table(package_id uuid,coach_id uuid,total_sessions integer,remaining_sessions integer,expires_at timestamptz,session_unit_price numeric)
language sql security invoker set search_path=''
as $function$ select * from private.activate_package_direct(auth.uid(),$1); $function$;
revoke all on function public.activate_package_direct(uuid) from public,anon;
grant execute on function public.activate_package_direct(uuid) to authenticated;
revoke all on function private.activate_package_direct(uuid,uuid) from public,anon;
grant execute on function private.activate_package_direct(uuid,uuid) to authenticated;

drop policy if exists "Athletes can insert bookings" on public.bookings;
revoke insert on public.bookings from anon,authenticated;

create or replace function private.assert_future_booking_limit(p_user_id uuid,p_limit integer default 5)
returns void language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v_count integer;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  select count(*) into v_count from public.bookings b
  where b.athlete_id=p_user_id and b.status in('pending','confirmed')
    and ((b.session_date+b.start_time) at time zone coalesce(b.timezone,'Africa/Cairo'))>now();
  if v_count>=p_limit then
    raise exception 'وصلتِ للحد الأقصى وهو 5 حجوزات قادمة في نفس الوقت. أكملي أو ألغِي حجزًا قبل إضافة موعد جديد.';
  end if;
end;
$function$;
grant execute on function private.assert_future_booking_limit(uuid,integer) to authenticated;

create or replace function private.create_booking_direct(p_user_id uuid,p_coach_id uuid,p_session_date date,p_start_time time,p_location text)
returns table(booking_id uuid,coach_id uuid,session_date date,start_time time,end_time time,total_amount numeric)
language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare existing public.bookings%rowtype; c public.coaches%rowtype; v_end time; v_rate numeric(12,2); v_key text;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  if exists(select 1 from public.profiles where id=p_user_id and role='coach') then
    raise exception 'حجز الجلسات متاح لحسابات المتدربين فقط';
  end if;
  v_key:='direct:'||p_user_id::text||':'||p_coach_id::text||':'||p_session_date::text||':'||p_start_time::text;
  select * into existing from public.bookings where idempotency_key=v_key limit 1;
  if existing.id is not null then
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,existing.end_time,coalesce(existing.total_amount,existing.total_price);
    return;
  end if;
  perform private.assert_future_booking_limit(p_user_id,5);
  select v.end_time,v.session_rate into v_end,v_rate from private.validate_booking_slot(p_user_id,p_coach_id,p_session_date,p_start_time,p_location) v;
  select * into c from public.coaches where id=p_coach_id;
  if v_rate<=0 then raise exception 'سعر الحصة غير متاح حاليًا'; end if;
  insert into public.bookings(athlete_id,coach_id,session_date,start_time,end_time,location,status,total_price,platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,timezone,is_demo,idempotency_key)
  values(p_user_id,p_coach_id,p_session_date,p_start_time,v_end,p_location,'confirmed',v_rate,0,v_rate,'pending',v_rate,0,0,v_rate,'Africa/Cairo',coalesce(c.is_demo,false),v_key)
  returning * into existing;
  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values(p_user_id,'booking','تم تأكيد الحجز','تم تسجيل حجزك بنجاح. المنصة لا تحصّل مبالغ إلكترونيًا حاليًا.','/dashboard',coalesce(c.is_demo,false)),
        (p_coach_id,'booking','حجز جديد','تم تسجيل حجز جديد في جدولك.','/coach/dashboard',coalesce(c.is_demo,false));
  return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,existing.end_time,existing.total_amount;
exception
  when exclusion_violation then raise exception 'الموعد اتاخد قبل إتمام الحجز، اختاري موعدًا آخر';
  when unique_violation then
    select * into existing from public.bookings where idempotency_key=v_key limit 1;
    if existing.id is null then raise; end if;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,existing.end_time,coalesce(existing.total_amount,existing.total_price);
end;
$function$;

create or replace function private.book_with_package_v4(p_user_id uuid,p_package_id uuid,p_coach_id uuid,p_session_date date,p_start_time time,p_location text)
returns table(booking_id uuid,coach_id uuid,session_date date,start_time time,total_amount numeric,remaining_sessions integer)
language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare existing public.bookings%rowtype; p public.athlete_packages%rowtype; c public.coaches%rowtype; v_end time; v_rate numeric(12,2); v_key text; v_is_demo boolean;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  v_key:='package:'||p_user_id::text||':'||p_package_id::text||':'||p_coach_id::text||':'||p_session_date::text||':'||p_start_time::text;
  select * into existing from public.bookings where idempotency_key=v_key limit 1;
  if existing.id is not null then
    select ap.remaining_sessions into p.remaining_sessions from public.athlete_packages ap where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
    return;
  end if;
  perform private.assert_future_booking_limit(p_user_id,5);
  select * into p from public.athlete_packages ap where ap.id=p_package_id and ap.athlete_id=p_user_id and ap.coach_id=p_coach_id and ap.status='active' and ap.remaining_sessions>0 and ap.expires_at>now() for update;
  if p.id is null then raise exception 'الباقة غير متاحة أو انتهت'; end if;
  select * into c from public.coaches where id=p_coach_id and is_verified=true;
  if c.id is null then raise exception 'المدرب غير موجود أو غير موثّق'; end if;
  select v.end_time,coalesce(p.session_unit_price,v.session_rate,0) into v_end,v_rate from private.validate_booking_slot(p_user_id,p_coach_id,p_session_date,p_start_time,p_location) v;
  if v_rate<=0 then raise exception 'قيمة الحصة غير متاحة حاليًا'; end if;
  v_is_demo:=coalesce(p.is_demo,false) or coalesce(c.is_demo,false);
  insert into public.bookings(athlete_id,coach_id,package_id,session_date,start_time,end_time,location,status,total_price,platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,timezone,is_demo,idempotency_key)
  values(p_user_id,p_coach_id,p.id,p_session_date,p_start_time,v_end,p_location,'confirmed',v_rate,0,v_rate,'pending',v_rate,0,0,v_rate,'Africa/Cairo',v_is_demo,v_key)
  returning * into existing;
  update public.athlete_packages ap set remaining_sessions=ap.remaining_sessions-1,status=case when ap.remaining_sessions-1=0 then 'exhausted'::package_status else 'active'::package_status end where ap.id=p.id returning ap.remaining_sessions into p.remaining_sessions;
  insert into public.package_usage(package_id,booking_id,sessions_used,used_at,status,is_demo) values(p.id,existing.id,1,now(),'used',v_is_demo);
  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values(p_user_id,'booking','تم استخدام حصة من باقتك','تم خصم حصة واحدة وتسجيل الموعد بنجاح.','/dashboard',v_is_demo),
        (p_coach_id,'booking','حجز جديد','تم حجز جلسة جديدة باستخدام باقة المتدرب.','/coach/dashboard',v_is_demo);
  return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,existing.total_amount,p.remaining_sessions;
exception
  when exclusion_violation then raise exception 'الموعد اتاخد قبل إتمام الحجز، اختاري موعدًا آخر';
  when unique_violation then
    select * into existing from public.bookings where idempotency_key=v_key limit 1;
    if existing.id is null then raise; end if;
    select ap.remaining_sessions into p.remaining_sessions from public.athlete_packages ap where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
end;
$function$;

drop function if exists public.is_admin();
drop function if exists private.is_admin();
drop policy if exists "Authorized users can view profiles" on public.profiles;
create policy "Users can view allowed profiles" on public.profiles for select to authenticated
using (id=(select auth.uid()) or exists(select 1 from public.bookings b where b.athlete_id=profiles.id and b.coach_id=(select auth.uid())));
delete from public.profiles where role='admin' and is_demo=true;
drop index if exists public.coach_availability_unique_slot;
drop index if exists public.ux_reviews_booking_once;
commit;
