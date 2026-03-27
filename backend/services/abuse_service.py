import psycopg2
from db import get_db, get_db_cursor, put_db_connection


def block_user(current_user_id, target_user_id):
    """Blocks a user, preventing them from appearing in future feeds or matches.

    Args:
        current_user_id: The UUID of the user issuing the block.
        target_user_id: The UUID of the user being blocked.

    Returns:
        dict: A success message dict.

    Raises:
        ValueError: If trying to block themselves or the target doesn't exist.
    """
    if current_user_id == target_user_id:
        raise ValueError("cannot block yourself")

    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute(
            "INSERT INTO blocks (blocker_id, blocked_id) VALUES (%s, %s)",
            (current_user_id, target_user_id),
        )
        conn.commit()
        return {"message": "user blocked successfully"}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return {"message": "user already blocked"}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)


def report_user(current_user_id, target_user_id, reason, details=""):
    """Submits a report against a user for moderation review.

    Args:
        current_user_id: The UUID of the user submitting the report.
        target_user_id: The UUID of the user being reported.
        reason: The category of the report from predefined enums.
        details: Optional string providing context up to 1000 characters.

    Returns:
        dict: A success message dict.

    Raises:
        ValueError: If the report fails validation constraints (e.g. invalid reason or self-reporting).
    """
    if current_user_id == target_user_id:
        raise ValueError("cannot report yourself")

    valid_reasons = [
        "spam",
        "harassment",
        "fake_profile",
        "inappropriate_content",
        "other",
    ]
    if reason not in valid_reasons:
        raise ValueError(f"invalid reason, must be one of: {', '.join(valid_reasons)}")

    if len(details) > 1000:
        raise ValueError("details too long (max 1000 characters)")

    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute(
            "INSERT INTO reports (reporter_id, reported_id, reason, details) VALUES (%s, %s, %s, %s)",
            (current_user_id, target_user_id, reason, details),
        )
        conn.commit()
        return {"message": "user reported successfully"}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)
