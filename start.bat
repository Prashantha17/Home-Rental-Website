@echo off
title Namma Mane - Startup Manager

echo ===================================================
echo             NAMMA MANE STARTUP MANAGER             
echo ===================================================
echo.

:: Check backend dependencies (venv exists)
if not exist backend\venv (
    echo [WARNING] Backend virtual environment not found.
    echo Running setup first to ensure dependencies are installed...
    call setup.bat
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Setup failed. Cannot start application.
        goto :FAIL
    )
)

:: Check frontend node_modules
if not exist frontend\node_modules (
    echo [WARNING] Frontend node_modules not found.
    echo Running setup first to ensure dependencies are installed...
    call setup.bat
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Setup failed. Cannot start application.
        goto :FAIL
    )
)

echo Starting MongoDB...
echo Note: This script assumes MongoDB is running locally on port 27017 or Atlas cloud.
echo.

echo Starting Namma Mane Backend...
start "Namma Mane Backend (Port 8000)" cmd /k "cd backend && call venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

echo.
echo Starting Namma Mane Frontend...
start "Namma Mane Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo         APPLICATION LAUNCHED SUCCESSFULLY          
echo ===================================================
echo.
echo Backend is starting on:  http://127.0.0.1:8000
echo Frontend is starting on: http://localhost:3000
echo.
echo Closing this controller window. Separate logs will remain open.
timeout /t 5
exit /b 0

:FAIL
pause
exit /b 1
