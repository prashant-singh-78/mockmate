def register(client):
    return client.post(
        "/api/v1/auth/register",
        json={
            "name": "Example Candidate",
            "email": "skillproof@example.com",
            "password": "strongpass123",
        },
    )


SOLUTION = """
def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if not normalized or normalized.count("@") != 1:
        raise ValueError("Invalid email")
    local, domain = normalized.split("@")
    if not local or "." not in domain:
        raise ValueError("Invalid email")
    return normalized
"""


TEST_RESULTS = [
    {"id": "trim-lower", "passed": True, "detail": "Passed"},
    {"id": "plus-tag", "passed": True, "detail": "Passed"},
    {"id": "empty", "passed": True, "detail": "Passed"},
    {"id": "missing-at", "passed": True, "detail": "Passed"},
    {"id": "bad-domain", "passed": True, "detail": "Passed"},
]


def test_skillproof_requires_authentication(client):
    response = client.get("/api/v1/skillproof/assessments")
    assert response.status_code == 401


def test_complete_skillproof_assessment_and_share_passport(client):
    register(client)
    started = client.post(
        "/api/v1/skillproof/assessments",
        json={
            "role": "Python Backend Developer",
            "level": "entry",
            "resume_skills": ["Python", "FastAPI", "Testing"],
            "job_description": "Build and test reliable Python APIs.",
        },
    )
    assert started.status_code == 201
    assessment = started.json()
    assessment_id = assessment["id"]
    assert assessment["challenge"]["function_name"] == "normalize_email"
    assert len(assessment["challenge"]["tests"]) == 5

    submission = client.post(
        f"/api/v1/skillproof/assessments/{assessment_id}/submission",
        json={"code": SOLUTION, "test_results": TEST_RESULTS},
    )
    assert submission.status_code == 200
    assert submission.json()["test_score"] == 100
    assert submission.json()["code_score"] >= 80

    questions = assessment["viva_questions"]
    answers = [
        {
            "question": questions[0],
            "answer": "First I strip and lowercase the value because validation should operate on one consistent representation, then I validate each part.",
        },
        {
            "question": questions[1],
            "answer": "I would add Unicode, maximum length, duplicate account, whitespace, and unusual domain edge cases with focused tests.",
        },
        {
            "question": questions[2],
            "answer": "FastAPI schema validation should call this boundary, use database uniqueness, safe logs, rate limiting, and monitored error handling.",
        },
    ]
    viva = client.post(
        f"/api/v1/skillproof/assessments/{assessment_id}/viva",
        json={"answers": answers},
    )
    assert viva.status_code == 200
    report = viva.json()
    assert report["status"] == "completed"
    assert report["overall_score"] >= 75
    assert report["evaluation_provider"] == "deterministic"
    assert len(report["skill_scores"]) == 4

    history = client.get("/api/v1/skillproof/assessments")
    assert history.status_code == 200
    assert history.json()[0]["id"] == assessment_id

    public = client.get(f"/api/v1/skillproof/public/{report['share_token']}")
    assert public.status_code == 200
    assert public.json()["role"] == "Python Backend Developer"
    assert public.json()["overall_score"] == report["overall_score"]


def test_skillproof_static_review_rejects_unsafe_code(client):
    register(client)
    started = client.post(
        "/api/v1/skillproof/assessments",
        json={"role": "Python Backend Developer", "level": "entry"},
    )
    assessment_id = started.json()["id"]
    submission = client.post(
        f"/api/v1/skillproof/assessments/{assessment_id}/submission",
        json={
            "code": "import os\ndef normalize_email(email):\n    return os.environ.get(email)",
            "test_results": TEST_RESULTS,
        },
    )
    assert submission.status_code == 200
    assert submission.json()["code_score"] == 0
