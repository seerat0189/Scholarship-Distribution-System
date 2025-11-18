# Scholarship Distribution System - Setup Script for Windows
# This script sets up the entire project including dependencies and services

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Scholarship Distribution System Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host "OK Node.js and npm are installed" -ForegroundColor Green

# Check for Docker (optional but recommended)
if (Test-Command "docker") {
    Write-Host "OK Docker is installed" -ForegroundColor Green
    $useDocker = Read-Host "Do you want to use Docker to run services (PostgreSQL, Redis)? (y/n)"
} else {
    Write-Host "! Docker is not installed. You'll need to manually install PostgreSQL and Redis" -ForegroundColor Yellow
    $useDocker = "n"
}

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm run setup
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend setup failed" -ForegroundColor Red
    exit 1
}
cd ..

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend setup failed" -ForegroundColor Red
    exit 1
}
cd ..

# Setup Docker services if requested
if ($useDocker -eq "y") {
    Write-Host ""
    Write-Host "Setting up Docker services..." -ForegroundColor Yellow
    
    if (Test-Path "docker-compose.yml") {
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK Docker services started successfully" -ForegroundColor Green
            Write-Host "Waiting 10 seconds for services to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        } else {
            Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "! docker-compose.yml not found. Please create it first." -ForegroundColor Yellow
    }
}

# Run database migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
cd backend
npm run prisma:push
cd ..

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure PostgreSQL and Redis are running"
Write-Host "2. Update backend/.env if needed"
Write-Host "3. Run 'npm run dev' to start both frontend and backend"
Write-Host "   OR"
Write-Host "   Run './start.ps1' to start all services with checks"
Write-Host ""
