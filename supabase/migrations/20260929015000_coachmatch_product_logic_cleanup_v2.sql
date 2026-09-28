begin;

alter table public.athlete_packages
  drop constraint if exists athlete_packages_remaining_sessions_check;
alter table public.athlete_packages
  add constraint athlete_packages_remaining_sessions_check
  check (remaining_sessions >= 0 and remaining_sessions <= total_sessions);

create or replace function private.refresh_coach_public_catalog(p_coach_id uuid)
returns void language plpgsql security definer
set search_path to 'public','extensions'
as $$
declare c public.coaches%rowtype; name text; avatar text; has_today_slot boolean;
begin
  select * into c from public.coaches where id=p_coach_id;
  if c.id is null or not c.is_verified then
    delete from public.coach_public_catalog where id=p_coach_id;
    delete from public.coach_public_profiles where id=p_coach_id;
    return;
  end if;
  select pr.full_name,pr.avatar_url into name,avatar from public.profiles pr where pr.id=p_coach_id;
  select exists(select 1 from private.get_public_coach_slots(c.id,1)) into has_today_slot;
  insert into public.coach_public_catalog(
    id,full_name,avatar_url,bio,sports,session_rate,package_8_rate,
    training_locations,accepting_bookings,is_available_today,rating,total_reviews,
    experience_years,headline,languages
  )
  values(
    c.id,coalesce(name,'مدرب'),avatar,c.bio,c.sports,c.session_rate,c.package_8_rate,
    c.training_locations,c.accepting_bookings,(c.accepting_bookings and has_today_slot),
    c.rating,c.total_reviews,c.experience_years,c.headline,c.languages
  )
  on conflict(id) do update set
    full_name=excluded.full_name,avatar_url=excluded.avatar_url,bio=excluded.bio,
    sports=excluded.sports,session_rate=excluded.session_rate,package_8_rate=excluded.package_8_rate,
    training_locations=excluded.training_locations,accepting_bookings=excluded.accepting_bookings,
    is_available_today=excluded.is_available_today,rating=excluded.rating,
    total_reviews=excluded.total_reviews,experience_years=excluded.experience_years,
    headline=excluded.headline,languages=excluded.languages;
  insert into public.coach_public_profiles(id,full_name,avatar_url,headline)
  values(c.id,coalesce(name,'مدرب'),avatar,c.headline)
  on conflict(id) do update set
    full_name=excluded.full_name,avatar_url=excluded.avatar_url,headline=excluded.headline;
end;
$$;

drop function if exists public.create_checkout_intent(uuid,date,time,text,text);
drop function if exists public.capture_test_payment(uuid);
drop function if exists public.capture_package_purchase_test(uuid,text);
drop function if exists public.settle_payout_test(uuid);
drop function if exists private.create_checkout_intent(uuid,date,time,text,text);
drop function if exists private.capture_test_payment(uuid);
drop function if exists private.capture_package_purchase_test(uuid,text);
drop function if exists private.settle_payout_test(uuid);

commit;
