import bcrypt
from db import get_db, get_db_cursor, put_db_connection


def register_user(email, password):
    """Registers a new user with hashed password.

    Args:
        email: User email string.
        password: User password string.

    Returns:
        dict: Containing 'user_id' and 'email' of the registered user.

    Raises:
        ValueError: If email is already registered.
    """
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise ValueError("email already registered")

        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
            (email, password_hash),
        )
        user_id = cur.fetchone()["id"]
        conn.commit()

        return {"user_id": user_id, "email": email}

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)


def login_user(email, password):
    """Logs in an existing user by verifying their password.

    Args:
        email: User email string.
        password: User password string.

    Returns:
        dict: Containing 'user_id' and 'email' of the logged-in user.

    Raises:
        ValueError: If login fails due to incorrect credentials or deactivated account.
    """
    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute(
            "SELECT id, email, password_hash, is_active FROM users WHERE email = %s",
            (email,),
        )
        user = cur.fetchone()

        if not user:
            raise ValueError("invalid email or password")

        if not user["is_active"]:
            raise ValueError("account is deactivated")

        if not bcrypt.checkpw(
            password.encode("utf-8"), user["password_hash"].encode("utf-8")
        ):
            raise ValueError("invalid email or password")

        return {"user_id": user["id"], "email": user["email"]}

    except Exception as e:
        raise e
    finally:
        cur.close()
        put_db_connection(conn)
