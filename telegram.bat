@echo off
setlocal
title Telegram Media Vault
cd /d "%~dp0"
node launcher.js
if %errorlevel% neq 0 (
  echo.
  echo Server exited with error code %errorlevel%.
  pause
)
