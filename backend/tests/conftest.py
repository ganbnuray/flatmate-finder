import os
os.environ["PYTHON_DOTENV_DISABLED"] = "1"

import pytest
from pathlib import Path
import psycopg2
from testcontainers.postgres import PostgresContainer

SCHEMA_PATH = Path(__file__).resolve().parent.parent.parent / "db" / "schema.sql"


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:16-alpine", driver=None) as postgres:
        url = postgres.get_connection_url()
        assert "supabase" not in url.lower(), (
            f"DATABASE_URL points at Supabase, not the test container: {url}"
        )

        schema_sql = SCHEMA_PATH.read_text()
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute(schema_sql)
        conn.commit()
        cur.close()
        conn.close()

        os.environ["DATABASE_URL"] = url

        yield postgres

        from db import close_db_pool
        close_db_pool()


@pytest.fixture(scope="function")
def client(postgres_container):
    from app import create_app
    from db import get_db, put_db_connection

    app = create_app()
    app.config["TESTING"] = True

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "TRUNCATE users, profiles, likes, matches, messages, blocks, reports "
        "RESTART IDENTITY CASCADE"
    )
    conn.commit()
    cur.close()
    put_db_connection(conn)

    yield app.test_client()
