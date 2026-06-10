$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$deploy = Join-Path $root "deploy"

Write-Host ">> Building application locally (frontend + bundled server)..."
Set-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">> Preparing deploy folder..."
if (Test-Path $deploy) {
    Remove-Item -Recurse -Force $deploy
}
New-Item -ItemType Directory -Path $deploy | Out-Null

Copy-Item (Join-Path $root "Dockerfile") -Destination $deploy
Copy-Item -Recurse (Join-Path $root "dist") -Destination $deploy

Copy-Item (Join-Path $root "liara.json") -Destination $deploy

@"
.env
.env.*
"@ | Set-Content (Join-Path $deploy ".gitignore") -Encoding utf8

$size = (Get-ChildItem -Recurse $deploy | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host ">> Deploy folder ready: $deploy ($([math]::Round($size, 1)) MB)"
Write-Host ">> Build location: IRAN (fast push, no npm on server)"
Write-Host ">> Run: npm run deploy:liara"
