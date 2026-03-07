from flask import Flask, request, jsonify
import psycopg2
import os

app = Flask(__name__)

# temporary hardcoded user id until auth is done
CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001"

def get_db():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))

@app.route("/likes", methods=["POST"])
def like_or_pass():
    data = request.get_json()
    target_user_id = data.get("liked_id")
    action = data.get("action")  # "LIKE" or "PASS"

    if not target_user_id or action not in ("LIKE", "PASS"):
        return jsonify({"error": "invalid request"}), 400

    conn = get_db()
    cur = conn.cursor()

    # insert like or pass
    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (CURRENT_USER_ID, target_user_id, action)
        )
    except Exception:
        conn.rollback()
        return jsonify({"error": "already acted on this user"}), 409

    match_created = False

    # if like, check for mutual like
    if action == "LIKE":
        cur.execute(
            "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s AND action = 'LIKE'",
            (target_user_id, CURRENT_USER_ID)
        )
        mutual = cur.fetchone()

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

    return jsonify({"success": True, "match_created": match_created}), 201

if __name__ == "__main__":
    app.run(debug=True)