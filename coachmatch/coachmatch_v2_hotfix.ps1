$ErrorActionPreference = 'Stop'
$ProjectRoot = 'K:\.gemini\antigravity\scratch\coachmatch\coachmatch'
Set-Location $ProjectRoot

$file = Join-Path $ProjectRoot 'app\coach\dashboard\page.tsx'
$content = Get-Content $file -Raw
$content = $content.Replace('profiles?: { full_name: string | null; phone?: string | null } | null;', 'profiles?: { full_name: string | null; phone?: string | null }[] | null;')
$content = $content.Replace('athleteName: booking.profiles?.full_name ?? "متدرب",', 'athleteName: booking.profiles?.[0]?.full_name ?? "متدرب",')
$content = $content.Replace('athletePhone: booking.profiles?.phone ?? "",', 'athletePhone: booking.profiles?.[0]?.phone ?? "",')
Set-Content $file $content -Encoding UTF8

Write-Host 'تم إصلاح خطأ نوع profiles في لوحة المدرب. جاري build...' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build ما زال يفشل. ابعتي آخر خطأ بالكامل.' }

Write-Host 'Build نجح. جاري GitHub...' -ForegroundColor Cyan
git add app/coach/dashboard/page.tsx
git commit -m 'fix: normalize coach dashboard profile relation'
if ($LASTEXITCODE -ne 0) { throw 'git commit فشل.' }
git push origin main
if ($LASTEXITCODE -ne 0) { throw 'git push فشل.' }

Write-Host 'GitHub تم. جاري Vercel Production...' -ForegroundColor Cyan
npx vercel --prod
if ($LASTEXITCODE -ne 0) { throw 'Vercel deploy فشل. أعيدي npx vercel --prod.' }
Write-Host 'تم الإصلاح والـ build وGitHub وVercel بنجاح.' -ForegroundColor Green
