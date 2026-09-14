# start_all.ps1 — Launch all NitiSaathi microservices and Web frontend on Windows
$ErrorActionPreference = "Continue"

$RepoRoot = $PSScriptRoot
$LogDir = Join-Path $RepoRoot ".logs"
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     Starting NitiSaathi System          " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Literacy Agent (Port 8100) — start early so other agents can query it
Write-Host "Starting Literacy Agent on port 8100..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.literacy_agent.main:app", "--host", "0.0.0.0", "--port", "8100" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\literacy_agent.log" -RedirectStandardError "$LogDir\literacy_agent_err.log"

# 2. Scheme Agent (Port 8001)
Write-Host "Starting Scheme Agent on port 8001..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.scheme_agent.main:app", "--host", "0.0.0.0", "--port", "8001" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\scheme_agent.log" -RedirectStandardError "$LogDir\scheme_agent_err.log"

# 3. Fraud Guard (Port 8002)
Write-Host "Starting Fraud Guard on port 8002..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.fraud_guard.main:app", "--host", "0.0.0.0", "--port", "8002" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\fraud_guard.log" -RedirectStandardError "$LogDir\fraud_guard_err.log"

# 4. Accessibility Agent (Port 8005)
Write-Host "Starting Accessibility Agent on port 8005..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.accessibility_agent.main:app", "--host", "0.0.0.0", "--port", "8005" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\accessibility_agent.log" -RedirectStandardError "$LogDir\accessibility_agent_err.log"

Start-Sleep -Seconds 2

# 5. Nudge Agent (Port 8004)
Write-Host "Starting Nudge Agent on port 8004..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.nudge_agent.main:app", "--host", "0.0.0.0", "--port", "8004" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\nudge_agent.log" -RedirectStandardError "$LogDir\nudge_agent_err.log"

# 6. Budget API Gateway (Port 8000)
Write-Host "Starting Budget API Gateway on port 8000..." -ForegroundColor Yellow
$BudgetBackend = Join-Path $RepoRoot "agents\budget_agent\backend"
Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $BudgetBackend -WindowStyle Hidden -RedirectStandardOutput "$LogDir\budget_api.log" -RedirectStandardError "$LogDir\budget_api_err.log"

# 7. Mobile App / Web (Port 8081)
Write-Host "Starting NitiSaathi Mobile (Web) on port 8081..." -ForegroundColor Yellow
$MobileApp = Join-Path $RepoRoot "mobile"
Start-Process cmd.exe -ArgumentList "/c", "npx", "expo", "start", "--web", "--port", "8081" -WorkingDirectory $MobileApp -WindowStyle Hidden -RedirectStandardOutput "$LogDir\mobile_app.log" -RedirectStandardError "$LogDir\mobile_app_err.log"

Write-Host "`nWaiting 8 seconds for all services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host "`n=== Health Check Verification ===" -ForegroundColor Cyan
$endpoints = @(
    @{ Name = "Literacy Agent (8100)"; Url = "http://localhost:8100/health" },
    @{ Name = "Scheme Agent (8001)"; Url = "http://localhost:8001/api/v1/schemes/health" },
    @{ Name = "Fraud Guard Agent (8002)"; Url = "http://localhost:8002/api/v1/fraud-guard/health" },
    @{ Name = "Accessibility Agent (8005)"; Url = "http://localhost:8005/api/v1/accessibility/health" },
    @{ Name = "Nudge Agent (8004)"; Url = "http://localhost:8004/nudges/health" },
    @{ Name = "Budget API Gateway (8000)"; Url = "http://localhost:8000/api/health" },
    @{ Name = "NitiSaathi App (8081)"; Url = "http://localhost:8081" }
)

foreach ($ep in $endpoints) {
    try {
        $res = Invoke-WebRequest -Uri $ep.Url -TimeoutSec 5 -UseBasicParsing
        if ($res.StatusCode -eq 200) {
            Write-Host "  ✅ $($ep.Name): OK" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ $($ep.Name): HTTP $($res.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ $($ep.Name): FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "`nNitiSaathi is running! Open http://localhost:8081 in your browser." -ForegroundColor Green
Write-Host "Press Ctrl+C or run .\stop_all.ps1 to stop all services." -ForegroundColor Cyan

# Keep script process alive so all background services stay active indefinitely
while ($true) {
    Start-Sleep -Seconds 60
}

