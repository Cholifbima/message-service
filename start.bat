@echo off
title SQS Messaging Service Setup

echo.
echo 🚀 Starting SQS Messaging Service...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v16 or higher) first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Check if .env file exists
if not exist "server\.env" (
    echo ⚠️  Environment file not found. Copying from example...
    copy "server\config.example.env" "server\.env"
    echo 📝 Please edit server\.env with your AWS credentials before running the app
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
npm run install:all

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully
) else (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo 1. Edit server\.env with your AWS SQS credentials
echo 2. Run 'npm run dev' to start development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo For production deployment, check README.md for AWS deployment options.
echo.
pause
