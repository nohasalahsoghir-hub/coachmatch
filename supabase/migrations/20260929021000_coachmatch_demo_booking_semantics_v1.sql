begin;

create or replace function private.create_booking_direct(
  p_user_id uuid,p_coach_id uuid,p_session_date date,p_start_time time,p_location text
)
returns table(
  booking_id uuid,coach_id uuid,session_date date,start_time time,end_time time,total_amount numeric
)
language plpgsql security definer
set search_path to 'public','extensions'
as $$
declare
  existing public.bookings%rowtype;
  c public.coaches%rowtype;
  v_end time;
  v_rate numeric(12,2);
  v_key text;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  if exists(select 1 from public.profiles where id=p_user_id and role='coach') then
    raise exception 'حجز الجلسات متاح لحسابات المتدربين فقط';
  end if;

  v_key:='direct:'||p_user_id::text||':'||p_coach_id::text||':'||p_session_date::text||':'||p_start_time::text;
  select * into existing from public.bookings where idempotency_key=v_key limit 1;
  if existing.id is not null then
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      existing.end_time,coalesce(existing.total_amount,existing.total_price);
    return;
  end if;

  select v.end_time,v.session_rate into v_end,v_rate
  from private.validate_booking_slot(p_user_id,p_coach_id,p_session_date,p_start_time,p_location) v;

  select * into c from public.coaches where id=p_coach_id;
  if v_rate<=0 then raise exception 'سعر الحصة غير متاح حاليًا'; end if;

  insert into public.bookings(
    athlete_id,coach_id,session_date,start_time,end_time,location,status,total_price,
    platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,
    timezone,is_demo,idempotency_key
  )
  values(
    p_user_id,p_coach_id,p_session_date,p_start_time,v_end,p_location,'confirmed',v_rate,
    0,v_rate,'pending',v_rate,0,0,v_rate,'Africa/Cairo',coalesce(c.is_demo,false),v_key
  )
  returning * into existing;

  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values
    (p_user_id,'booking','تم تأكيد الحجز',
     'تم تسجيل حجزك بنجاح. المنصة لا تحصّل مبالغ إلكترونيًا حاليًا.',
     '/dashboard',coalesce(c.is_demo,false)),
    (p_coach_id,'booking','حجز جديد',
     'تم تسجيل حجز جديد في جدولك.','/coach/dashboard',coalesce(c.is_demo,false));

  return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
    existing.end_time,existing.total_amount;
exception
  when exclusion_violation then raise exception 'الموعد اتاخد قبل إتمام الحجز، اختاري موعدًا آخر';
  when unique_violation then
    select * into existing from public.bookings where idempotency_key=v_key limit 1;
    if existing.id is null then raise; end if;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      existing.end_time,coalesce(existing.total_amount,existing.total_price);
end;
$$;

create or replace function private.book_with_package_v4(
  p_user_id uuid,p_package_id uuid,p_coach_id uuid,p_session_date date,p_start_time time,p_location text
)
returns table(
  booking_id uuid,coach_id uuid,session_date date,start_time time,total_amount numeric,remaining_sessions integer
)
language plpgsql security definer
set search_path to 'public','extensions'
as $$
declare
  existing public.bookings%rowtype;
  p public.athlete_packages%rowtype;
  c public.coaches%rowtype;
  v_end time;
  v_rate numeric(12,2);
  v_key text;
  v_is_demo boolean;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;
  v_key:='package:'||p_user_id::text||':'||p_package_id::text||':'||p_coach_id::text||':'||p_session_date::text||':'||p_start_time::text;

  select * into existing from public.bookings where idempotency_key=v_key limit 1;
  if existing.id is not null then
    select ap.remaining_sessions into p.remaining_sessions from public.athlete_packages ap where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
    return;
  end if;

  select * into p from public.athlete_packages ap
  where ap.id=p_package_id and ap.athlete_id=p_user_id and ap.coach_id=p_coach_id
    and ap.status='active' and ap.remaining_sessions>0 and ap.expires_at>now()
  for update;
  if p.id is null then raise exception 'الباقة غير متاحة أو انتهت'; end if;

  select * into c from public.coaches where id=p_coach_id and is_verified=true;
  if c.id is null then raise exception 'المدرب غير موجود أو غير موثّق'; end if;

  select v.end_time,coalesce(p.session_unit_price,v.session_rate,0)
    into v_end,v_rate
  from private.validate_booking_slot(p_user_id,p_coach_id,p_session_date,p_start_time,p_location) v;
  if v_rate<=0 then raise exception 'قيمة الحصة غير متاحة حاليًا'; end if;

  v_is_demo:=coalesce(p.is_demo,false) or coalesce(c.is_demo,false);

  insert into public.bookings(
    athlete_id,coach_id,package_id,session_date,start_time,end_time,location,status,total_price,
    platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,
    timezone,is_demo,idempotency_key
  )
  values(
    p_user_id,p_coach_id,p.id,p_session_date,p_start_time,v_end,p_location,'confirmed',v_rate,
    0,v_rate,'pending',v_rate,0,0,v_rate,'Africa/Cairo',v_is_demo,v_key
  )
  returning * into existing;

  update public.athlete_packages ap
  set remaining_sessions=ap.remaining_sessions-1,
      status=case when ap.remaining_sessions-1=0 then 'exhausted'::package_status else 'active'::package_status end
  where ap.id=p.id
  returning ap.remaining_sessions into p.remaining_sessions;

  insert into public.package_usage(package_id,booking_id,sessions_used,used_at,status,is_demo)
  values(p.id,existing.id,1,now(),'used',v_is_demo);

  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values
    (p_user_id,'booking','تم استخدام حصة من باقتك','تم خصم حصة واحدة وتسجيل الموعد بنجاح.','/dashboard',v_is_demo),
    (p_coach_id,'booking','حجز جديد','تم حجز جلسة جديدة باستخدام باقة المتدرب.','/coach/dashboard',v_is_demo);

  return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
    existing.total_amount,p.remaining_sessions;
exception
  when exclusion_violation then raise exception 'الموعد اتاخد قبل إتمام الحجز، اختاري موعدًا آخر';
  when unique_violation then
    select * into existing from public.bookings where idempotency_key=v_key limit 1;
    if existing.id is null then raise; end if;
    select ap.remaining_sessions into p.remaining_sessions from public.athlete_packages ap where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
end;
$$;

commit;
