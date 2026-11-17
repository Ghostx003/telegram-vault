@echo off
setlocal
title Telegram Media Vault
cd /d "%~dp0"

echo ===================================================
echo   Starting Telegram Media Vault...
echo ===================================================
node launcher.js

echo.
echo ===================================================
echo   Server has stopped.
echo ===================================================
pause
