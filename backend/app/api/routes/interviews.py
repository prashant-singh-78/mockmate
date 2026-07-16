from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.interview import InterviewAnswer, InterviewSession
from app.models.user import User
from app.schemas.interview import (
    AnswerResponse,
    AnswerResultResponse,
    QuestionResponse,
    SessionDetailResponse,
    SessionSummaryResponse,
    StartInterviewRequest,
    SubmitAnswerRequest,
)
from app.services.evaluator import evaluate_answer
from app.services.questions import get_question, get_questions, normalize_role

router = APIRouter(prefix="/interviews", tags=["interviews"])


def question_response(role: str, question_id: str) -> QuestionResponse:
    question = get_question(role, question_id)
    return QuestionResponse(id=question.id, prompt=question.prompt, category=question.category)


def summary(session: InterviewSession) -> SessionSummaryResponse:
    return SessionSummaryResponse(
        id=session.id,
        role=session.role,
        level=session.level,
        status=session.status,
        current_index=session.current_index,
        total_questions=len(session.question_ids),
        overall_score=session.overall_score,
        created_at=session.created_at,
        completed_at=session.completed_at,
    )


def owned_session(db: Session, session_id: str, user_id: str) -> InterviewSession:
    query = (
        select(InterviewSession)
        .options(selectinload(InterviewSession.answers))
        .where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = db.scalar(query)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return session


@router.get("", response_model=list[SessionSummaryResponse])
def list_interviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.scalars(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(20)
    ).all()
    return [summary(session) for session in sessions]


@router.post("", response_model=SessionDetailResponse, status_code=status.HTTP_201_CREATED)
def start_interview(
    payload: StartInterviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = normalize_role(payload.role)
    questions = get_questions(role)
    session = InterviewSession(
        user_id=user.id,
        role=role.title(),
        level=payload.level,
        question_ids=[question.id for question in questions],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionDetailResponse(
        **summary(session).model_dump(),
        current_question=question_response(session.role, session.question_ids[0]),
        answers=[],
    )


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_interview(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = owned_session(db, session_id, user.id)
    current = None
    if session.status == "active" and session.current_index < len(session.question_ids):
        current = question_response(session.role, session.question_ids[session.current_index])
    return SessionDetailResponse(
        **summary(session).model_dump(),
        current_question=current,
        answers=[AnswerResponse.model_validate(answer) for answer in session.answers],
    )


@router.post("/{session_id}/answers", response_model=AnswerResultResponse)
def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = owned_session(db, session_id, user.id)
    if session.status != "active" or session.current_index >= len(session.question_ids):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Interview is complete")

    question = get_question(session.role, session.question_ids[session.current_index])
    evaluation = evaluate_answer(question, payload.answer, session.level)
    answer = InterviewAnswer(
        session_id=session.id,
        question_id=question.id,
        question_text=question.prompt,
        answer_text=payload.answer,
        score=evaluation.score,
        feedback=evaluation.feedback,
        suggested_answer=evaluation.suggested_answer,
    )
    db.add(answer)
    session.current_index += 1

    completed = session.current_index >= len(session.question_ids)
    if completed:
        session.status = "completed"
        session.completed_at = datetime.now(UTC)
        scores = [item.score for item in session.answers] + [evaluation.score]
        session.overall_score = round(sum(scores) / len(scores), 1)

    db.commit()
    db.refresh(session)

    next_question = None
    if not completed:
        next_question = question_response(session.role, session.question_ids[session.current_index])

    return AnswerResultResponse(
        score=evaluation.score,
        feedback=evaluation.feedback,
        suggested_answer=evaluation.suggested_answer,
        completed=completed,
        overall_score=session.overall_score,
        next_question=next_question,
    )

