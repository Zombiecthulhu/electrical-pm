# Electrical Construction PM - Server Restart Script
# This script stops all servers and restarts them cleanly

Write-Host "=== Restarting servers ===" -ForegroundColor Cyan
Write-Host ""

# Stop all servers
& "$PSScriptRoot\stop-servers.ps1"

# Wait a moment
Write-Host "   Waiting 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start servers
& "$PSScriptRoot\start-servers.ps1"

