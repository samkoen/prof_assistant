# Lance l'API en dev — à exécuter depuis backend/
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    if (Test-Path "..\.env") {
        Copy-Item "..\.env" ".env"
        Write-Host "Copie de ..\.env vers backend\.env" -ForegroundColor Yellow
    } else {
        Write-Host "Fichier backend\.env manquant. Copiez .env.example vers .env" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
.\.venv\Scripts\pip install -r requirements.txt

Write-Host "Init DB..." -ForegroundColor Cyan
.\.venv\Scripts\python.exe -m scripts.init_db
.\.venv\Scripts\python.exe -m scripts.seed_admin

Write-Host "API: http://127.0.0.1:8000" -ForegroundColor Green
.\.venv\Scripts\python.exe run.py
