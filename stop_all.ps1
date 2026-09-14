# stop_all.ps1 — Stop all running NitiSaathi microservices on Windows
$ports = @(8000, 8001, 8002, 8004, 8005, 8100, 3000)

Write-Host "Stopping NitiSaathi services on ports: $($ports -join ', ')..." -ForegroundColor Yellow

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -ne 0 -and $pidToKill -ne 4) {
                    Write-Host "Killing process PID $pidToKill on port $port..." -ForegroundColor Cyan
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
            Write-Host "Port $port cleared." -ForegroundColor Green
        } else {
            Write-Host "No process listening on port $port." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not query port $port`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAll NitiSaathi services stopped." -ForegroundColor Green
