import pytest
import psycopg2
import uuid
from services.like_service import record_like, record_pass


def create_user(email, password_hash="fake_hash"):
    from db import get_db, put_db_connection
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
        (email, password_hash),
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    put_db_connection(conn)
    return str(user_id)


def create_profile(user_id, is_complete=True):
    from db import get_db, put_db_connection
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO profiles (
            user_id, display_name, age, city, neighborhood,
            housing_status, budget_min, budget_max,
            cleanliness, smoking, pets, sleep_schedule, is_complete
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, "Test User", 25, "SF", "Mission",
         "LOOKING", 1000, 2000,
         "clean", "non_smoker", "no_pets", "flexible", is_complete),
    )
    conn.commit()
    cur.close()
    put_db_connection(conn)


def create_block(blocker_id, blocked_id):
    from db import get_db, put_db_connection
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO blocks (blocker_id, blocked_id) VALUES (%s, %s)",
        (blocker_id, blocked_id),
    )
    conn.commit()
    cur.close()
    put_db_connection(conn)


def make_user_with_profile(email, is_complete=True):
    user_id = create_user(email)
    create_profile(user_id, is_complete=is_complete)
    return user_id


def count_likes(liker_id, liked_id):
    from db import get_db, put_db_connection
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM likes WHERE liker_id = %s AND liked_id = %s",
        (liker_id, liked_id),
    )
    count = cur.fetchone()[0]
    cur.close()
    put_db_connection(conn)
    return count


def get_match(user_a, user_b):
    from db import get_db, put_db_connection
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, user_a_id, user_b_id, status FROM matches WHERE user_a_id = %s AND user_b_id = %s",
        (user_a, user_b),
    )
    row = cur.fetchone()
    cur.close()
    put_db_connection(conn)
    return row


# record_like happy path

