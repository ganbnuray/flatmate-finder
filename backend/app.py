import os
import uuid
import psycopg2
from datetime import datetime, date
from flask import Flask, jsonify, make_response, request, session
from flask.json.provider import DefaultJSONProvider
from dotenv import load_dotenv

from services import like_service
from services import auth_service
from services import profile_service
from services import match_service
from services import message_service
from services import abuse_service

load_dotenv(override=True)


class JSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def create_app():
    from db import init_db_pool, close_db_pool

    app = Flask(__name__)
    app.json_provider_class = JSONProvider
    app.json = JSONProvider(app)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev_secret_key")

    ALLOWED_ORIGIN = "http://localhost:3000"

    # Initialize the connection pool
    init_db_pool()

    @app.teardown_appcontext
    def teardown_db(exception):
        # We don't close the whole pool per-request, but we can close it
        # here if needed for clean shutdown. Usually the pool persists.
        pass

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return jsonify({}), 200

    @app.route("/auth/register", methods=["POST"])
    def register():
        """Registers a new user and logs them in via session.

        Returns:
            JSON response with user_id, email, and message.

        Raises:
            400: If missing email or password.
            409: If email is already registered.
            500: Server or database error.
        """
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password"):
            return make_response(
                jsonify({"error": "email and password are required"}), 400
            )

        try:
            result = auth_service.register_user(data["email"].lower(), data["password"])
            session["user_id"] = str(result["user_id"])
            return make_response(
                jsonify({**result, "message": "User registered successfully"}), 201
            )
        except ValueError as e:
            return make_response(jsonify({"error": str(e)}), 409)
        except Exception as e:
            return make_response(
                jsonify({"error": "failed to register user", "details": str(e)}), 500
            )

    @app.route("/auth/login", methods=["POST"])
    def login():
        """Logs in an existing user and creates a session.

        Returns:
            JSON response with user_id, email, and message.

        Raises:
            400: If missing email or password.
            401: If invalid credentials.
            403: If account is deactivated.
            500: Server error.
        """
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password"):
            return make_response(
                jsonify({"error": "email and password are required"}), 400
            )

        try:
            result = auth_service.login_user(data["email"].lower(), data["password"])
            session["user_id"] = str(result["user_id"])
            return make_response(
                jsonify({**result, "message": "logged in successfully"}), 200
            )
        except ValueError as e:
            status_code = 403 if "deactivated" in str(e) else 401
            return make_response(jsonify({"error": str(e)}), status_code)
        except Exception as e:
            return make_response(
                jsonify({"error": "login failed", "details": str(e)}), 500
            )

    @app.route("/auth/logout", methods=["DELETE"])
    def logout():
        """Logs out the user by clearing the session.

        Returns:
            Empty 204 No Content response.
        """
        session.pop("user_id", None)
        return make_response("", 204)

    @app.route("/profiles/me", methods=["GET"])
    def get_my_profile():
        """Retrieves the authenticated user's profile.

        Returns:
            JSON representation of the user's profile data.

        Raises:
            401: If unauthorized (missing session).
            404: If profile does not exist.
            500: Database error.
        """
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)

        try:
            profile = profile_service.get_profile(session["user_id"])
            return make_response(jsonify(profile), 200)
        except ValueError as e:
            return make_response(jsonify({"error": str(e)}), 404)
        except Exception as e:
            return make_response(
                jsonify({"error": "failed to fetch profile", "details": str(e)}), 500
            )

    @app.route("/profiles/me", methods=["POST", "PUT"])
    def upsert_profile():
        """Creates or updates the authenticated user's profile.

        Returns:
            JSON representation of the newly created or updated profile.

        Raises:
            401: If unauthorized.
            400: Missing required fields or invalid constraints.
            500: Failed to save profile to database.
        """
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)

        data = request.get_json()
        if not data:
            return make_response(jsonify({"error": "request body is missing"}), 400)

        required_fields = [
            "display_name",
            "age",
            "city",
            "housing_status",
            "budget_min",
            "budget_max",
            "cleanliness",
            "smoking",
            "pets",
            "sleep_schedule",
        ]
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify({"error": f"missing required field: {field}"}), 400
                )

        try:
            profile, is_new = profile_service.upsert_profile(session["user_id"], data)
            status_code = 201 if is_new else 200
            return make_response(jsonify(profile), status_code)
        except ValueError as e:
            return make_response(jsonify({"error": str(e)}), 400)
        except Exception as e:
            return make_response(
                jsonify({"error": "failed to save profile", "details": str(e)}), 500
            )

    @app.route("/profiles", methods=["GET"])
    def discover_profiles():
        """Retrieves a feed of candidate profiles excluding self, blocked, or acted-upon users.

        Returns:
            JSON list of candidate profile dicts.

        Raises:
            401: If unauthorized.
            403: If the current user's profile is incomplete.
            500: Database error loading the feed.
        """
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)

        try:
            profiles = profile_service.get_discovery_feed(session["user_id"])
            return make_response(jsonify(profiles), 200)
        except ValueError as e:
            return make_response(jsonify({"error": str(e)}), 403)
        except Exception as e:
            return make_response(
                jsonify({"error": "failed to load discovery feed", "details": str(e)}),
                500,
            )

    @app.route("/profiles/<target_user_id>/like", methods=["POST"])
    def like_profile(target_user_id):
        """Records a like action for a target profile.

        Args:
            target_user_id: The UUID of the profile being liked.

        Returns:
            JSON with key 'matched' set to True if a match was created, False otherwise.

        Raises:
            400: If target_user_id is not a valid UUID.
            401: If unauthorized.
            409: If the current user has already acted on this profile.
        """
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)

        try:
            result = like_service.record_like(session["user_id"], target_user_id)
            return make_response(jsonify(result), 201)
        except ValueError:
            return make_response(jsonify({"error": "invalid user id"}), 400)
        except psycopg2.IntegrityError:
            return make_response(jsonify({"error": "already acted on this user"}), 409)

    @app.route("/profiles/<target_user_id>/pass", methods=["POST"])
    def pass_profile(target_user_id):
        """Records a pass action for a target profile.

        Args:
            target_user_id: The UUID of the profile being passed.

        Returns:
            JSON with key 'passed' set to True.

        Raises:
            400: If target_user_id is not a valid UUID.
            401: If unauthorized.
            409: If the current user has already acted on this profile.
        """
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)

        try:
            result = like_service.record_pass(session["user_id"], target_user_id)
            return make_response(jsonify(result), 201)
        except ValueError:
            return make_response(jsonify({"error": "invalid user id"}), 400)
        except psycopg2.IntegrityError:
            return make_response(jsonify({"error": "already acted on this user"}), 409)

    # In upcoming commits, the matches and messages endpoints will be placed here.
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5050)
