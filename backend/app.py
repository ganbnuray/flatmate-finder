from flask import Flask, jsonify
import psycopg2
import os

app = Flask(__name__)

# temporary hardcoded user id until auth is done
CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001"

def get_db():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))

@app.route("/profiles/<target_user_id>/like", methods=["POST"])
def like_profile(target_user_id):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (CURRENT_USER_ID, target_user_id, "LIKE")
        )
    except Exception:
        conn.rollback()
        return jsonify({"error": "already acted on this user"}), 409

    # check for mutual like
    cur.execute(
        "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s AND action = 'LIKE'",
        (target_user_id, CURRENT_USER_ID)
    )
    mutual = cur.fetchone()
    match_created = False

    if mutual:
        user_a = min(CURRENT_USER_ID, target_user_id)
        user_b = max(CURRENT_USER_ID, target_user_id)
        cur.execute(
            "INSERT INTO matches (user_a_id, user_b_id) VALUES (%s, %s)",
            (user_a, user_b)
        )
        match_created = True

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"matched": match_created}), 201


@app.route("/profiles/<target_user_id>/pass", methods=["POST"])
def pass_profile(target_user_id):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (CURRENT_USER_ID, target_user_id, "PASS")
        )
    except Exception:
        conn.rollback()
        return jsonify({"error": "already acted on this user"}), 409

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"passed": True}), 201


if __name__ == "__main__":
    app.run(debug=True)