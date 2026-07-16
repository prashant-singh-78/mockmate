from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.skillproof import SkillAssessment
from app.models.user import User
from app.schemas.skillproof import (
    AssessmentResponse,
    AssessmentSummaryResponse,
    PublicSkillPassportResponse,
    SkillScoreResponse,
    StartAssessmentRequest,
    SubmissionResultResponse,
    SubmitCodeRequest,
    SubmitVivaRequest,
)
from app.services.skillproof import (
    VIVA_QUESTIONS,
    build_passport,
    challenge_dict,
    evaluate_code,
    evaluate_viva,
    get_challenge,
)

router = APIRouter(prefix="/skillproof", tags=["skillproof"])


def owned_assessment(db: Session, assessment_id: str, user_id: str) -> SkillAssessment:
    assessment = db.scalar(
        select(SkillAssessment).where(
            SkillAssessment.id == assessment_id,
            SkillAssessment.user_id == user_id,
        )
    )
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment


def skill_status(score: float) -> str:
    if score >= 80:
        return "Verified"
    if score >= 65:
        return "Demonstrated"
    return "Developing"


def summary(assessment: SkillAssessment) -> AssessmentSummaryResponse:
    return AssessmentSummaryResponse(
        id=assessment.id,
        role=assessment.role,
        level=assessment.level,
        status=assessment.status,
        overall_score=assessment.overall_score,
        created_at=assessment.created_at,
        completed_at=assessment.completed_at,
    )


def response(assessment: SkillAssessment) -> AssessmentResponse:
    scores = [
        SkillScoreResponse(name=name, score=float(score), status=skill_status(float(score)))
        for name, score in assessment.skill_scores.items()
    ]
    return AssessmentResponse(
        **summary(assessment).model_dump(),
        share_token=assessment.share_token,
        job_description=assessment.job_description,
        resume_skills=assessment.resume_skills,
        challenge=challenge_dict(get_challenge(assessment.role)),
        test_results=assessment.test_results,
        code_score=assessment.code_score,
        test_score=assessment.test_score,
        viva_questions=list(VIVA_QUESTIONS),
        viva_answers=assessment.viva_answers,
        viva_score=assessment.viva_score,
        problem_solving_score=assessment.problem_solving_score,
        skill_scores=scores,
        evidence=assessment.evidence,
        improvements=assessment.improvements,
        evaluation_provider=assessment.evaluation_provider,
    )


@router.get("/assessments", response_model=list[AssessmentSummaryResponse])
def list_assessments(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessments = db.scalars(
        select(SkillAssessment)
        .where(SkillAssessment.user_id == user.id)
        .order_by(SkillAssessment.created_at.desc())
        .limit(20)
    ).all()
    return [summary(item) for item in assessments]


@router.post(
    "/assessments",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_assessment(
    payload: StartAssessmentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = "Python Backend Developer"
    challenge = get_challenge(role)
    assessment = SkillAssessment(
        user_id=user.id,
        role=role,
        level=payload.level,
        job_description=payload.job_description.strip(),
        resume_skills=payload.resume_skills,
        challenge_id=challenge.id,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return response(assessment)


@router.get("/public/{share_token}", response_model=PublicSkillPassportResponse)
def public_passport(share_token: str, db: Session = Depends(get_db)):
    assessment = db.scalar(
        select(SkillAssessment).where(SkillAssessment.share_token == share_token)
    )
    if not assessment or assessment.status != "completed" or not assessment.completed_at:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill Passport not found")
    scores = [
        SkillScoreResponse(name=name, score=float(score), status=skill_status(float(score)))
        for name, score in assessment.skill_scores.items()
    ]
    return PublicSkillPassportResponse(
        role=assessment.role,
        level=assessment.level,
        overall_score=float(assessment.overall_score or 0),
        skill_scores=scores,
        evidence=assessment.evidence,
        improvements=assessment.improvements,
        completed_at=assessment.completed_at,
    )


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return response(owned_assessment(db, assessment_id, user.id))


@router.post(
    "/assessments/{assessment_id}/submission",
    response_model=SubmissionResultResponse,
)
def submit_code(
    assessment_id: str,
    payload: SubmitCodeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = owned_assessment(db, assessment_id, user.id)
    if assessment.status == "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Assessment is complete")

    test_results = [item.model_dump() for item in payload.test_results]
    review = evaluate_code(payload.code, test_results)
    assessment.code_submission = payload.code
    assessment.test_results = test_results
    assessment.code_score = float(review["code_score"])
    assessment.test_score = float(review["test_score"])
    assessment.status = "viva"
    db.commit()

    return SubmissionResultResponse(
        code_score=assessment.code_score,
        test_score=assessment.test_score,
        passed_tests=int(review["passed_tests"]),
        total_tests=int(review["total_tests"]),
        feedback=list(review["feedback"]),
        ready_for_viva=True,
    )


@router.post("/assessments/{assessment_id}/viva", response_model=AssessmentResponse)
def submit_viva(
    assessment_id: str,
    payload: SubmitVivaRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = owned_assessment(db, assessment_id, user.id)
    if assessment.status == "completed":
        return response(assessment)
    if not assessment.code_submission or assessment.code_score is None or assessment.test_score is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submit the coding challenge before the viva",
        )

    answers = [item.model_dump() for item in payload.answers]
    viva = evaluate_viva(assessment.code_submission, answers, assessment.role)
    passport = build_passport(assessment.code_score, assessment.test_score, viva)

    assessment.viva_answers = answers
    assessment.viva_score = float(viva["viva_score"])
    assessment.problem_solving_score = float(viva["problem_solving_score"])
    assessment.overall_score = float(passport["overall_score"])
    assessment.skill_scores = dict(passport["skill_scores"])
    assessment.evidence = list(passport["evidence"])
    assessment.improvements = list(passport["improvements"])
    assessment.evaluation_provider = str(viva["provider"])
    assessment.status = "completed"
    assessment.completed_at = datetime.now(UTC)
    db.commit()
    db.refresh(assessment)
    return response(assessment)
