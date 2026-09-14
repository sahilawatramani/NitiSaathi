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

# 1. Scheme Agent (Port 8001)
Write-Host "Starting Scheme Agent on port 8001..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.scheme_agent.main:app", "--host", "0.0.0.0", "--port", "8001" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\scheme_agent.log" -RedirectStandardError "$LogDir\scheme_agent_err.log"

# 2. Fraud Guard (Port 8002)
Write-Host "Starting Fraud Guard on port 8002..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.fraud_guard.main:app", "--host", "0.0.0.0", "--port", "8002" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\fraud_guard.log" -RedirectStandardError "$LogDir\fraud_guard_err.log"

# 3. Nudge Agent (Port 8004)
Write-Host "Starting Nudge Agent on port 8004..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.nudge_agent.main:app", "--host", "0.0.0.0", "--port", "8004" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\nudge_agent.log" -RedirectStandardError "$LogDir\nudge_agent_err.log"

# 4. Accessibility Agent (Port 8005)
Write-Host "Starting Accessibility Agent on port 8005..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.accessibility_agent.main:app", "--host", "0.0.0.0", "--port", "8005" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\accessibility_agent.log" -RedirectStandardError "$LogDir\accessibility_agent_err.log"

# 5. Literacy Agent (Port 8100)
Write-Host "Starting Literacy Agent on port 8100..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agents.literacy_agent.main:app", "--host", "0.0.0.0", "--port", "8100" -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "$LogDir\literacy_agent.log" -RedirectStandardError "$LogDir\literacy_agent_err.log"

# 6. Budget API Gateway (Port 8000)
Write-Host "Starting Budget API Gateway on port 8000..." -ForegroundColor Yellow
$BudgetBackend = Join-Path $RepoRoot "agents\budget_agent\backend"
Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $BudgetBackend -WindowStyle Hidden -RedirectStandardOutput "$LogDir\budget_api.log" -RedirectStandardError "$LogDir\budget_api_err.log"

# 7. Web Dashboard (Port 3000)
Write-Host "Starting Web Dashboard on port 3000..." -ForegroundColor Yellow
$WebFrontend = Join-Path $RepoRoot "agents\budget_agent\frontend"
Start-Process npm -ArgumentList "run", "dev" -WorkingDirectory $WebFrontend -WindowStyle Hidden -RedirectStandardOutput "$LogDir\web_frontend.log" -RedirectStandardError "$LogDir\web_frontend_err.log"

Write-Host "`nWaiting 5 seconds for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "`n=== Health Check Verification ===" -ForegroundColor Cyan
$endpoints = @(
    @{ Name = "Budget API Gateway (8000)"; Url = "http://localhost:8000/api/health" },
    @{ Name = "Scheme Agent (8001)"; Url = "http://localhost:8001/api/v1/schemes/health" },
    @{ Name = "Fraud Guard Agent (8002)"; Url = "http://localhost:8002/api/v1/fraud-guard/health" },
    @{ Name = "Nudge Agent (8004)"; Url = "http://localhost:8004/nudges/health" },
    @{ Name = "Accessibility Agent (8005)"; Url = "http://localhost:8005/api/v1/accessibility/health" },
    @{ Name = "Literacy Agent (8100)"; Url = "http://localhost:8100/health" },
    @{ Name = "Web Dashboard (3000)"; Url = "http://localhost:3000" }
)

foreach ($ep in $endpoints) {
    try {
        $res = Invoke-WebRequest -Uri $ep.Url -TimeoutSec 3 -UseBasicParsing
        if ($res.StatusCode -eq 200) {
            Write-Host "  ✅ $($ep.Name): OK" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ $($ep.Name): HTTP $($res.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ $($ep.Name): FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "`nNitiSaathi is running! Open http://localhost:3000 in your browser." -ForegroundColor Green
