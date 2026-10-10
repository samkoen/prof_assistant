from pathlib import Path

DOCKERFILE = Path(__file__).resolve().parents[2] / "Dockerfile"


def _cmd_line() -> str:
    lines = DOCKERFILE.read_text(encoding="utf-8").splitlines()
    return next(line for line in lines if line.startswith("CMD"))


def test_migrations_run_before_the_server_starts():
    cmd = _cmd_line()
    assert "alembic upgrade head" in cmd
    assert cmd.index("alembic upgrade head") < cmd.index("uvicorn")


def test_failed_migration_blocks_the_server():
    assert "alembic upgrade head && " in _cmd_line()  # `&&` : pas de démarrage si échec


def test_server_still_binds_to_render_port():
    cmd = _cmd_line()
    assert "--host 0.0.0.0" in cmd and "${PORT}" in cmd


def test_models_import_like_alembic_env():
    """Alembic charge tous les modèles avant d'appliquer une migration (échec Render)."""
    from app.models import ExamSession  # noqa: F401

    assert ExamSession.__table__.c.status.default is not None
