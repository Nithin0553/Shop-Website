@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 20 or newer from https://nodejs.org/
  pause
  exit /b 1
)
if not exist ".env" (
  echo First-time setup - generating a secure admin password...
  node scripts\setup.mjs
  echo.
  echo IMPORTANT: Save the admin password printed above.
  echo.
  pause
)
echo Starting Sri Sai Shanmukha Auto Centre...
echo Website: http://localhost:3000

echo Admin:   http://localhost:3000/admin

echo Press Ctrl+C to stop.
node server.mjs
pause
