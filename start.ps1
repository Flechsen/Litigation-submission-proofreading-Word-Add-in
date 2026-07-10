<#
.SYNOPSIS
  Start the Schriftsatzprüfung add-in locally: the Python analysis bridge and the
  Vite dev server, each in its own window. Single-user dev / daily-use launcher.

.DESCRIPTION
  The add-in front-end (this repo) and the analysis engine live in separate repos.
  This launcher starts both:
    1. engine.serve_addin  (from the engine repo's 03_COM-engine folder, so the
       relative prompt-pack path resolves) on http://localhost:8000
    2. the Vite dev server (this repo) on https://localhost:3000, which proxies
       /api to the bridge.
  Then sideload the add-in in Word (see README) and use the ribbon button.

  First-time setup in this repo: `npm install` and `npm run cert` (once).

.PARAMETER Provider
  LLM provider for the bridge: claude (default), openai, or fake (keyless smoke test).

.PARAMETER EngineDir
  Path to the engine repo's 03_COM-engine folder. Defaults to the sibling
  ..\RechtschreibungsTool\03_COM-engine, or $env:SCHRIFTSATZ_ENGINE_DIR if set.

.PARAMETER Port
  Bridge port (default 8000; must match the Vite /api proxy target).

.PARAMETER DryRun
  Print the resolved paths and the commands that would run, then exit.

.EXAMPLE
  .\start.ps1
.EXAMPLE
  .\start.ps1 -Provider fake
.EXAMPLE
  .\start.ps1 -EngineDir 'D:\code\03_COM-engine'
#>
param(
  [ValidateSet('claude', 'openai', 'fake')]
  [string]$Provider = 'claude',
  [string]$EngineDir = $(if ($env:SCHRIFTSATZ_ENGINE_DIR) { $env:SCHRIFTSATZ_ENGINE_DIR } else { Join-Path $PSScriptRoot '..\RechtschreibungsTool\03_COM-engine' }),
  [int]$Port = 8000,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$AddinDir = $PSScriptRoot

if (-not (Test-Path $EngineDir)) {
  Write-Error "Engine directory not found: $EngineDir`nPass -EngineDir <path to 03_COM-engine> or set SCHRIFTSATZ_ENGINE_DIR."
  exit 1
}
$EngineDir = (Resolve-Path $EngineDir).Path

# Prefer the engine repo's venv python (repo root .venv), else PATH python.
$venvPy = Join-Path $EngineDir '..\.venv\Scripts\python.exe'
$py = if (Test-Path $venvPy) { (Resolve-Path $venvPy).Path } else { 'python' }

$bridgeCmd = "Set-Location '$EngineDir'; & '$py' -m engine.serve_addin --provider $Provider --port $Port"
$paneCmd = "Set-Location '$AddinDir'; npm run dev"

Write-Host "Engine : $EngineDir"
Write-Host "Python : $py"
Write-Host "Pane   : $AddinDir"
Write-Host "Bridge : http://localhost:$Port  (provider=$Provider)"
Write-Host ""

if ($DryRun) {
  Write-Host "[dry-run] bridge window would run:" -ForegroundColor Yellow
  Write-Host "  $bridgeCmd"
  Write-Host "[dry-run] pane window would run:" -ForegroundColor Yellow
  Write-Host "  $paneCmd"
  exit 0
}

# Each server in its own window so logs are visible and either can be stopped alone.
Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit', '-Command', $bridgeCmd) -WorkingDirectory $EngineDir
Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit', '-Command', $paneCmd) -WorkingDirectory $AddinDir

Write-Host "Two windows launched. When both are up:"
Write-Host "  - Pane:   https://localhost:3000"
Write-Host "  - Bridge: http://localhost:$Port/api/health"
Write-Host ""
Write-Host "Then open Word and click the sideloaded 'Schriftsatzprüfung' button (see README for one-time sideload)."
