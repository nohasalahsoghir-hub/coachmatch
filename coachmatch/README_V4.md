# CoachMatch V4 — Real Product, Seeded Data

## Product model
There is one user-facing CoachMatch product. There is no separate Demo application or Demo route.

Seed/test rows are installed in the same product tables and marked internally with `is_demo=true` so they can be cleaned up later. The application does not branch into a separate Demo booking flow.

## Real product flows
- Real coach marketplace backed by `coach_public_catalog`.
- Real coach profiles backed by `coaches` + safe public projections.
- Real availability from `coach_availability` with blocked slots and active checkout holds.
- Checkout intent with server-side price calculation and 10-minute hold.
- Sandbox payment capture using the same real `bookings` and `payments` tables.
- Atomic package purchase and package-session consumption.
- Cancellation/refund logic with ledger reversals.
- Completion only after the scheduled session end.
- Payout eligibility after completion.
- Notifications for booking/payment/package/review/admin events.
- RLS/public projection boundary so raw phone/role/payment fields are not public.

## Seed dataset
The seed script creates authentication identities for the seed coaches and writes 120 coaches into the real product tables, plus availability, bookings, payments, package usage, reviews, payouts, notifications, verification workload and a dispute.

## Deployment
From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\coachmatch_product_v3_update\apply_product_v4.ps1
```

The script applies the source, removes old Demo UI, seeds the real tables, runs invariant verification and `npm run build`, then pushes `main` and deploys Production.

Payment is sandbox-only until a live payment provider is configured; no real money is charged in this stage.
