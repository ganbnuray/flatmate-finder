import psycopg2
from config import Config

def get_db():
    """Returns a PostgreSQL database connection using DATABASE_URL from Config.

    Returns:
        A psycopg2 connection object.
    """
    return psycopg2.connect(Config.DATABASE_URL)