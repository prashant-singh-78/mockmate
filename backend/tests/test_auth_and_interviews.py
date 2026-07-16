def register(client):
    return client.post(
        "/api/v1/auth/register",
        json={"name": "Prashant", "email": "prashant@example.com", "password": "strongpass123"},
    )


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_login_and_me(client):
    response = register(client)
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "prashant@example.com"

    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.get("/api/v1/auth/me").status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "prashant@example.com", "password": "strongpass123"},
    )
    assert login.status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 200


def test_complete_interview(client):
    register(client)
    started = client.post(
        "/api/v1/interviews", json={"role": "data scientist", "level": "entry"}
    )
    assert started.status_code == 201
    session_id = started.json()["id"]

    result = None
    answer = (
        "First I would define the problem and baseline. Then I would inspect the data, "
        "build the model, choose a suitable metric, and measure the result and impact."
    )
    for _ in range(5):
        result = client.post(f"/api/v1/interviews/{session_id}/answers", json={"answer": answer})
        assert result.status_code == 200

    assert result is not None
    assert result.json()["completed"] is True
    assert result.json()["overall_score"] > 0

    detail = client.get(f"/api/v1/interviews/{session_id}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "completed"
    assert len(detail.json()["answers"]) == 5

