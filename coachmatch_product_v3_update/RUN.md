# CoachMatch Product V3 — Run

Place/extract this folder anywhere on the Windows machine that has the existing CoachMatch repo. The included script expects the existing project at:

`K:\.gemini\antigravity\scratch\coachmatch\coachmatch`

From the repository root run:

```powershell
powershell -ExecutionPolicy Bypass -File .\coachmatch_product_v3_update\apply_product_v3.ps1
```

The script:

1. Applies the V3 source into the real product.
2. Removes the old user-facing Demo routes/components.
3. Seeds the same real product tables with 120 coaches and realistic transactional data.
4. Verifies booking, package, review and money invariants.
5. Runs the production build.
6. Pushes `main` to GitHub.
7. Deploys production to Vercel.

The linked Supabase project already has the V3 database hardening/migrations applied.

Test accounts are created by the seed script:
- athlete.seed@coachmatch.test
- coach.seed@coachmatch.test
- admin.seed@coachmatch.test
- password: CoachMatch2026!

These are test-only accounts.
