# CoachMatch — Real Product + Seed Data

CoachMatch is one product. There is no separate user-facing demo application.

Seed data is loaded into the same production tables (`profiles`, `coaches`, `coach_sports`, `coach_availability`, `bookings`, `payments`, `athlete_packages`, `reviews`, `notifications`, `payouts`, `disputes`) and marked internally with `is_demo=true` only so the team can identify test records. The application itself uses the same booking, payment, package, cancellation, review, payout and admin flows for both seed and future real records.

Payment uses a sandbox provider in this stage, so no real money is moved. The business rules, amounts, ledger entries and state transitions are the production path.
