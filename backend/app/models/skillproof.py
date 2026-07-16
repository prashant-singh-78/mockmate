import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SkillAssessment(Base):
    __tablename__ = "skill_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    share_token: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=lambda: str(uuid.uuid4())
    )
    role: Mapped[str] = mapped_column(String(80))
    level: Mapped[str] = mapped_column(String(30))
    job_description: Mapped[str] = mapped_column(Text, default="")
    resume_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="challenge", index=True)
    challenge_id: Mapped[str] = mapped_column(String(80))
    code_submission: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_results: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list)
    code_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    test_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    viva_answers: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=list)
    viva_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    problem_solving_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    skill_scores: Mapped[dict[str, float]] = mapped_column(JSON, default=dict)
    evidence: Mapped[list[str]] = mapped_column(JSON, default=list)
    improvements: Mapped[list[str]] = mapped_column(JSON, default=list)
    evaluation_provider: Mapped[str] = mapped_column(String(30), default="deterministic")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="skill_assessments")
