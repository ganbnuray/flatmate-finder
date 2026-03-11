import os
import psycopg2
import psycopg2.errors
from flask import Flask, request, session, render_template, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


# ---------------------------------------------------------------------------
# Sign up
# ---------------------------------------------------------------------------

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")

    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    if not email or not password:
        return render_template("signup.html", error="Email and password are required.")

    if len(password) < 8:
        return render_template("signup.html", error="Password must be at least 8 characters.")

    password_hash = generate_password_hash(password)

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (email, password_hash) VALUES (%s, %s)",
                    (email, password_hash),
                )
        conn.close()
    except psycopg2.errors.UniqueViolation:
        return render_template("signup.html", error="An account with that email already exists.")

    return render_template("success.html", action="signed up", email=email)


# ---------------------------------------------------------------------------
# Log in
# ---------------------------------------------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    if not email or not password:
        return render_template("login.html", error="Email and password are required.")

    conn = get_db()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, password_hash, is_active FROM users WHERE email = %s",
            (email,),
        )
        row = cur.fetchone()
    conn.close()

    if row is None or not row[1] or not check_password_hash(row[1], password):
        return render_template("login.html", error="Invalid email or password.")

    if not row[2]:
        return render_template("login.html", error="This account has been deactivated.")

    session["user_id"] = str(row[0])
    session["email"] = email

    return render_template("success.html", action="logged in", email=email)


# ---------------------------------------------------------------------------
# Log out
# ---------------------------------------------------------------------------

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)
