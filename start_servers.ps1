#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start both Scheme Agent and Fraud Guard servers in separate terminals

.DESCRIPTION
    This script starts:
    - Scheme Agent on http://127.0.0.1:8001
    - Fraud Guard on http://127.0.0.1:8002
    
    Both servers run with auto-reload enabled for development.

.EXAMPLE
    .\start_servers.ps1
#>

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " nitisaathi - Starting API Servers" -ForegroundColor Cyan  
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Virtual environment not activated!" -ForegroundColor Yellow
    Write-Host "Run: myenv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ Virtual environment: $env:VIRTUAL_ENV" -ForegroundColor Green
Write-Host ""

# Check if ports are already in use
$port8001 = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
$port8002 = Get-NetTCPConnection -LocalPort 8002 -State Listen -ErrorAction SilentlyContinue

if ($port8001) {
    Write-Host "⚠️  Port 8001 already in use!" -ForegroundColor Yellow
    Write-Host "Stop existing Scheme Agent server first." -ForegroundColor Yellow
    Write-Host ""
}

if ($port8002) {
    Write-Host "⚠️  Port 8002 already in use!" -ForegroundColor Yellow
    Write-Host "Stop existing Fraud Guard server first." -ForegroundColor Yellow
    Write-Host ""
}

if ($port8001 -or $port8002) {
    Write-Host "Press Ctrl+C to cancel or Enter to continue anyway..."
    Read-Host
}

# Start Scheme Agent in new terminal
Write-Host "Starting Scheme Agent (Port 8001)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\myenv\Scripts\Activate.ps1; uvicorn agents.scheme_agent.main:app --reload --port 8001"

Start-Sleep -Seconds 2

# Start Fraud Guard in new terminal
Write-Host "Starting Fraud Guard (Port 8002)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\myenv\Scripts\Activate.ps1; uvicorn agents.fraud_guard.main:app --reload --port 8002"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " Servers Starting..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Scheme Agent: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "Fraud Guard:  http://127.0.0.1:8002/docs" -ForegroundColor White
Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Yellow
Write-Host "  curl http://127.0.0.1:8001/api/v1/schemes/health" -ForegroundColor Gray
Write-Host "  curl http://127.0.0.1:8002/api/v1/fraud-guard/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop servers" -ForegroundColor DarkGray
Write-Host ""
