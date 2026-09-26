# CoachMatch V2 — Demo Guide

## Public product
- `/` — landing page
- `/coaches` — coach discovery with search, sport, location, price, availability and pagination
- `/coaches/<id>` — public coach profile and real demo slots
- `/dashboard` — real athlete dashboard
- `/coach/dashboard` — real coach dashboard

## Judge demo
- `/demo` — demo control center
- `/demo/athlete` — athlete journey (Sarah Ahmed)
- `/demo/coach` — coach journey tied to the latest demo booking
- `/demo/admin` — operations journey

## Important behavior
- Demo payments are simulated and never claim to charge real money.
- Demo bookings are created only from the coach's availability table and block occupied slots.
- A confirmed booking requires a successful demo payment.
- A real booking is explicitly marked as pending payment because no real payment provider is configured yet.
- Public profiles do not expose phone or InstaPay fields.
