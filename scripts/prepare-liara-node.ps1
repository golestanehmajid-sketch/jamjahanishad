$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$deploy = Join-Path $root "deploy-node"

Write-Host ">> Building application locally..."
Set-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">> Preparing Node.js deploy folder (no Docker build)..."
if (Test-Path $deploy) {
    Remove-Item -Recurse -Force $deploy
}
New-Item -ItemType Directory -Path $deploy | Out-Null

Copy-Item -Recurse (Join-Path $root "dist") -Destination $deploy

$participants = Join-Path $root "participants.json"
if (Test-Path $participants) {
    Copy-Item $participants -Destination $deploy
}

@{
    name         = "jamejahani-shad"
    version      = "1.0.0"
    private      = $true
    scripts      = @{ start = "node dist/server.cjs" }
    dependencies = @{}
} | ConvertTo-Json -Depth 3 | Set-Content (Join-Path $deploy "package.json") -Encoding utf8

@{
    platform = "node"
    port     = 3000
    node     = @{ version = "20" }
} | ConvertTo-Json | Set-Content (Join-Path $deploy "liara.json") -Encoding utf8

@"
.env
.env.*
"@ | Set-Content (Join-Path $deploy ".gitignore") -Encoding utf8

$size = (Get-ChildItem -Recurse $deploy | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host ">> Node deploy folder ready: $deploy ($([math]::Round($size, 1)) MB)"
Write-Host ">> Requires a Node.js app on Liara (not Docker)."
Write-Host ">> Run: npm run deploy:node"
