from pathlib import Path

from app.spa_static import resolve_frontend_dist


def test_resolve_frontend_dist_missing(tmp_path: Path):
    assert resolve_frontend_dist(tmp_path) is None


def test_resolve_frontend_dist_with_index(tmp_path: Path):
    dist = tmp_path / "frontend" / "dist"
    dist.mkdir(parents=True)
    (dist / "index.html").write_text("<html></html>", encoding="utf-8")
    assert resolve_frontend_dist(tmp_path) == dist
