# Crée la base assistant_ai sur PostgreSQL local (si elle n'existe pas)
# Usage: .\scripts\setup-local-db.ps1
# Variables optionnelles: $env:PGUSER, $env:PGPASSWORD, $env:PGHOST, $env:PGPORT

$ErrorActionPreference = "Stop"
$dbName = "assistant_ai"
$pgUser = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$pgHost = if ($env:PGHOST) { $env:PGHOST } else { "localhost" }
$pgPort = if ($env:PGPORT) { $env:PGPORT } else { "5432" }

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "psql introuvable. Créez la base manuellement dans pgAdmin ou psql :" -ForegroundColor Yellow
    Write-Host "  CREATE DATABASE assistant_ai;"
    exit 0
}

$exists = & psql -h $pgHost -p $pgPort -U $pgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>$null
if ($exists -eq "1") {
    Write-Host "La base '$dbName' existe déjà." -ForegroundColor Green
} else {
    & psql -h $pgHost -p $pgPort -U $pgUser -d postgres -c "CREATE DATABASE $dbName;"
    Write-Host "Base '$dbName' créée." -ForegroundColor Green
}

Write-Host ""
Write-Host "Puis dans backend\.env :" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql+asyncpg://${pgUser}:VOTRE_MOT_DE_PASSE@${pgHost}:${pgPort}/${dbName}"
