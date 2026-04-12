from db import get_db, get_db_cursor, put_db_connection


def get_profile(user_id):
    """Retrieves a user profile by user_id.

    Args:
        user_id: The UUID of the user.

    Returns:
        dict: The user's profile data.

    Raises:
        ValueError: If the profile is not found.
    """
    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute("SELECT * FROM profiles WHERE user_id = %s", (user_id,))
        profile = cur.fetchone()

        if not profile:
            raise ValueError("profile not found")

        return dict(profile)
    finally:
        cur.close()
        put_db_connection(conn)


def upsert_profile(user_id, profile_data):
    """Creates or updates a user profile.

    Args:
        user_id: The UUID of the user.
        profile_data: A dictionary containing profile fields.

    Returns:
        tuple: (profile dict, is_new boolean) indicating if a new profile was created.
    """
    # Required fields should be validated at the route level
    # Assuming the frontend sends valid enums

    if profile_data.get("budget_min", 0) > profile_data.get("budget_max", 0):
        raise ValueError("budget_min cannot be greater than budget_max")

    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute("SELECT id FROM profiles WHERE user_id = %s", (user_id,))
        exists = cur.fetchone()

        # Determine if profile is complete (could be more complex logic)
        is_complete = True

        if exists:
            cur.execute(
                """
                UPDATE profiles 
                SET display_name = %s, age = %s, city = %s, housing_status = %s, budget_min = %s, budget_max = %s, 
                    bio = %s, cleanliness = %s, smoking = %s, pets = %s, sleep_schedule = %s, guests = %s, noise_level = %s,
                    is_complete = %s
                WHERE user_id = %s
                RETURNING *
            """,
                (
                    profile_data["display_name"],
                    profile_data["age"],
                    profile_data["city"],
                    profile_data["housing_status"],
                    profile_data["budget_min"],
                    profile_data["budget_max"],
                    profile_data.get("bio", ""),
                    profile_data["cleanliness"],
                    profile_data["smoking"],
                    profile_data["pets"],
                    profile_data["sleep_schedule"],
                    profile_data.get("guests", "no_preference"),
                    profile_data.get("noise_level", "moderate"),
                    is_complete,
                    user_id,
                ),
            )
        else:
            cur.execute(
                """
                INSERT INTO profiles (user_id, display_name, age, city, housing_status, budget_min, budget_max, 
                                    bio, cleanliness, smoking, pets, sleep_schedule, guests, noise_level, is_complete)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """,
                (
                    user_id,
                    profile_data["display_name"],
                    profile_data["age"],
                    profile_data["city"],
                    profile_data["housing_status"],
                    profile_data["budget_min"],
                    profile_data["budget_max"],
                    profile_data.get("bio", ""),
                    profile_data["cleanliness"],
                    profile_data["smoking"],
                    profile_data["pets"],
                    profile_data["sleep_schedule"],
                    profile_data.get("guests", "no_preference"),
                    profile_data.get("noise_level", "moderate"),
                    is_complete,
                ),
            )

        profile = cur.fetchone()
        conn.commit()
        return dict(profile), not exists

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)


def get_discovery_feed(user_id):
    """Retrieves a list of candidate profiles for the discovery feed.

    Filters out the current user, users they have already acted upon (liked/passed),
    and any users involved in a block relationship.

    Args:
        user_id: The UUID of the current user browsing the feed.

    Returns:
        list: A list of candidate profile dictionaries.

    Raises:
        ValueError: If the current user's profile is incomplete.
    """
    conn = get_db()
    cur = get_db_cursor(conn)

    try:
        cur.execute("SELECT is_complete FROM profiles WHERE user_id = %s", (user_id,))
        user_profile = cur.fetchone()

        if not user_profile or not user_profile["is_complete"]:
            raise ValueError("complete your profile to view others")

        query = """
            SELECT * FROM profiles 
            WHERE is_complete = TRUE 
            AND user_id != %s
            AND user_id NOT IN (
                SELECT liked_id FROM likes WHERE liker_id = %s
            )
            AND user_id NOT IN (
                SELECT blocked_id FROM blocks WHERE blocker_id = %s
                UNION
                SELECT blocker_id FROM blocks WHERE blocked_id = %s
            )
            ORDER BY updated_at DESC
        """
        cur.execute(query, (user_id, user_id, user_id, user_id))
        profiles = cur.fetchall()

        return [dict(p) for p in profiles]

    finally:
        cur.close()
        put_db_connection(conn)
