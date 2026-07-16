import re
from dataclasses import dataclass

from app.services.questions import Question


@dataclass(frozen=True)
class Evaluation:
    score: float
    feedback: str
    suggested_answer: str


def evaluate_answer(question: Question, answer: str, level: str) -> Evaluation:
    """Deterministic, explainable fallback. Replace behind this boundary with an AI provider."""
    normalized = answer.lower()
    words = re.findall(r"\b[\w'-]+\b", normalized)
    keyword_hits = [keyword for keyword in question.keywords if keyword in normalized]

    length_score = min(len(words) / 120, 1.0) * 3.5
    coverage_score = len(keyword_hits) / len(question.keywords) * 4.0
    structure_markers = sum(
        marker in normalized
        for marker in ("first", "then", "because", "result", "finally", "for example")
    )
    structure_score = min(structure_markers / 3, 1.0) * 1.5
    level_adjustment = {"entry": 0.7, "mid": 0.3, "senior": 0.0}[level]
    score = round(min(10.0, 1.0 + length_score + coverage_score + structure_score + level_adjustment), 1)

    if len(words) < 45:
        opening = "Your answer is clear, but it needs more evidence and detail."
    elif score >= 8:
        opening = "Strong answer: it is specific, structured, and covers the core decision points."
    elif score >= 6:
        opening = "Good foundation. A little more structure and measurable evidence would make it convincing."
    else:
        opening = "You have the right direction, but the interviewer still has to infer too much."

    missing = [keyword for keyword in question.keywords if keyword not in normalized]
    if missing:
        improvement = f"Strengthen it by addressing {', '.join(missing[:3])} and ending with a concrete outcome."
    else:
        improvement = "Make it even sharper by quantifying the outcome and naming one trade-off you considered."

    return Evaluation(
        score=score,
        feedback=f"{opening} {improvement}",
        suggested_answer=question.guidance,
    )

