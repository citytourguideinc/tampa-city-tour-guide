# deploy-tours.ps1 - Safe deployment script for tours-ctg Cloud Run service
# Usage: .\deploy-tours.ps1
# This script ALWAYS tags the current revision as stable before deploying,
# so a broken deploy can be rolled back in seconds.

$PROJECT = "gen-lang-client-0080780188"
$SERVICE = "tours-ctg"
$REGION  = "us-east1"
$HEALTH_URL = "https://tours.citytourguide.app/api/health"
$SITE_URL   = "https://tours.citytourguide.app"

Write-Host "`n=== City Tour Guide - Safe Deploy ===" -ForegroundColor Cyan

# Step 1: Verify current service is healthy before touching anything
Write-Host "`n[1/5] Checking current service health..." -ForegroundColor Yellow
try {
    $cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:mptampa2026"))
    $r = Invoke-WebRequest -Uri $SITE_URL -Headers @{Authorization="Basic $cred"} -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "    Current service: OK (HTTP $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "    WARNING: Current service already unhealthy: $_" -ForegroundColor Red
}

# Step 2: Tag the current revision as stable (rollback target)
Write-Host "`n[2/5] Tagging current revision as 'stable' (rollback point)..." -ForegroundColor Yellow
$currentRev = (gcloud run services describe $SERVICE --project=$PROJECT --region=$REGION --format="value(status.latestReadyRevisionName)" 2>&1)
Write-Host "    Current revision: $currentRev"
gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --update-tags="stable=$currentRev" 2>&1 | Out-Null
Write-Host "    Tagged $currentRev as 'stable'" -ForegroundColor Green
Write-Host "    Rollback command: gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100"

# Step 3: Deploy new version
Write-Host "`n[3/5] Deploying new version..." -ForegroundColor Yellow
gcloud run deploy $SERVICE --source . --region $REGION --project $PROJECT --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n    DEPLOY FAILED! Rolling back to stable..." -ForegroundColor Red
    gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100 2>&1
    exit 1
}

# Step 4: Get new revision name
$newRev = (gcloud run services describe $SERVICE --project=$PROJECT --region=$REGION --format="value(status.latestReadyRevisionName)" 2>&1)
Write-Host "    New revision: $newRev" -ForegroundColor Green

# Step 5: Verify new deployment is healthy
Write-Host "`n[4/5] Verifying new deployment health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:mptampa2026"))
    $r = Invoke-WebRequest -Uri $SITE_URL -Headers @{Authorization="Basic $cred"} -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
        Write-Host "    New deployment healthy (HTTP 200)" -ForegroundColor Green
    } else {
        throw "Unexpected status $($r.StatusCode)"
    }
} catch {
    Write-Host "`n    HEALTH CHECK FAILED! Auto-rolling back to stable revision..." -ForegroundColor Red
    gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100 2>&1
    Write-Host "    Rolled back to: $currentRev" -ForegroundColor Yellow
    exit 1
}

# Step 6: Tag new revision as stable
Write-Host "`n[5/5] Tagging new revision as 'stable'..." -ForegroundColor Yellow
gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --update-tags="stable=$newRev" 2>&1 | Out-Null
Write-Host "    $newRev is now the stable revision" -ForegroundColor Green

Write-Host "`n=== Deploy Complete! tours.citytourguide.app is live ===" -ForegroundColor Cyan
Write-Host "    Stable revision: $newRev"
Write-Host "    Emergency rollback: gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100`n"
