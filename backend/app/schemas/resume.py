from pydantic import BaseModel


class ResumeAnalysisResponse(BaseModel):
    filename: str
    target_role: str
    overall_score: int
    verdict: str
    word_count: int
    category_scores: dict[str, int]
    contact_checks: dict[str, bool]
    found_sections: list[str]
    missing_sections: list[str]
    detected_skills: list[str]
    strengths: list[str]
    improvements: list[str]

