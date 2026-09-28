$ErrorActionPreference = "Stop"
$repoRoot = "K:\.gemini\antigravity\scratch\coachmatch"
$projectRoot = Join-Path $repoRoot "coachmatch"
$patchRoot = Join-Path $PSScriptRoot "coachmatch_product_v3_files"
if (!(Test-Path $projectRoot)) { throw "مش لاقي مشروع CoachMatch: $projectRoot" }
if (!(Test-Path $patchRoot)) { throw "ملفات CoachMatch V4 ناقصة: $patchRoot" }
Set-Location $projectRoot
Get-ChildItem $patchRoot -Recurse -File | ForEach-Object {
  $rel=$_.FullName.Substring($patchRoot.Length).TrimStart('\')
  $dest=Join-Path $projectRoot $rel
  $parent=Split-Path $dest -Parent
  if (!(Test-Path $parent)) { New-Item -ItemType Directory -Force $parent | Out-Null }
  [System.IO.File]::Copy($_.FullName,$dest,$true)
}
$remove=@(
  "$projectRoot\app\demo",
  "$projectRoot\components\demo",
  "$projectRoot\lib\demo.ts",
  "$repoRoot\coachmatch_v2_files",
  "$repoRoot\coachmatch_v2_hotfix.ps1",
  "$repoRoot\coachmatch_apply_v2.ps1",
  "$repoRoot\DEMO_GUIDE.md",
  "$repoRoot\README_V2.txt",
  "$projectRoot\coachmatch_apply_v2.ps1",
  "$projectRoot\coachmatch_v2_update.zip",
  "$projectRoot\coachmatch_v1_update.zip"
)
foreach($p in $remove){ if(Test-Path $p){ Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue } }
Write-Host "Seeding the real CoachMatch tables..." -ForegroundColor Cyan
node .\scripts\seed-real-product.mjs
if($LASTEXITCODE-ne 0){ throw "Seed فشل." }
Write-Host "Verifying product invariants..." -ForegroundColor Cyan
node .\scripts\verify-product-v3.mjs
if($LASTEXITCODE-ne 0){ throw "Verification فشل." }
Write-Host "Running production build..." -ForegroundColor Cyan
npm run build
if($LASTEXITCODE-ne 0){ throw "Build فشل. لم يتم عمل push." }
Set-Location $repoRoot
git add -A
git status --short
if(!(git diff --cached --quiet)){
  git commit -m "feat: ship real CoachMatch product with seeded data"
  if($LASTEXITCODE-ne 0){ throw "git commit فشل." }
}
git push origin main
if($LASTEXITCODE-ne 0){ throw "git push فشل." }
Set-Location $projectRoot
npx vercel --prod --yes
if($LASTEXITCODE-ne 0){ throw "Vercel deploy فشل." }
Write-Host "CoachMatch V4 تم بناؤه والتحقق منه ورفعه ونشره بنجاح." -ForegroundColor Green
