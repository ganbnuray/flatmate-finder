from db import get_db, get_db_cursor


def validate_match_access(cur, match_id, user_id):
    """Helper function to validate if a match exists and the user is part of it.

    Args:
        cur: Active database cursor.
        match_id: The UUID of the match.
        user_id: The UUID of the user.

    Raises:
        ValueError: If the match is not found or unauthorized.
    """
    cur.execute(
        """
        SELECT user_a_id, user_b_id FROM matches
        WHERE id = %s AND status = 'active'
        AND (user_a_id = %s OR user_b_id = %s)
    """,
        (match_id, user_id, user_id),
    )

    match = cur.fetchone()
    if not match:
        raise ValueError("match not found or unauthorized")

    cur.execute(
        """
        SELECT 1 FROM blocks
        WHERE (blocker_id = %s AND blocked_id = %s)
           OR (blocker_id = %s AND blocked_id = %s)
    """,
        (match["user_a_id"], match["user_b_id"], match["user_b_id"], match["user_a_id"]),
    )
    blocked = cur.fetchone()
    if blocked:
        raise ValueError("match not found or unauthorized")


def get_match_messages(match_id, user_id):
    """Retrieves all messages for a specific active match in chronological order.

    Args:
        match_id: The UUID of the match.
        user_id: The UUID of the requesting user (must be part of the match).

    Returns:
        list: A list of message dictionaries.

    Raises:
        ValueError: If the user is not part of the match or the match does not exist.
    """
    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        validate_match_access(cur, match_id, user_id)

        cur.execute(
            """
            SELECT id, sender_id, body, created_at 
            FROM messages 
            WHERE match_id = %s 
            ORDER BY created_at ASC
        """,
            (match_id,),
        )

        messages = cur.fetchall()
        return [dict(m) for m in messages]

    except Exception as e:
        raise e
    finally:
        cur.close()
        conn.close()


def send_match_message(match_id, user_id, body):
    """Sends a new message within an active match.

    Args:
        match_id: The UUID of the match.
        user_id: The UUID of the sender (must be part of the match).
        body: The content of the message string.

    Returns:
        dict: The newly created message data.

    Raises:
        ValueError: If the user is unauthorized, message body is missing, or too long.
    """
    body = body.strip()
    if not body:
        raise ValueError("message body is required")

    if len(body) > 2000:
        raise ValueError("message body is too long (max 2000 characters)")

    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        validate_match_access(cur, match_id, user_id)

        cur.execute(
            """
            INSERT INTO messages (match_id, sender_id, body) 
            VALUES (%s, %s, %s)
            RETURNING id, sender_id, body, created_at
        """,
            (match_id, user_id, body),
        )

        message = cur.fetchone()
        conn.commit()
        return dict(message)

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()
