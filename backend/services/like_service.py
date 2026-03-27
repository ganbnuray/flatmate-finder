import psycopg2
import uuid
from db import get_db, put_db_connection


def is_valid_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


def record_like(current_user_id, target_user_id):
    """Records a like action and creates a match if mutual.

    Args:
        current_user_id: The UUID of the user performing the like.
        target_user_id: The UUID of the profile being liked.

    Returns:
        A dict with key 'matched' set to True if a match was created, False otherwise.

    Raises:
        ValueError: If target_user_id is not a valid UUID.
        psycopg2.IntegrityError: If the user has already acted on this profile.
    """
    if not is_valid_uuid(target_user_id):
        raise ValueError("invalid target_user_id")

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (current_user_id, target_user_id, "LIKE"),
        )

        # check for mutual like
        cur.execute(
            "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s AND action = 'LIKE'",
            (target_user_id, current_user_id),
        )
        mutual = cur.fetchone()
        match_created = False

        if mutual:
            user_a = min(current_user_id, target_user_id)
            user_b = max(current_user_id, target_user_id)
            cur.execute(
                "INSERT INTO matches (user_a_id, user_b_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_a, user_b),
            )
            match_created = True

        conn.commit()
        return {"matched": match_created}

    except psycopg2.IntegrityError:
        conn.rollback()
        raise
    finally:
        cur.close()
        put_db_connection(conn)


def record_pass(current_user_id, target_user_id):
    """Records a pass action for a profile.

    Args:
        current_user_id: The UUID of the user performing the pass.
        target_user_id: The UUID of the profile being passed.

    Returns:
        A dict with key 'passed' set to True.

    Raises:
        ValueError: If target_user_id is not a valid UUID.
        psycopg2.IntegrityError: If the user has already acted on this profile.
    """
    if not is_valid_uuid(target_user_id):
        raise ValueError("invalid target_user_id")

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (current_user_id, target_user_id, "PASS"),
        )
        conn.commit()
        return {"passed": True}

    except psycopg2.IntegrityError:
        conn.rollback()
        raise
    finally:
        cur.close()
        put_db_connection(conn)
