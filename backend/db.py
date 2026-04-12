import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import DictCursor

_pool = None


def init_db_pool():
    """Initializes the global connection pool."""
    global _pool
    if _pool is None:
        database_url = os.environ.get("DATABASE_URL")
        # Start with a minimum of 1 connection and allow up to 20 concurrent connections.
        _pool = SimpleConnectionPool(1, 20, database_url)


def get_db():
    """
    Returns a PostgreSQL database connection from the connection pool.

    Returns:
        A psycopg2 connection object.
    """
    global _pool
    if _pool is None:
        init_db_pool()
    return _pool.getconn()


def put_db_connection(conn):
    """
    Returns the connection back to the global connection pool.

    Args:
        conn: The psycopg2 database connection.
    """
    global _pool
    if _pool and conn:
        _pool.putconn(conn)


def close_db_pool():
    """Closes all connections in the pool. Used for app shutdown."""
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None


def get_db_cursor(conn):
    """Returns a DictCursor so that results can be accessed like dictionaries.

    Args:
        conn: The psycopg2 database connection.

    Returns:
        A psycopg2 DictCursor.
    """
    return conn.cursor(cursor_factory=DictCursor)
