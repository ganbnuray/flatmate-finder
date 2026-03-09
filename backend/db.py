import os
import psycopg2
from psycopg2.extras import DictCursor

def get_db_connection():
    """
    Returns a PostgreSQL database connection using the DATABASE_URL
    environment variable.
    """
    conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
    return conn

def get_db_cursor(conn):
    """
    Returns a DictCursor so that results can be accessed like dictionaries.
    """
    return conn.cursor(cursor_factory=DictCursor)
