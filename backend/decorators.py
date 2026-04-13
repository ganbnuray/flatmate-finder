from functools import wraps
from flask import jsonify, make_response, session


def login_required(handler):
    """Ensures a user is authenticated via session before continuing."""

    @wraps(handler)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return make_response(jsonify({"error": "unauthorized"}), 401)
        return handler(*args, **kwargs)

    return wrapper
