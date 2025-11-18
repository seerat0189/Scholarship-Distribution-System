# Scholarship Distribution System - Start Script for Windows
# This script checks services and starts the application

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Scholarship Distribution System" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Check if services are running
Write-Host "Checking required services..." -ForegroundColor Yellow

$servicesOk = $true

# Check PostgreSQL (port 5432)
if (Test-Port 5432) {
    Write-Host "✓ PostgreSQL is running on port 5432" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is NOT running on port 5432" -ForegroundColor Red
    $servicesOk = $false
}

# Check Redis (port 6379)
if (Test-Port 6379) {
    Write-Host "✓ Redis is running on port 6379" -ForegroundColor Green
} else {
    Write-Host "✗ Redis is NOT running on port 6379" -ForegroundColor Red
    $servicesOk = $false
}

if (-not $servicesOk) {
    Write-Host ""
    Write-Host "ERROR: Some required services are not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start services with Docker, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install and start them manually:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL: https://www.postgresql.org/download/" -ForegroundColor White
    Write-Host "  - Redis: https://redis.io/download/" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "Starting application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start both frontend and backend
npm run dev
