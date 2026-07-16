import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}

SECTION_ALIASES: dict[str, tuple[str, ...]] = {
    "Summary": ("summary", "profile", "objective", "about me"),
    "Skills": ("skills", "technical skills", "technologies", "tech stack"),
    "Experience": ("experience", "work experience", "employment", "internship"),
    "Education": ("education", "academic background", "qualification"),
    "Projects": ("projects", "personal projects", "academic projects"),
    "Certifications": ("certifications", "certificates", "achievements", "awards"),
}

ROLE_SKILLS: dict[str, tuple[str, ...]] = {
    "software engineer": (
        "python",
        "java",
        "javascript",
        "typescript",
        "react",
        "node.js",
        "fastapi",
        "flask",
        "sql",
        "mongodb",
        "git",
        "docker",
        "aws",
        "rest api",
        "data structures",
        "algorithms",
    ),
    "data scientist": (
        "python",
        "sql",
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "machine learning",
        "deep learning",
        "statistics",
        "data visualization",
        "matplotlib",
        "power bi",
        "tableau",
        "nlp",
        "computer vision",
        "aws",
        "docker",
    ),
    "product manager": (
        "product strategy",
        "roadmap",
        "user research",
        "analytics",
        "sql",
        "a/b testing",
        "agile",
        "scrum",
        "jira",
        "figma",
        "stakeholder management",
        "market research",
        "prioritization",
    ),
}

GENERAL_SKILLS = (
    "communication",
    "leadership",
    "problem solving",
    "teamwork",
    "github",
    "linux",
    "cloud",
)

ACTION_VERBS = (
    "achieved",
    "automated",
    "built",
    "created",
    "delivered",
    "designed",
    "developed",
    "implemented",
    "improved",
    "increased",
    "launched",
    "led",
    "optimized",
    "reduced",
    "resolved",
    "scaled",
    "trained",
)


class ResumeExtractionError(ValueError):
    pass


def extract_resume_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ResumeExtractionError("Upload a PDF, DOCX, or TXT resume")

    try:
        if suffix == ".pdf":
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif suffix == ".docx":
            document = Document(io.BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        else:
            text = content.decode("utf-8-sig")
    except Exception as exc:
        raise ResumeExtractionError("The resume could not be read. Try exporting it again") from exc

    cleaned_lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in cleaned_lines if line)


def _has_section(text: str, aliases: tuple[str, ...]) -> bool:
    for line in text.lower().splitlines():
        normalized = re.sub(r"[^a-z ]", "", line).strip()
        if any(normalized == alias or normalized.startswith(f"{alias} ") for alias in aliases):
            return True
    return False


def _contains_phrase(text: str, phrase: str) -> bool:
    return bool(re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text, flags=re.IGNORECASE))


def analyze_resume(text: str, filename: str, target_role: str) -> dict[str, object]:
    lower_text = text.lower()
    words = re.findall(r"\b[\w+#.-]+\b", text)
    word_count = len(words)

    found_sections = [
        section for section, aliases in SECTION_ALIASES.items() if _has_section(text, aliases)
    ]
    missing_sections = [section for section in SECTION_ALIASES if section not in found_sections]

    contact_checks = {
        "email": bool(re.search(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", text, re.I)),
        "phone": bool(re.search(r"(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){10}\b", text)),
        "linkedin": "linkedin.com/" in lower_text,
        "github": "github.com/" in lower_text,
    }

    role_key = target_role.strip().lower()
    role_skills = ROLE_SKILLS.get(role_key, ROLE_SKILLS["software engineer"])
    skill_pool = dict.fromkeys((*role_skills, *GENERAL_SKILLS))
    detected_skills = sorted(skill for skill in skill_pool if _contains_phrase(text, skill))

    action_count = sum(len(re.findall(rf"\b{verb}\b", lower_text)) for verb in ACTION_VERBS)
    metric_count = len(
        re.findall(
            r"(?:\b\d+(?:\.\d+)?%|\b\d+\+|(?:₹|\$|€)\s?\d+|"
            r"\b\d+\s?(?:users|clients|projects|models|requests|seconds|minutes|hours|days)\b)",
            lower_text,
        )
    )

    contact_score = min(15, sum(contact_checks.values()) * 5)
    structure_score = min(30, len(found_sections) * 5)
    skills_score = min(20, round(len(detected_skills) * 2.5))
    impact_score = min(20, min(action_count, 5) * 2 + min(metric_count, 5) * 2)

    if 300 <= word_count <= 900:
        length_score = 10
    elif 200 <= word_count < 300 or 900 < word_count <= 1100:
        length_score = 6
    else:
        length_score = 2
    line_score = 5 if len(text.splitlines()) >= 12 else 2
    readability_score = length_score + line_score

    category_scores = {
        "contact": contact_score,
        "structure": structure_score,
        "skills": skills_score,
        "impact": impact_score,
        "readability": readability_score,
    }
    overall_score = sum(category_scores.values())

    if overall_score >= 80:
        verdict = "Strong resume"
    elif overall_score >= 65:
        verdict = "Good foundation"
    elif overall_score >= 50:
        verdict = "Needs improvement"
    else:
        verdict = "Major revision recommended"

    strengths: list[str] = []
    if contact_checks["email"] and contact_checks["phone"]:
        strengths.append("Email and phone details are easy for recruiters to find.")
    if len(found_sections) >= 5:
        strengths.append("The resume has a clear, ATS-friendly section structure.")
    if len(detected_skills) >= 6:
        strengths.append(f"It shows relevant skills for a {target_role} role.")
    if action_count >= 4:
        strengths.append("Experience bullets use strong action-oriented language.")
    if metric_count >= 2:
        strengths.append("Achievements include measurable evidence and outcomes.")
    if not strengths:
        strengths.append("The resume text was extracted successfully and can now be improved.")

    improvements: list[str] = []
    if missing_sections:
        improvements.append(f"Add or clearly label: {', '.join(missing_sections[:4])}.")
    missing_contact = [name.title() for name, present in contact_checks.items() if not present]
    if missing_contact:
        improvements.append(f"Add these contact links or details: {', '.join(missing_contact)}.")
    if len(detected_skills) < 6:
        improvements.append(
            f"Add more role-relevant skills for {target_role}, but only those you can demonstrate."
        )
    if action_count < 4:
        improvements.append("Start achievement bullets with action verbs such as Built, Improved, or Led.")
    if metric_count < 2:
        improvements.append("Quantify project impact with percentages, counts, time saved, or accuracy.")
    if word_count < 300:
        improvements.append("Add useful project or experience evidence; the resume is currently too brief.")
    elif word_count > 900:
        improvements.append("Remove repetition and keep the resume focused on the target role.")

    return {
        "filename": filename,
        "target_role": target_role,
        "overall_score": overall_score,
        "verdict": verdict,
        "word_count": word_count,
        "category_scores": category_scores,
        "contact_checks": contact_checks,
        "found_sections": found_sections,
        "missing_sections": missing_sections,
        "detected_skills": detected_skills,
        "strengths": strengths[:5],
        "improvements": improvements[:6],
    }

