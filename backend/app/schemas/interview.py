from datetime import datetime

from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    role: str = Field(min_length=2, max_length=80)
    level: str = Field(pattern="^(entry|mid|senior)$")


class SubmitAnswerRequest(BaseModel):
    answer: str = Field(min_length=20, max_length=5000)


class QuestionResponse(BaseModel):
    id: str
    prompt: str
    category: str


class AnswerResponse(BaseModel):
    id: str
    question_text: str
    answer_text: str
    score: float
    feedback: str
    suggested_answer: str

    model_config = {"from_attributes": True}


class SessionSummaryResponse(BaseModel):
    id: str
    role: str
    level: str
    status: str
    current_index: int
    total_questions: int
    overall_score: float | None
    created_at: datetime
    completed_at: datetime | None


class SessionDetailResponse(SessionSummaryResponse):
    current_question: QuestionResponse | None
    answers: list[AnswerResponse]


class AnswerResultResponse(BaseModel):
    score: float
    feedback: str
    suggested_answer: str
    completed: bool
    overall_score: float | None
    next_question: QuestionResponse | None

