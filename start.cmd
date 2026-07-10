@echo off
REM Double-click / cmd wrapper for start.ps1 (bypasses the PowerShell execution policy).
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start.ps1" %*
