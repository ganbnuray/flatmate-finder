from flask import Flask, jsonify, request, session
import os
import bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
from db import get_db_connection, get_db_cursor

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev_secret_key")

# Enable CORS, particularly allowing credentials (cookies) to be sent
CORS(app, supports_credentials=True)

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    email = data["email"].lower()
    password = data["password"]
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "email already registered"}), 409
            
        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
            (email, password_hash)
        )
        user_id = cur.fetchone()["id"]
        conn.commit()
        
        session["user_id"] = user_id
        
        return jsonify({
            "user_id": user_id,
            "email": email,
            "message": "User registered successfully"
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "failed to register user", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    email = data["email"].lower()
    password = data["password"]

    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        cur.execute("SELECT id, email, password_hash, is_active FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "invalid email or password"}), 401
            
        if not user["is_active"]:
            return jsonify({"error": "account is deactivated"}), 403
            
        if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            return jsonify({"error": "invalid email or password"}), 401
            
        session["user_id"] = user["id"]
        
        return jsonify({
            "user_id": user["id"],
            "email": user["email"],
            "message": "logged in successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": "login failed", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/auth/logout", methods=["DELETE"])
def logout():
    session.pop("user_id", None)
    return "", 204

@app.route("/profiles/me", methods=["GET"])
def get_my_profile():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    conn = get_db_connection()
    cur = get_db_cursor(conn)
    try:
        cur.execute("SELECT * FROM profiles WHERE user_id = %s", (session["user_id"],))
        profile = cur.fetchone()
        
        if not profile:
            return jsonify({"error": "profile not found"}), 404
            
        return jsonify(dict(profile)), 200
    except Exception as e:
        return jsonify({"error": "failed to fetch profile", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/profiles/me", methods=["POST", "PUT"])
def upsert_profile():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is missing"}), 400
        
    required_fields = ["display_name", "age", "city", "housing_status", "budget_min", "budget_max", "cleanliness", "smoking", "pets", "sleep_schedule"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"missing required field: {field}"}), 400
            
    # Assuming the frontend sends valid values according to the enums,
    # and we perform minimum validation here. More thorough validation can be done.
    if data.get("budget_min", 0) > data.get("budget_max", 0):
        return jsonify({"error": "budget_min cannot be greater than budget_max"}), 400

    conn = get_db_connection()
    cur = get_db_cursor(conn)
    try:
        # Check if profile exists
        cur.execute("SELECT id FROM profiles WHERE user_id = %s", (session["user_id"],))
        exists = cur.fetchone()
        
        is_complete = True # Since all required fields are checked above, we assume true. Bio, guests, noise_level can be optional depending on strictness.
        
        if exists:
            # Update existing profile
            cur.execute("""
                UPDATE profiles 
                SET display_name = %s, age = %s, city = %s, housing_status = %s, budget_min = %s, budget_max = %s, 
                    bio = %s, cleanliness = %s, smoking = %s, pets = %s, sleep_schedule = %s, guests = %s, noise_level = %s,
                    is_complete = %s
                WHERE user_id = %s
                RETURNING *
            """, (
                data["display_name"], data["age"], data["city"], data["housing_status"], data["budget_min"], data["budget_max"],
                data.get("bio", ""), data["cleanliness"], data["smoking"], data["pets"], data["sleep_schedule"], 
                data.get("guests", "no_preference"), data.get("noise_level", "moderate"), is_complete,
                session["user_id"]
            ))
        else:
            # Create new profile
            cur.execute("""
                INSERT INTO profiles (user_id, display_name, age, city, housing_status, budget_min, budget_max, 
                                    bio, cleanliness, smoking, pets, sleep_schedule, guests, noise_level, is_complete)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                session["user_id"], data["display_name"], data["age"], data["city"], data["housing_status"], data["budget_min"], data["budget_max"],
                data.get("bio", ""), data["cleanliness"], data["smoking"], data["pets"], data["sleep_schedule"], 
                data.get("guests", "no_preference"), data.get("noise_level", "moderate"), is_complete
            ))
            
        profile = cur.fetchone()
        conn.commit()
        return jsonify(dict(profile)), 200 if exists else 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "failed to save profile", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/profiles", methods=["GET"])
def discover_profiles():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    current_user_id = session["user_id"]
    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        # Check if the user has completed their profile
        cur.execute("SELECT is_complete FROM profiles WHERE user_id = %s", (current_user_id,))
        user_profile = cur.fetchone()
        
        if not user_profile or not user_profile["is_complete"]:
            return jsonify({"error": "complete your profile to view others"}), 403

        # Query to fetch all profiles excluding self, blocked users, and acted-upon users
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
        cur.execute(query, (current_user_id, current_user_id, current_user_id, current_user_id))
        profiles = cur.fetchall()
        
        return jsonify([dict(p) for p in profiles]), 200
        
    except Exception as e:
        return jsonify({"error": "failed to load discovery feed", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/profiles/<target_user_id>/like", methods=["POST"])
def like_profile(target_user_id):
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
    
    current_user_id = session["user_id"]
    
    conn = get_db_connection()
    cur = get_db_cursor(conn)

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (current_user_id, target_user_id, "LIKE")
        )
    except Exception:
        conn.rollback()
        return jsonify({"error": "already acted on this user"}), 409

    # check for mutual like
    cur.execute(
        "SELECT id FROM likes WHERE liker_id = %s AND liked_id = %s AND action = 'LIKE'",
        (target_user_id, current_user_id)
    )
    mutual = cur.fetchone()
    match_created = False

    if mutual:
        user_a = min(current_user_id, target_user_id)
        user_b = max(current_user_id, target_user_id)
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
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
    
    current_user_id = session["user_id"]
    
    conn = get_db_connection()
    cur = get_db_cursor(conn)

    try:
        cur.execute(
            "INSERT INTO likes (liker_id, liked_id, action) VALUES (%s, %s, %s)",
            (current_user_id, target_user_id, "PASS")
        )
    except Exception:
        conn.rollback()
        return jsonify({"error": "already acted on this user"}), 409

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"passed": True}), 201

@app.route("/matches", methods=["GET"])
def get_matches():
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    current_user_id = session["user_id"]
    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        # Fetch active matches for current user and resolve the partner's profile
        query = """
            SELECT m.id AS match_id, m.created_at AS match_created_at, p.*
            FROM matches m
            JOIN profiles p ON (
                (m.user_a_id = p.user_id AND m.user_b_id = %s)
                OR 
                (m.user_b_id = p.user_id AND m.user_a_id = %s)
            )
            WHERE (m.user_a_id = %s OR m.user_b_id = %s)
            AND m.status = 'active'
            ORDER BY m.created_at DESC
        """
        cur.execute(query, (current_user_id, current_user_id, current_user_id, current_user_id))
        matches = cur.fetchall()
        
        return jsonify({"matches": [dict(m) for m in matches]}), 200
        
    except Exception as e:
        return jsonify({"error": "failed to load matches", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/matches/<match_id>/messages", methods=["GET"])
def get_messages(match_id):
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    current_user_id = session["user_id"]
    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        # Validate that the match exists, is active, and the current user is part of it
        cur.execute("""
            SELECT id FROM matches 
            WHERE id = %s AND status = 'active'
            AND (user_a_id = %s OR user_b_id = %s)
        """, (match_id, current_user_id, current_user_id))
        
        match = cur.fetchone()
        if not match:
            return jsonify({"error": "match not found or unauthorized"}), 404

        # Fetch messages for this match
        cur.execute("""
            SELECT id, sender_id, body, created_at 
            FROM messages 
            WHERE match_id = %s 
            ORDER BY created_at ASC
        """, (match_id,))
        
        messages = cur.fetchall()
        return jsonify([dict(m) for m in messages]), 200
        
    except Exception as e:
        return jsonify({"error": "failed to load messages", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/matches/<match_id>/messages", methods=["POST"])
def send_message(match_id):
    if "user_id" not in session:
        return jsonify({"error": "unauthorized"}), 401
        
    data = request.get_json()
    if not data or not data.get("body") or len(data.get("body").strip()) == 0:
        return jsonify({"error": "message body is required"}), 400
        
    body = data.get("body").strip()
    if len(body) > 2000:
        return jsonify({"error": "message body is too long"}), 400
        
    current_user_id = session["user_id"]
    conn = get_db_connection()
    cur = get_db_cursor(conn)
    
    try:
        # Validate that the match exists, is active, and the current user is part of it
        cur.execute("""
            SELECT id FROM matches 
            WHERE id = %s AND status = 'active'
            AND (user_a_id = %s OR user_b_id = %s)
        """, (match_id, current_user_id, current_user_id))
        
        match = cur.fetchone()
        if not match:
            return jsonify({"error": "match not found or unauthorized"}), 404

        # Insert new message
        cur.execute("""
            INSERT INTO messages (match_id, sender_id, body) 
            VALUES (%s, %s, %s)
            RETURNING id, sender_id, body, created_at
        """, (match_id, current_user_id, body))
        
        message = cur.fetchone()
        conn.commit()
        return jsonify(dict(message)), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "failed to send message", "details": str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    app.run(debug=True)