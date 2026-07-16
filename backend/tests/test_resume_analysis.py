def register(client):
    return client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sample Candidate",
            "email": "resume@example.com",
            "password": "strongpass123",
        },
    )


RESUME_TEXT = """
Sample Candidate
candidate@example.com | +1 202-555-0100

SUMMARY
Computer Science student specializing in Artificial Intelligence and full-stack development.

SKILLS
Python, SQL, Pandas, NumPy, Scikit-learn, TensorFlow, Machine Learning, Docker, AWS, GitHub

EXPERIENCE
Developed and deployed machine learning applications for practical healthcare use cases.
Improved model accuracy by 18% through data cleaning and feature engineering.

EDUCATION
B.Tech in Computer Science with Artificial Intelligence specialization.

PROJECTS
Built a skin disease predictor with TensorFlow and FastAPI used across 7 disease classes.
Created a data platform and reduced dataset discovery time by 40% for student projects.
Implemented REST API services and deployed projects using Docker and AWS.

CERTIFICATIONS
Machine Learning and Python development certifications.
"""


def test_resume_analysis_requires_authentication(client):
    response = client.post(
        "/api/v1/resumes/analyze",
        data={"target_role": "Data Scientist"},
        files={"file": ("resume.txt", RESUME_TEXT, "text/plain")},
    )
    assert response.status_code == 401


def test_analyze_resume(client):
    register(client)
    response = client.post(
        "/api/v1/resumes/analyze",
        data={"target_role": "Data Scientist"},
        files={"file": ("resume.txt", RESUME_TEXT, "text/plain")},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["filename"] == "resume.txt"
    assert result["target_role"] == "Data Scientist"
    assert result["overall_score"] >= 70
    assert "Python".lower() in [skill.lower() for skill in result["detected_skills"]]
    assert result["contact_checks"]["email"] is True
    assert "Projects" in result["found_sections"]


def test_rejects_unsupported_resume_type(client):
    register(client)
    response = client.post(
        "/api/v1/resumes/analyze",
        data={"target_role": "Software Engineer"},
        files={"file": ("resume.exe", b"not a resume", "application/octet-stream")},
    )
    assert response.status_code == 415
