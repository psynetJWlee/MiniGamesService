@echo off
cd /d "%~dp0"

echo ============================================
echo   MiniGames - Dev Server
echo ============================================
echo.

if not exist "node_modules" (
    echo Installing packages for the first time, please wait...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Is Node.js installed?
        pause
        exit /b 1
    )
    echo.
)

echo Starting dev server...
echo Open the "Local" URL shown below in your browser.
echo Press Ctrl+C in this window to stop.
echo.
call npm run dev -- --port 4000

echo.
echo Server stopped.
pause
