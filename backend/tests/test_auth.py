def register(client, email="test@example.com", password="pass1234"):
    return client.post("/auth/register", json={"email": email, "password": password})


def login(client, email="test@example.com", password="pass1234"):
    return client.post("/auth/login", json={"email": email, "password": password})


# Register tests

def test_register_success(client):
    resp = register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert "user_id" in data
    assert data["email"] == "test@example.com"


def test_register_missing_email(client):
    resp = client.post("/auth/register", json={"password": "pass1234"})
    assert resp.status_code == 400


def test_register_missing_password(client):
    resp = client.post("/auth/register", json={"email": "test@example.com"})
    assert resp.status_code == 400


def test_register_duplicate_email(client):
    resp1 = register(client)
    assert resp1.status_code == 201
    resp2 = register(client)
    assert resp2.status_code == 409


def test_register_lowercases_email(client):
    resp = register(client, email="Test@Example.com")
    assert resp.status_code == 201
    assert resp.get_json()["email"] == "test@example.com"

    resp = login(client, email="test@example.com")
    assert resp.status_code == 200


# Login tests

def test_login_success(client):
    register(client)
    resp = login(client)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "user_id" in data
    assert data["email"] == "test@example.com"


def test_login_wrong_password(client):
    register(client)
    resp = login(client, password="wrongpassword")
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = login(client, email="nobody@example.com")
    assert resp.status_code == 401


def test_login_missing_credentials(client):
    resp = client.post("/auth/login", json={})
    assert resp.status_code == 400


# Logout tests

def test_logout_returns_204(client):
    register(client)
    resp = client.delete("/auth/logout")
    assert resp.status_code == 204
    assert resp.data == b""


def test_logout_clears_session(client):
    register(client)
    client.delete("/auth/logout")
    resp = client.get("/profiles/me")
    assert resp.status_code == 401
