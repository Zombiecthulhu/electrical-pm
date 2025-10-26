# Electrical Construction PM - Server Startup Script
# This script safely starts both backend and frontend servers

Write-Host "=== Electrical Construction Project Management - Server Startup ===" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Function to kill processes on a specific port
function Stop-ProcessOnPort {
    param($Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        Write-Host "[WARNING] Port $Port is in use. Stopping existing processes..." -ForegroundColor Yellow
        foreach ($processId in $processes) {
            taskkill /F /PID $processId 2>$null
            Write-Host "          Stopped process $processId" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 2
    }
}

# Failsafe: Kill ALL Node processes if they exist
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "[WARNING] Found existing Node processes. Killing all Node processes for clean start..." -ForegroundColor Yellow
    taskkill /F /IM node.exe 2>$null
    Start-Sleep -Seconds 2
    Write-Host "          Done!" -ForegroundColor Gray
}

# Check and clear ports
Write-Host "[1/3] Checking ports..." -ForegroundColor Green
Stop-ProcessOnPort -Port 5000  # Backend
Stop-ProcessOnPort -Port 3000  # Frontend

# Start backend server
Write-Host ""
Write-Host "[2/3] Starting backend server (port 5000)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

# Wait for backend to start
Write-Host "      Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start frontend server
Write-Host ""
Write-Host "[3/3] Starting frontend server (port 3000)..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "[SUCCESS] Servers starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIP: To stop servers, close both PowerShell windows or run stop-servers.ps1" -ForegroundColor Yellow
Write-Host ""

