# deploy-tours.ps1 - Safe deployment script for tours-ctg Cloud Run service
# RULES: 
#   1. Always run this script instead of raw gcloud run deploy
#   2. Never point tours-ctg to a different service image
#   3. tours.citytourguide.app must always be PUBLIC (no basic auth)

$PROJECT = "gen-lang-client-0080780188"
$SERVICE = "tours-ctg"
$REGION  = "us-east1"
$SITE_URL = "https://tours.citytourguide.app"

Write-Host "`n=== City Tour Guide - Safe Deploy ===" -ForegroundColor Cyan

# Step 1: Verify current service is healthy
Write-Host "`n[1/6] Checking current service health..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri $SITE_URL -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "    Current service: OK (HTTP $($r.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "    WARNING: Current service already unhealthy: $_" -ForegroundColor Red
}

# Step 2: Tag current revision as stable (rollback point)
Write-Host "`n[2/6] Tagging current revision as stable (rollback point)..." -ForegroundColor Yellow
$currentRev = (gcloud run services describe $SERVICE --project=$PROJECT --region=$REGION --format="value(status.latestReadyRevisionName)" 2>&1)
Write-Host "    Saving: $currentRev"
gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --update-tags="stable=$currentRev" 2>&1 | Out-Null
Write-Host "    Rollback command if needed:" -ForegroundColor Yellow
Write-Host "    gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100" -ForegroundColor White

# Step 3: Deploy new version
Write-Host "`n[3/6] Deploying new version..." -ForegroundColor Yellow
gcloud run deploy $SERVICE --source . --region $REGION --project $PROJECT --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n    DEPLOY FAILED! Rolling back to stable..." -ForegroundColor Red
    gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100 2>&1
    exit 1
}

# Step 4: CRITICAL - Route 100% traffic to latest revision
Write-Host "`n[4/6] Routing 100% traffic to latest revision..." -ForegroundColor Yellow
gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-latest 2>&1
$newRev = (gcloud run services describe $SERVICE --project=$PROJECT --region=$REGION --format="value(status.latestReadyRevisionName)" 2>&1)
Write-Host "    Live revision: $newRev" -ForegroundColor Green

# Step 5: Verify new deployment - MUST be public (no auth)
Write-Host "`n[5/6] Verifying new deployment is PUBLIC (no login)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
try {
    $r = Invoke-WebRequest -Uri $SITE_URL -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
        Write-Host "    PUBLIC access: OK (HTTP 200, no login required)" -ForegroundColor Green
    }
} catch [System.Net.WebException] {
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -eq 401) {
        Write-Host "`n    CRITICAL: Site requires login! Rolling back..." -ForegroundColor Red
        gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100 2>&1
        Write-Host "    Rolled back. Fix middleware.js tours subdomain detection." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "    WARNING: Unexpected status $status - $_" -ForegroundColor Red
}

# Step 6: Tag new revision as stable
Write-Host "`n[6/6] Tagging new revision as stable..." -ForegroundColor Yellow
gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --update-tags="stable=$newRev" 2>&1 | Out-Null
Write-Host "    $newRev is now the stable revision" -ForegroundColor Green

Write-Host "`n=== Deploy Complete! tours.citytourguide.app is live ===" -ForegroundColor Cyan
Write-Host "    Stable revision : $newRev"
Write-Host "    Emergency rollback: gcloud run services update-traffic $SERVICE --project=$PROJECT --region=$REGION --to-tags=stable=100`n"
