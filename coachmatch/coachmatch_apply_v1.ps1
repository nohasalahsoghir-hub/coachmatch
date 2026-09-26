$ErrorActionPreference='Stop'
$ProjectRoot='K:\.gemini\antigravity\scratch\coachmatch\coachmatch'
$Bundle=Join-Path $PSScriptRoot 'coachmatch_v1_bundle.json'
if(!(Test-Path $ProjectRoot)){throw "مش لاقي مشروع CoachMatch: $ProjectRoot"}
if(!(Test-Path $Bundle)){throw "ملف الحزمة ناقص: $Bundle"}
Set-Location $ProjectRoot
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$backup=Join-Path $ProjectRoot ".coachmatch-backup-$stamp";New-Item -ItemType Directory -Force $backup|Out-Null
$files=Get-Content $Bundle -Raw|ConvertFrom-Json
foreach($p in $files.PSObject.Properties){$rel=$p.Name;$full=Join-Path $ProjectRoot $rel;if(Test-Path $full){$bp=Join-Path $backup $rel;New-Item -ItemType Directory -Force (Split-Path $bp -Parent)|Out-Null;Copy-Item $full $bp -Force};New-Item -ItemType Directory -Force (Split-Path $full -Parent)|Out-Null;$bytes=[Convert]::FromBase64String([string]$p.Value);[IO.File]::WriteAllBytes($full,$bytes)}
Write-Host 'تم تطبيق ملفات V1. جاري npm run build...' -ForegroundColor Cyan
npm run build
if($LASTEXITCODE-ne 0){throw "Build فشل. Backup: $backup"}
git add .
if(!(git diff --cached --quiet)){git commit -m 'feat: finish CoachMatch V1 demo journey';if($LASTEXITCODE-ne 0){throw "git commit فشل. Backup: $backup"}}
Write-Host 'جاري git push...' -ForegroundColor Cyan
git push origin main
if($LASTEXITCODE-ne 0){throw 'git push فشل. بيانات الاعتماد المحلية لـGitHub تحتاج إصلاحًا؛ الكود والبناء تم تجهيزهما محليًا.'}
Write-Host 'تم الانتهاء: build + commit + push.' -ForegroundColor Green
