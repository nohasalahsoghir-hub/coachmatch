-- Removes CoachMatch demo records without touching real records.
-- Safety: production rows are protected by is_demo = true predicates.
begin;
delete from public.demo_disputes where is_demo = true;
delete from public.demo_payouts where is_demo = true;
delete from public.demo_payments where is_demo = true;
delete from public.demo_bookings where is_demo = true;
delete from public.demo_packages where is_demo = true;
delete from public.demo_reviews where is_demo = true;
delete from public.demo_notifications where is_demo = true;
delete from public.demo_money_ledger where is_demo = true;
delete from public.demo_coach_availability where is_demo = true;
delete from public.demo_verification_requests where is_demo = true;
delete from public.demo_coaches where is_demo = true;
delete from public.demo_athletes where is_demo = true;
delete from public.money_ledger where is_demo = true;
delete from public.reviews where is_demo = true;
delete from public.bookings where is_demo = true;
delete from public.athlete_packages where is_demo = true;
delete from public.coach_verification_requests where is_demo = true;
delete from public.coach_blocked_slots where is_demo = true;
delete from public.coach_availability where is_demo = true;
delete from public.coaches where is_demo = true;
delete from public.profiles where is_demo = true;
rollback;
