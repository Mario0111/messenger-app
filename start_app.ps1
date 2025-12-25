Write-Host "Messenger App Launcher" -ForegroundColor Cyan

Write-Host "Cleaning up..." -ForegroundColor Yellow

# Kill all Node.js processes (Stops existing servers)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Close properly named windows (from previous runs of this script)
Get-Process | Where-Object { $_.MainWindowTitle -eq "Messenger Backend" -or $_.MainWindowTitle -eq "Messenger Frontend" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Starting Messenger App..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Messenger Backend' -ForegroundColor Green; cd backend; npm start"

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Messenger Frontend' -ForegroundColor Green; cd frontend; npm run dev"

Write-Host "Servers started." -ForegroundColor Yellow
Write-Host "Note: Previous generic PowerShell windows may remain open but are now disconnected." -ForegroundColor Gray