def test_record_like_inserts_row_with_action_like(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    result = record_like(alice, bob)

    assert result == {"matched": False}
    assert count_likes(alice, bob) == 1


def test_record_like_returns_matched_false_when_no_mutual(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    result = record_like(alice, bob)

    assert result["matched"] is False


def test_record_like_creates_match_when_mutual(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    first = record_like(alice, bob)
    assert first["matched"] is False

    second = record_like(bob, alice)
    assert second["matched"] is True

    user_a = min(alice, bob)
    user_b = max(alice, bob)
    match = get_match(user_a, user_b)
    assert match is not None


def test_record_like_match_uses_canonical_ordering(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_like(alice, bob)
    record_like(bob, alice)

    user_a = min(alice, bob)
    user_b = max(alice, bob)
    match = get_match(user_a, user_b)

    assert match is not None
    assert str(match[1]) == user_a
    assert str(match[2]) == user_b


def test_record_like_match_status_is_active(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_like(alice, bob)
    record_like(bob, alice)

    user_a = min(alice, bob)
    user_b = max(alice, bob)
    match = get_match(user_a, user_b)

    assert match[3] == "active"


def test_record_like_does_not_create_match_on_one_sided_like(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_like(alice, bob)

    user_a = min(alice, bob)
    user_b = max(alice, bob)
    assert get_match(user_a, user_b) is None


def test_record_like_reactivates_previously_unmatched_match(client):
    from db import get_db, put_db_connection

    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    user_a = min(alice, bob)
    user_b = max(alice, bob)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, 'LIKE')",
        (alice, bob),
    )
    cur.execute(
        "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, 'LIKE')",
        (bob, alice),
    )
    cur.execute(
        "INSERT INTO matches (user_a_id, user_b_id, status) VALUES (%s, %s, 'unmatched')",
        (user_a, user_b),
    )
    cur.execute(
        "DELETE FROM likes WHERE liker_id = %s AND liked_id = %s",
        (alice, bob),
    )
    conn.commit()
    cur.close()
    put_db_connection(conn)

    result = record_like(alice, bob)
    assert result["matched"] is True

    match = get_match(user_a, user_b)
    assert match is not None
    assert match[3] == "active"


# record_like validation failures

def test_record_like_raises_on_invalid_uuid(client):
    alice = make_user_with_profile("alice@test.com")

    with pytest.raises(ValueError, match="invalid target_user_id"):
        record_like(alice, "not-a-uuid")


def test_record_like_raises_when_current_profile_missing(client):
    alice = create_user("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    with pytest.raises(ValueError, match="complete your profile"):
        record_like(alice, bob)


def test_record_like_raises_when_current_profile_incomplete(client):
    alice = make_user_with_profile("alice@test.com", is_complete=False)
    bob = make_user_with_profile("bob@test.com")

    with pytest.raises(ValueError, match="complete your profile"):
        record_like(alice, bob)


def test_record_like_raises_when_target_profile_missing(client):
    alice = make_user_with_profile("alice@test.com")
    bob = create_user("bob@test.com")

    with pytest.raises(ValueError, match="target profile not available"):
        record_like(alice, bob)


def test_record_like_raises_when_target_profile_incomplete(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com", is_complete=False)

    with pytest.raises(ValueError, match="target profile not available"):
        record_like(alice, bob)


def test_record_like_raises_when_blocked_by_target(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")
    create_block(bob, alice)

    with pytest.raises(ValueError, match="blocked"):
        record_like(alice, bob)


def test_record_like_raises_when_blocked_target(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")
    create_block(alice, bob)

    with pytest.raises(ValueError, match="blocked"):
        record_like(alice, bob)


def test_record_like_raises_integrity_on_duplicate(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_like(alice, bob)

    with pytest.raises(psycopg2.IntegrityError):
        record_like(alice, bob)


def test_record_like_raises_integrity_on_self_like(client):
    alice = make_user_with_profile("alice@test.com")

    with pytest.raises(psycopg2.IntegrityError):
        record_like(alice, alice)


# record_pass happy path

def test_record_pass_inserts_row_with_action_pass(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    result = record_pass(alice, bob)

    assert result == {"passed": True}
    assert count_likes(alice, bob) == 1


def test_record_pass_does_not_require_target_profile_complete(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com", is_complete=False)

    result = record_pass(alice, bob)

    assert result == {"passed": True}


def test_record_pass_raises_fk_violation_on_nonexistent_target(client):
    alice = make_user_with_profile("alice@test.com")
    nonexistent = str(uuid.uuid4())

    with pytest.raises(psycopg2.IntegrityError):
        record_pass(alice, nonexistent)


# record_pass validation failures

def test_record_pass_raises_on_invalid_uuid(client):
    alice = make_user_with_profile("alice@test.com")

    with pytest.raises(ValueError, match="invalid target_user_id"):
        record_pass(alice, "not-a-uuid")


def test_record_pass_raises_when_current_profile_incomplete(client):
    alice = make_user_with_profile("alice@test.com", is_complete=False)
    bob = make_user_with_profile("bob@test.com")

    with pytest.raises(ValueError, match="complete your profile"):
        record_pass(alice, bob)


def test_record_pass_raises_when_blocked(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")
    create_block(alice, bob)

    with pytest.raises(ValueError, match="blocked"):
        record_pass(alice, bob)


def test_record_pass_raises_integrity_on_self_pass(client):
    alice = make_user_with_profile("alice@test.com")

    with pytest.raises(psycopg2.IntegrityError):
        record_pass(alice, alice)


def test_record_pass_raises_integrity_on_duplicate_pass(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_pass(alice, bob)

    with pytest.raises(psycopg2.IntegrityError):
        record_pass(alice, bob)


def test_record_pass_raises_integrity_when_already_liked(client):
    alice = make_user_with_profile("alice@test.com")
    bob = make_user_with_profile("bob@test.com")

    record_like(alice, bob)

    with pytest.raises(psycopg2.IntegrityError):
        record_pass(alice, bob)
