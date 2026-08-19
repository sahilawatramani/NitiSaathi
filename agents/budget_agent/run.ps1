Write-Host "Starting FinAssist Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

Write-Host "Starting FinAssist Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); npm run dev"

Write-Host "FinAssist is up and running!" -ForegroundColor Yellow
Write-Host "Backend API API Docs: http://localhost:8000/docs"
Write-Host "Frontend Premium Dashboard: http://localhost:5173"
