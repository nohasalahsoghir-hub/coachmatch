begin;

create temp table _keep_demo_coaches on commit drop as
select id
from public.coaches
where is_demo = true
  and sports[1] in ('كرة السلة','الكرة الطائرة','كرة القدم','كرة اليد','السباحة');

create temp table _remove_demo_coaches on commit drop as
select id
from public.coaches
where is_demo = true
  and id not in (select id from _keep_demo_coaches);

delete from public.booking_status_history
where is_demo = true
  and booking_id in (
    select id from public.bookings
    where is_demo = true and coach_id in (select id from _remove_demo_coaches)
  );

delete from public.public_reviews
where coach_id in (select id from _remove_demo_coaches);

delete from public.package_usage
where is_demo = true
  and (
    booking_id in (
      select id from public.bookings
      where is_demo = true and coach_id in (select id from _remove_demo_coaches)
    )
    or package_id in (
      select id from public.athlete_packages
      where is_demo = true and coach_id in (select id from _remove_demo_coaches)
    )
  );

delete from public.money_ledger
where is_demo = true
  and (
    coach_id in (select id from _remove_demo_coaches)
    or booking_id in (
      select id from public.bookings
      where is_demo = true and coach_id in (select id from _remove_demo_coaches)
    )
    or payment_id in (
      select id from public.payments
      where is_demo = true and coach_id in (select id from _remove_demo_coaches)
    )
  );

delete from public.payments
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.payouts
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.disputes
where is_demo = true
  and booking_id in (
    select id from public.bookings
    where is_demo = true and coach_id in (select id from _remove_demo_coaches)
  );

delete from public.notifications
where is_demo = true
  and user_id in (select id from _remove_demo_coaches);

delete from public.coach_verification_requests
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.coach_blocked_slots
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.coach_availability
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.coach_sports
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.athlete_packages
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.bookings
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.reviews
where is_demo = true
  and coach_id in (select id from _remove_demo_coaches);

delete from public.coaches
where is_demo = true
  and id in (select id from _remove_demo_coaches);

delete from public.profiles
where is_demo = true
  and role = 'coach'
  and id in (select id from _remove_demo_coaches);

commit;
