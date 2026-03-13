from flask import Flask, jsonify, make_response
import psycopg2
from services import like_service

# temporary hardcoded user id until auth is done
CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001"


def create_app():
    app = Flask(__name__)

    @app.route("/profiles/<target_user_id>/like", methods=["POST"])
    def like_profile(target_user_id):
        """Records a like action for a target profile.

        Args:
            target_user_id: The UUID of the profile being liked.

        Returns:
            JSON with key 'matched' set to True if a match was created, False otherwise.

        Raises:
            400: If target_user_id is not a valid UUID.
            409: If the current user has already acted on this profile.
        """
        try:
            result = like_service.record_like(CURRENT_USER_ID, target_user_id)
        except ValueError:
            return make_response(jsonify({"error": "invalid user id"}), 400)
        except psycopg2.IntegrityError:
            return make_response(jsonify({"error": "already acted on this user"}), 409)
        return make_response(jsonify(result), 201)

    @app.route("/profiles/<target_user_id>/pass", methods=["POST"])
    def pass_profile(target_user_id):
        """Records a pass action for a target profile.

        Args:
            target_user_id: The UUID of the profile being passed.

        Returns:
            JSON with key 'passed' set to True.

        Raises:
            400: If target_user_id is not a valid UUID.
            409: If the current user has already acted on this profile.
        """
        try:
            result = like_service.record_pass(CURRENT_USER_ID, target_user_id)
        except ValueError:
            return make_response(jsonify({"error": "invalid user id"}), 400)
        except psycopg2.IntegrityError:
            return make_response(jsonify({"error": "already acted on this user"}), 409)
        return make_response(jsonify(result), 201)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
