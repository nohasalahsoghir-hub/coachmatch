CoachMatch V2 — audit hardening + UX rebuild

1) Download/put this ZIP in:
K:\.gemini\antigravity\scratch\coachmatch\coachmatch

2) Extract in that folder with overwrite.

3) Run:
powershell -ExecutionPolicy Bypass -File .\coachmatch_apply_v2.ps1

The script backs up overwritten files to %TEMP%, applies V2, removes the old accidental V1 helper artifacts, runs npm run build, pushes main, then starts npx vercel --prod.

Supabase audit/money/state changes are already applied to the CoachMatch Supabase project.
