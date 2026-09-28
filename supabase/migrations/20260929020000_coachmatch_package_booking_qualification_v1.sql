begin;

create or replace function private.book_with_package_v4(
  p_user_id uuid,
  p_package_id uuid,
  p_coach_id uuid,
  p_session_date date,
  p_start_time time,
  p_location text
)
returns table(
  booking_id uuid,
  coach_id uuid,
  session_date date,
  start_time time,
  total_amount numeric,
  remaining_sessions integer
)
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
  existing public.bookings%rowtype;
  p public.athlete_packages%rowtype;
  v_end time;
  v_rate numeric(12,2);
  v_key text;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول أولًا'; end if;

  v_key:='package:'||p_user_id::text||':'||p_package_id::text||':'||p_coach_id::text||':'||p_session_date::text||':'||p_start_time::text;

  select * into existing from public.bookings where idempotency_key=v_key limit 1;

  if existing.id is not null then
    select ap.remaining_sessions into p.remaining_sessions
    from public.athlete_packages ap
    where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
    return;
  end if;

  select * into p
  from public.athlete_packages ap
  where ap.id=p_package_id
    and ap.athlete_id=p_user_id
    and ap.coach_id=p_coach_id
    and ap.status='active'
    and ap.remaining_sessions>0
    and ap.expires_at>now()
    and ap.is_demo=false
  for update;

  if p.id is null then raise exception 'الباقة غير متاحة أو انتهت'; end if;

  select v.end_time,coalesce(p.session_unit_price,v.session_rate,0)
    into v_end,v_rate
  from private.validate_booking_slot(p_user_id,p_coach_id,p_session_date,p_start_time,p_location) v;

  if v_rate<=0 then raise exception 'قيمة الحصة غير متاحة حاليًا'; end if;

  insert into public.bookings(
    athlete_id,coach_id,package_id,session_date,start_time,end_time,location,status,total_price,
    platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,
    timezone,is_demo,idempotency_key
  )
  values(
    p_user_id,p_coach_id,p.id,p_session_date,p_start_time,v_end,p_location,'confirmed',v_rate,
    0,v_rate,'pending',v_rate,0,0,v_rate,'Africa/Cairo',false,v_key
  )
  returning * into existing;

  update public.athlete_packages ap
  set remaining_sessions=ap.remaining_sessions-1,
      status=case when ap.remaining_sessions-1=0
                  then 'exhausted'::package_status
                  else 'active'::package_status end
  where ap.id=p.id
  returning ap.remaining_sessions into p.remaining_sessions;

  insert into public.package_usage(package_id,booking_id,sessions_used,used_at,status,is_demo)
  values(p.id,existing.id,1,now(),'used',false);

  insert into public.notifications(user_id,type,title,body,link,is_demo)
  values
    (p_user_id,'booking','تم استخدام حصة من باقتك',
     'تم خصم حصة واحدة وتسجيل الموعد بنجاح.','/dashboard',false),
    (p_coach_id,'booking','حجز جديد',
     'تم حجز جلسة جديدة باستخدام باقة المتدرب.','/coach/dashboard',false);

  return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
    existing.total_amount,p.remaining_sessions;

exception
  when exclusion_violation then
    raise exception 'الموعد اتاخد قبل إتمام الحجز، اختاري موعدًا آخر';
  when unique_violation then
    select * into existing from public.bookings where idempotency_key=v_key limit 1;
    if existing.id is null then raise; end if;
    select ap.remaining_sessions into p.remaining_sessions from public.athlete_packages ap where ap.id=existing.package_id;
    return query select existing.id,existing.coach_id,existing.session_date,existing.start_time,
      coalesce(existing.total_amount,existing.total_price),coalesce(p.remaining_sessions,0);
end;
$$;

commit;
