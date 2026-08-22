"""Sert le build React (frontend/dist) depuis le même process FastAPI."""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def project_root() -> Path:
    # backend/app/spa_static.py → parents: app, backend, repo root
    return Path(__file__).resolve().parent.parent.parent


def resolve_frontend_dist(root: Path | None = None) -> Path | None:
    dist = (root or project_root()) / "frontend" / "dist"
    if (dist / "index.html").is_file():
        return dist
    return None


def _safe_file_under_dist(dist: Path, full_path: str) -> Path | None:
    candidate = (dist / full_path).resolve()
    if not str(candidate).startswith(str(dist.resolve())):
        return None
    if candidate.is_file():
        return candidate
    return None


def mount_frontend_spa(app: FastAPI) -> None:
    dist = resolve_frontend_dist()
    if dist is None:
        return
    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="spa-assets")

    @app.get("/")
    async def spa_index():
        return FileResponse(dist / "index.html")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = _safe_file_under_dist(dist, full_path)
        if file_path is not None:
            return FileResponse(file_path)
        return FileResponse(dist / "index.html")
