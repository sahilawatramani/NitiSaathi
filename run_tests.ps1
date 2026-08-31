# PowerShell script to run all tests for Scheme Agent and Fraud Guard

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  nitisaathi Test Suite Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pytest is installed
if (-not (Get-Command pytest -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: pytest not found. Installing dependencies..." -ForegroundColor Red
    pip install -r requirements.txt
}

Write-Host "Running Scheme Agent Tests..." -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
pytest tests/test_scheme_agent.py -v --tb=short
$schemeExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Running Fraud Guard Tests..." -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
pytest tests/test_fraud_guard.py -v --tb=short
$fraudExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($schemeExitCode -eq 0) {
    Write-Host "✓ Scheme Agent Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Scheme Agent Tests: FAILED" -ForegroundColor Red
}

if ($fraudExitCode -eq 0) {
    Write-Host "✓ Fraud Guard Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Fraud Guard Tests: FAILED" -ForegroundColor Red
}

Write-Host ""

# Optional: Run with coverage
$runCoverage = Read-Host "Run tests with coverage report? (y/n)"
if ($runCoverage -eq 'y') {
    Write-Host ""
    Write-Host "Generating coverage report..." -ForegroundColor Yellow
    pytest tests/ --cov=agents --cov-report=html --cov-report=term
    Write-Host ""
    Write-Host "Coverage report generated in htmlcov/index.html" -ForegroundColor Green
}

Write-Host ""
Write-Host "Test run complete!" -ForegroundColor Cyan
