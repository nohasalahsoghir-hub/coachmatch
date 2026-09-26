-- CoachMatch audit hardening V2. This migration was applied to the production Supabase project.
-- Keep this file in source control for reproducibility.

create table if not exists public.money_ledger (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid references public.bookings(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  athlete_id uuid references public.profiles(id) on delete set null,
  coach_id uuid references public.coaches(id) on delete set null,
  entry_type text not null check (entry_type in ('charge','platform_commission','checkout_fee','refund','coach_payout','adjustment')),
  direction text not null check (direction in ('credit','debit')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'EGP',
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

create table if not exists public.demo_money_ledger (
  id uuid primary key default extensions.uuid_generate_v4(),
  booking_id uuid references public.demo_bookings(id) on delete set null,
  payment_id uuid references public.demo_payments(id) on delete set null,
  athlete_id uuid references public.demo_athletes(id) on delete set null,
  coach_id uuid references public.demo_coaches(id) on delete set null,
  entry_type text not null check (entry_type in ('charge','platform_commission','checkout_fee','refund','coach_payout','adjustment')),
  direction text not null check (direction in ('credit','debit')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'EGP',
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  is_demo boolean not null default true
);

alter table public.bookings
  add column if not exists payment_status public.payment_status not null default 'pending',
  add column if not exists subtotal numeric(12,2),
  add column if not exists checkout_fee numeric(12,2) not null default 10,
  add column if not exists platform_commission numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2),
  add column if not exists timezone text not null default 'Africa/Cairo';

alter table public.demo_bookings
  add column if not exists payment_status text not null default 'paid',
  add column if not exists subtotal numeric(12,2),
  add column if not exists checkout_fee numeric(12,2) not null default 0,
  add column if not exists platform_commission numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2),
  add column if not exists timezone text not null default 'Africa/Cairo',
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

create unique index if not exists ux_demo_payment_provider_reference on public.demo_payments(provider_reference) where provider_reference is not null;
create index if not exists idx_money_ledger_booking on public.money_ledger(booking_id);
create index if not exists idx_money_ledger_payment on public.money_ledger(payment_id);
create index if not exists idx_money_ledger_coach on public.money_ledger(coach_id,created_at desc);
create index if not exists idx_demo_money_ledger_booking on public.demo_money_ledger(booking_id);
create index if not exists idx_demo_money_ledger_payment on public.demo_money_ledger(payment_id);
create index if not exists idx_bookings_athlete_status_date on public.bookings(athlete_id,status,session_date,start_time);
create index if not exists idx_bookings_coach_status_date on public.bookings(coach_id,status,session_date,start_time);
create index if not exists idx_reviews_coach_created on public.reviews(coach_id,created_at desc);
create index if not exists idx_demo_bookings_coach_date on public.demo_bookings(coach_id,session_date,start_time) where is_demo=true;
create index if not exists idx_demo_bookings_athlete_date on public.demo_bookings(athlete_id,session_date,start_time) where is_demo=true;

-- The remaining trigger/RLS/RPC definitions are intentionally maintained in migration history on Supabase.
