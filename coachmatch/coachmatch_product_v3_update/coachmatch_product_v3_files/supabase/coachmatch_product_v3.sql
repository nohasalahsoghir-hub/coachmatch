-- CoachMatch Product V3: production logic notes / migration reference
-- Base schema already exists in the project. This file records the V3 hardening
-- that is applied to the linked Supabase project and is safe to keep with source.

-- 1) Checkout intent / temporary hold
create table if not exists public.booking_checkout_intents (
  id uuid primary key default extensions.uuid_generate_v4(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  subtotal numeric(12,2) not null check (subtotal > 0),
  checkout_fee numeric(12,2) not null default 10 check (checkout_fee >= 0),
  platform_commission numeric(12,2) not null default 0 check (platform_commission >= 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  currency text not null default 'EGP',
  status text not null default 'pending' check (status in ('pending','paid','expired','cancelled')),
  expires_at timestamptz not null,
  idempotency_key text not null unique,
  booking_id uuid references public.bookings(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  timezone text not null default 'Africa/Cairo',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.bookings add column if not exists hold_expires_at timestamptz;
alter table public.bookings add column if not exists refund_amount numeric(12,2) not null default 0;
alter table public.bookings add column if not exists refunded_at timestamptz;
alter table public.bookings add column if not exists cancelled_by uuid references public.profiles(id) on delete set null;
alter table public.bookings add column if not exists idempotency_key text;
alter table public.payments add column if not exists refunded_amount numeric(12,2) not null default 0;
alter table public.payments add column if not exists refunded_at timestamptz;
alter table public.money_ledger add column if not exists account_type text;
alter table public.money_ledger add column if not exists account_id uuid;
alter table public.profiles add column if not exists linked_auth_id uuid;

create unique index if not exists ux_profiles_linked_auth_id on public.profiles(linked_auth_id) where linked_auth_id is not null;
create unique index if not exists ux_bookings_idempotency_key on public.bookings(idempotency_key) where idempotency_key is not null;
create unique index if not exists ux_payments_provider_reference on public.payments(provider_reference) where provider_reference is not null;
create index if not exists idx_checkout_intents_athlete on public.booking_checkout_intents(athlete_id,created_at desc);
create index if not exists idx_checkout_intents_coach_slot on public.booking_checkout_intents(coach_id,session_date,start_time);
create index if not exists idx_checkout_intents_status_expiry on public.booking_checkout_intents(status,expires_at);
create index if not exists idx_public_reviews_coach on public.public_reviews(coach_id);

-- Prevent double-booking of a coach, athlete, or active checkout hold.
alter table public.bookings drop constraint if exists bookings_no_athlete_overlap;
alter table public.bookings add constraint bookings_no_athlete_overlap
exclude using gist (athlete_id with =, tsrange((session_date + start_time),(session_date + end_time),'[)') with &&)
where (status in ('pending','confirmed'));

alter table public.booking_checkout_intents drop constraint if exists booking_checkout_intents_no_overlap;
alter table public.booking_checkout_intents add constraint booking_checkout_intents_no_overlap
exclude using gist (
  coach_id with =,
  tstzrange(((session_date + start_time) at time zone timezone),((session_date + end_time) at time zone timezone),'[)') with &&
) where (status='pending');

alter table public.booking_checkout_intents drop constraint if exists booking_checkout_intents_athlete_no_overlap;
alter table public.booking_checkout_intents add constraint booking_checkout_intents_athlete_no_overlap
exclude using gist (
  athlete_id with =,
  tstzrange(((session_date + start_time) at time zone timezone),((session_date + end_time) at time zone timezone),'[)') with &&
) where (status='pending');

-- 2) Safe public projections. Do not expose raw profile phone / role columns.
create table if not exists public.coach_public_catalog (
  id uuid primary key references public.coaches(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  bio text,
  sports text[] not null default '{}',
  session_rate numeric(12,2),
  package_8_rate numeric(12,2),
  training_locations text[] not null default '{}',
  is_available_today boolean not null default false,
  rating numeric(4,2),
  total_reviews integer not null default 0,
  experience_years integer not null default 0,
  headline text,
  languages text[] not null default '{}'
);

create table if not exists public.coach_public_profiles (
  id uuid primary key references public.coaches(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  headline text
);

create table if not exists public.public_reviews (
  id uuid primary key references public.reviews(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null
);

-- These tables are public-read but have no user write policies.
alter table public.coach_public_catalog enable row level security;
alter table public.coach_public_profiles enable row level security;
alter table public.public_reviews enable row level security;
drop policy if exists "Public catalog read" on public.coach_public_catalog;
create policy "Public catalog read" on public.coach_public_catalog for select to anon,authenticated using (true);
drop policy if exists "Public profile read" on public.coach_public_profiles;
create policy "Public profile read" on public.coach_public_profiles for select to anon,authenticated using (true);
drop policy if exists "Public review read" on public.public_reviews;
create policy "Public review read" on public.public_reviews for select to anon,authenticated using (true);
grant select on public.coach_public_catalog,public.coach_public_profiles,public.public_reviews to anon,authenticated;

-- 3) Product actions
-- create_checkout_intent(...): calculates server-side price and creates a 10-minute hold.
-- capture_test_payment(...): test/sandbox payment that creates a real product booking/payment/ledger/payout/notifications row.
-- capture_package_purchase_test(...): test/sandbox package purchase in the real package table.
-- book_with_package(...): atomic paid-package usage with idempotency and balance decrement.
-- cancel_booking_v3(...): handles package-session restoration or cash refund according to 24h policy.
-- complete_booking_v3(...): coach-only completion after session end, then creates the payout record and review notification.

-- 4) User creation hardening
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path=public,extensions
as $$
declare requested_role text:=new.raw_user_meta_data->>'role';
begin
  insert into public.profiles(id,linked_auth_id,full_name,phone,role,is_demo)
  values(new.id,new.id,coalesce(new.raw_user_meta_data->>'full_name','مستخدم جديد'),
    coalesce(new.raw_user_meta_data->>'phone',''),
    case when requested_role='coach' then 'coach'::user_role when requested_role='admin' then 'admin'::user_role else 'athlete'::user_role end,false);
  return new;
end;
$$;

-- 5) Security invariants
-- Users cannot change role / seed markers / internal links directly.
-- Coaches cannot directly change verification/rating counters/seed markers.
-- Authenticated users may only create normal (non-seed) pending bookings; seed data is installed by the service-role seed script.
-- Raw public profiles are not exposed; use the projection tables above.


-- 6) Public privacy boundary: raw coaches/profiles are no longer public.
revoke select on public.coaches from anon,authenticated;
drop policy if exists "Anyone can view verified coaches" on public.coaches;
drop policy if exists "Coaches can view own record" on public.coaches;
drop policy if exists "Admins can view coaches" on public.coaches;
create policy "Coaches can view own record" on public.coaches for select to authenticated using ((select auth.uid())=id);
create policy "Admins can view coaches" on public.coaches for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Profiles visible by relationship" on public.profiles;
drop policy if exists "Public profiles of verified coaches" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Coaches can view booked athletes" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to anon,authenticated using ((select auth.uid())=id);
create policy "Coaches can view booked athletes" on public.profiles for select to authenticated using (exists(select 1 from public.bookings b where b.athlete_id=profiles.id and b.coach_id=(select auth.uid())));
create policy "Admins can view profiles" on public.profiles for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Users can view related profiles" on public.profiles;
