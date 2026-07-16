from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class StartAssessmentRequest(BaseModel):
    role: str = Field(default="Python Backend Developer", min_length=2, max_length=80)
    level: str = Field(default="entry", pattern="^(entry|mid)$")
    job_description: str = Field(default="", max_length=6000)
    resume_skills: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("resume_skills")
    @classmethod
    def clean_skills(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            skill = value.strip()[:50]
            if skill and skill.lower() not in {item.lower() for item in cleaned}:
                cleaned.append(skill)
        return cleaned


class ChallengeTestResponse(BaseModel):
    id: str
    label: str
    input: str
    expected: str | None = None
    expected_error: str | None = None


class ChallengeResponse(BaseModel):
    id: str
    title: str
    summary: str
    instructions: list[str]
    starter_code: str
    function_name: str
    tests: list[ChallengeTestResponse]
    estimated_minutes: int


class ClientTestResult(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    passed: bool
    detail: str = Field(default="", max_length=300)


class SubmitCodeRequest(BaseModel):
    code: str = Field(min_length=20, max_length=12000)
    test_results: list[ClientTestResult] = Field(min_length=1, max_length=20)


class SubmissionResultResponse(BaseModel):
    code_score: float
    test_score: float
    passed_tests: int
    total_tests: int
    feedback: list[str]
    ready_for_viva: bool


class VivaAnswerRequest(BaseModel):
    question: str = Field(min_length=5, max_length=500)
    answer: str = Field(min_length=20, max_length=4000)


class SubmitVivaRequest(BaseModel):
    answers: list[VivaAnswerRequest] = Field(min_length=3, max_length=3)


class SkillScoreResponse(BaseModel):
    name: str
    score: float
    status: str


class AssessmentSummaryResponse(BaseModel):
    id: str
    role: str
    level: str
    status: str
    overall_score: float | None
    created_at: datetime
    completed_at: datetime | None


class AssessmentResponse(AssessmentSummaryResponse):
    share_token: str
    job_description: str
    resume_skills: list[str]
    challenge: ChallengeResponse
    test_results: list[ClientTestResult]
    code_score: float | None
    test_score: float | None
    viva_questions: list[str]
    viva_answers: list[dict[str, object]]
    viva_score: float | None
    problem_solving_score: float | None
    skill_scores: list[SkillScoreResponse]
    evidence: list[str]
    improvements: list[str]
    evaluation_provider: str


class PublicSkillPassportResponse(BaseModel):
    role: str
    level: str
    overall_score: float
    skill_scores: list[SkillScoreResponse]
    evidence: list[str]
    improvements: list[str]
    completed_at: datetime
