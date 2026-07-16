from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.resume import ResumeAnalysisResponse
from app.services.resume_analyzer import ResumeExtractionError, analyze_resume, extract_resume_text

router = APIRouter(prefix="/resumes", tags=["resumes"])

MAX_RESUME_BYTES = 5 * 1024 * 1024


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_uploaded_resume(
    file: Annotated[UploadFile, File(description="PDF, DOCX, or TXT resume")],
    target_role: Annotated[str, Form(min_length=2, max_length=80)] = "Software Engineer",
    _: User = Depends(get_current_user),
):
    filename = Path(file.filename or "resume").name
    content = await file.read(MAX_RESUME_BYTES + 1)
    await file.close()

    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Resume must be 5 MB or smaller",
        )

    try:
        text = extract_resume_text(filename, content)
    except ResumeExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc

    if len(text) < 80:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Not enough readable resume text was found",
        )

    return ResumeAnalysisResponse.model_validate(analyze_resume(text, filename, target_role))

