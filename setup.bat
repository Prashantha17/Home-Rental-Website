@echo off
SETLOCAL EnableDelayedExpansion
title RentYourHome - Setup Wizard

echo ===================================================
echo             RENTYOURHOME SETUP WIZARD             
echo ===================================================
echo.

:: 1. Check for Python
echo [1/4] Checking Python installation...
where python >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Python was not found on your system PATH.
    echo Please install Python 3.9+ and add it to your System PATH.
    goto :FAIL
)
echo Python found.
echo.

:: 2. Check for Node.js / NPM
echo [2/4] Checking Node.js and NPM...
where node >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Node.js was not found on your system PATH.
    echo Please install Node.js (LTS version recommended) and try again.
    goto :FAIL
)
where npm >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo [ERROR] NPM was not found on your system PATH.
    echo Please install Node.js (which includes npm) and try again.
    goto :FAIL
)
echo Node.js and NPM found.
echo.

:: 3. Setup Python Backend Virtual Environment and Dependencies
echo [3/4] Setting up Python Backend Virtual Environment...
cd backend
if not exist venv (
    echo Creating virtual environment 'venv' in backend...
    python -m venv venv
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to create Python virtual environment.
        cd ..
        goto :FAIL
    )
) else (
    echo Virtual environment 'venv' already exists.
)

echo Activating virtual environment...
call venv\Scripts\activate
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Failed to activate virtual environment.
    cd ..
    goto :FAIL
)

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing dependencies from requirements.txt...
pip install -r requirements.txt
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    cd ..
    goto :FAIL
)
echo Python backend setup completed successfully.
cd ..
echo.

:: 4. Setup React Frontend Dependencies
echo [4/4] Setting up React Frontend Dependencies...
cd frontend
echo Running npm install...
call npm install
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    cd ..
    goto :FAIL
)
echo React frontend setup completed successfully.
cd ..
echo.

echo ===================================================
echo             SETUP COMPLETED SUCCESSFULLY!          
echo ===================================================
echo.
echo You are now ready to run the application.
echo Please run start.bat to launch both Frontend and Backend.
echo.
pause
exit /b 0

:FAIL
echo.
echo ===================================================
echo                  SETUP FAILED                      
echo ===================================================
echo Please fix the issues reported above and try again.
echo.
pause
exit /b 1
