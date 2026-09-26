$ErrorActionPreference = 'Stop'
$ProjectRoot = 'K:\.gemini\antigravity\scratch\coachmatch\coachmatch'
$PatchRoot = Join-Path $PSScriptRoot 'coachmatch_v2_files'
if (!(Test-Path $ProjectRoot)) { throw "مش لاقي مشروع CoachMatch: $ProjectRoot" }
if (!(Test-Path $PatchRoot)) { throw "ملفات V2 ناقصة: $PatchRoot" }
Set-Location $ProjectRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $env:TEMP "coachmatch-v2-backup-$stamp"
New-Item -ItemType Directory -Force $backup | Out-Null
$copied = 0
try {
  Get-ChildItem $PatchRoot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($PatchRoot.Length).TrimStart('\')
    $dest = Join-Path $ProjectRoot $rel
    if (Test-Path $dest) {
      $bak = Join-Path $backup $rel
      New-Item -ItemType Directory -Force (Split-Path $bak -Parent) | Out-Null
      Copy-Item $dest $bak -Force
    }
    New-Item -ItemType Directory -Force (Split-Path $dest -Parent) | Out-Null
    Copy-Item $_.FullName $dest -Force
    $copied++
  }

  # Remove helper artifacts accidentally committed by V1 and keep the repository clean.
  Remove-Item '.coachmatch-backup-*' -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item 'coachmatch_v1_bundle.json','coachmatch_apply_v1.ps1','coachmatch_v1_update.zip' -Force -ErrorAction SilentlyContinue

  Write-Host "تم تطبيق V2 ($copied ملفات). جاري build..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build فشل. النسخة الاحتياطية: $backup" }

  git add .
  if (!(git diff --cached --quiet)) {
    git commit -m 'feat: harden booking money flow and redesign CoachMatch UX'
    if ($LASTEXITCODE -ne 0) { throw "git commit فشل. النسخة الاحتياطية: $backup" }
  }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw "git push فشل. النسخة الاحتياطية: $backup" }

  Write-Host 'تم GitHub بنجاح. جاري Production Deploy عبر Vercel...' -ForegroundColor Cyan
  npx vercel --prod
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'الكود اتبنى واترفع على GitHub، لكن Vercel لم يكمل. شغّلي npx vercel --prod مرة أخرى من نفس المجلد.'
  } else {
    Write-Host 'تم الانتهاء: V2 + build + GitHub + Vercel.' -ForegroundColor Green
  }
}
catch {
  Write-Error $_
  Write-Host "النسخة الأصلية محفوظة هنا: $backup" -ForegroundColor Yellow
  exit 1
}
