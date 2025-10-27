# Electrical Construction PM - Server Stop Script
# This script safely stops all Node.js processes for this project

Write-Host "=== Stopping all servers ===" -ForegroundColor Red
Write-Host ""

# Function to stop processes on a specific port
function Stop-ProcessOnPort {
    param($Port, $Name)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        Write-Host "   Stopping $Name (port $Port)..." -ForegroundColor Yellow
        foreach ($pid in $processes) {
            $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).Name
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "      Stopped PID $pid ($processName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   $Name (port $Port) - not running" -ForegroundColor Gray
    }
}

# Stop specific ports
Stop-ProcessOnPort -Port 5000 -Name "Backend"
Stop-ProcessOnPort -Port 3000 -Name "Frontend"

Write-Host ""
Write-Host "[SUCCESS] All servers stopped!" -ForegroundColor Green
Write-Host ""

# Optional: Offer to kill ALL node processes
Write-Host "[WARNING] Do you want to kill ALL Node.js processes? (Y/N)" -ForegroundColor Yellow
$response = Read-Host "          This will stop any other Node apps running"

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "   Killing all Node.js processes..." -ForegroundColor Red
    taskkill /F /IM node.exe 2>$null
    Write-Host "   Done!" -ForegroundColor Green
}

Write-Host ""

