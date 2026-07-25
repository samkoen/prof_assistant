from app.config import prepare_database_url


def test_postgres_url_becomes_asyncpg():
    url, ssl = prepare_database_url("postgresql://u:p@localhost:5432/db")
    assert url.startswith("postgresql+asyncpg://")
    assert ssl is False


def test_neon_forces_ssl():
    url, ssl = prepare_database_url(
        "postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/db?sslmode=require"
    )
    assert "asyncpg" in url
    assert "sslmode" not in url
    assert ssl is True


def test_postgres_scheme_alias():
    url, _ = prepare_database_url("postgres://u:p@localhost/db")
    assert url.startswith("postgresql+asyncpg://")
