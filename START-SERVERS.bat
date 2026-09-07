@echo off
title Hoftrix CRM Servers
cd /d "%~dp0"

echo Starting Backend + Frontend...
echo Backend : http://localhost:5000
echo Frontend: http://localhost:5173
echo.

start "Hoftrix Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul
start "Hoftrix Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Don windows open ho gaye. Browser mein http://localhost:5173 kholo.
pause
