from db import get_db, get_db_cursor


def get_matches(user_id):
    """Fetches all active matches for the given user, resolving the partner's profile data.

    Args:
        user_id: The UUID of the current user.

    Returns:
        list: A list of dictionaries representing active matches,
              including the partner's profile data and the match creation time.
    """
    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        query = """
            SELECT
                m.id AS match_id,
                m.created_at AS match_created_at,
                p.*,
                last_msg.body AS last_message,
                last_msg.created_at AS last_message_at,
                last_msg.sender_id AS last_message_sender_id
            FROM matches m
            JOIN profiles p ON (
                (m.user_a_id = p.user_id AND m.user_b_id = %s)
                OR 
                (m.user_b_id = p.user_id AND m.user_a_id = %s)
            )
            LEFT JOIN LATERAL (
                SELECT body, created_at, sender_id
                FROM messages
                WHERE match_id = m.id
                ORDER BY created_at DESC
                LIMIT 1
            ) last_msg ON TRUE
            WHERE (m.user_a_id = %s OR m.user_b_id = %s)
            AND m.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM blocks b
                WHERE (b.blocker_id = p.user_id AND b.blocked_id = %s)
                   OR (b.blocker_id = %s AND b.blocked_id = p.user_id)
            )
            ORDER BY m.created_at DESC
        """
        cur.execute(query, (user_id, user_id, user_id, user_id, user_id, user_id))
        matches = cur.fetchall()

        return [dict(m) for m in matches]
    finally:
        cur.close()
        conn.close()
