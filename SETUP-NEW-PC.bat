@echo off
title Hoftrix CRM - First Time Setup
cd /d "%~dp0"

echo.
echo === Hoftrix CRM Setup ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not installed. Install from https://nodejs.org
  pause
  exit /b 1
)

echo Installing frontend packages...
call npm install
if errorlevel 1 (
  echo npm install failed
  pause
  exit /b 1
)

echo.
echo Running local setup + admin seed...
call npm run setup:local
if errorlevel 1 (
  echo.
  echo Setup failed. Make sure MongoDB is installed and running.
  pause
  exit /b 1
)

echo.
echo === DONE ===
echo Ab START-SERVERS.bat double-click karke servers chalao.
echo.
pause
