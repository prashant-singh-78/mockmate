import ast
import json
from dataclasses import asdict, dataclass
from typing import Any

from app.core.config import settings


@dataclass(frozen=True)
class ChallengeTest:
    id: str
    label: str
    input: str
    expected: str | None = None
    expected_error: str | None = None


@dataclass(frozen=True)
class Challenge:
    id: str
    title: str
    summary: str
    instructions: tuple[str, ...]
    starter_code: str
    function_name: str
    tests: tuple[ChallengeTest, ...]
    estimated_minutes: int


PYTHON_BACKEND_CHALLENGE = Challenge(
    id="python-email-normalizer-v1",
    title="Build a production-ready email normalizer",
    summary=(
        "Implement a small validation boundary used by a registration API. "
        "The function must return a consistent email or reject unsafe input."
    ),
    instructions=(
        "Strip leading and trailing whitespace, then lowercase the email.",
        "Reject empty input and addresses without exactly one @ symbol.",
        "Require a non-empty local part and a domain containing a dot.",
        "Raise ValueError for invalid input and return the normalized string otherwise.",
        "Do not import packages or read files; the challenge is intentionally self-contained.",
    ),
    starter_code=(
        "def normalize_email(email: str) -> str:\n"
        "    \"\"\"Return a normalized email or raise ValueError.\"\"\"\n"
        "    # Your implementation here\n"
        "    pass\n"
    ),
    function_name="normalize_email",
    tests=(
        ChallengeTest(
            id="trim-lower",
            label="Trims whitespace and lowercases",
            input="  Candidate@Example.COM  ",
            expected="candidate@example.com",
        ),
        ChallengeTest(
            id="plus-tag",
            label="Preserves a valid plus tag",
            input="Dev+API@example.com",
            expected="dev+api@example.com",
        ),
        ChallengeTest(
            id="empty",
            label="Rejects empty input",
            input="   ",
            expected_error="ValueError",
        ),
        ChallengeTest(
            id="missing-at",
            label="Rejects an address without @",
            input="candidate.example.com",
            expected_error="ValueError",
        ),
        ChallengeTest(
            id="bad-domain",
            label="Rejects a domain without a dot",
            input="candidate@localhost",
            expected_error="ValueError",
        ),
    ),
    estimated_minutes=15,
)

VIVA_QUESTIONS = (
    "Walk me through your validation order. Why did you normalize before validating?",
    "Which edge cases are still missing, and which would you add first in production?",
    "How would you use this function safely inside a FastAPI registration endpoint?",
)

BLOCKED_CALLS = {
    "breakpoint",
    "compile",
    "eval",
    "exec",
    "getattr",
    "globals",
    "input",
    "locals",
    "open",
    "setattr",
    "vars",
    "__import__",
}


def get_challenge(_: str = "Python Backend Developer") -> Challenge:
    return PYTHON_BACKEND_CHALLENGE


def challenge_dict(challenge: Challenge) -> dict[str, Any]:
    return {
        "id": challenge.id,
        "title": challenge.title,
        "summary": challenge.summary,
        "instructions": list(challenge.instructions),
        "starter_code": challenge.starter_code,
        "function_name": challenge.function_name,
        "tests": [asdict(test) for test in challenge.tests],
        "estimated_minutes": challenge.estimated_minutes,
    }


def evaluate_code(code: str, submitted_tests: list[dict[str, object]]) -> dict[str, object]:
    challenge = PYTHON_BACKEND_CHALLENGE
    expected_ids = {test.id for test in challenge.tests}
    result_by_id = {
        str(item.get("id")): bool(item.get("passed"))
        for item in submitted_tests
        if str(item.get("id")) in expected_ids
    }
    passed_tests = sum(1 for test_id in expected_ids if result_by_id.get(test_id, False))
    test_score = round(passed_tests / len(expected_ids) * 100, 1)
    feedback: list[str] = []

    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return {
            "code_score": 0.0,
            "test_score": test_score,
            "passed_tests": passed_tests,
            "total_tests": len(expected_ids),
            "feedback": [f"Python syntax error near line {exc.lineno or 1}."],
        }

    blocked_nodes = (ast.Import, ast.ImportFrom, ast.ClassDef, ast.AsyncFunctionDef, ast.Global)
    if any(isinstance(node, blocked_nodes) for node in ast.walk(tree)):
        return {
            "code_score": 0.0,
            "test_score": test_score,
            "passed_tests": passed_tests,
            "total_tests": len(expected_ids),
            "feedback": ["Imports, classes, async functions, and global state are disabled."],
        }

    unsafe_calls = {
        node.func.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id in BLOCKED_CALLS
    }
    private_attributes = {
        node.attr for node in ast.walk(tree) if isinstance(node, ast.Attribute) and node.attr.startswith("_")
    }
    if unsafe_calls or private_attributes:
        return {
            "code_score": 0.0,
            "test_score": test_score,
            "passed_tests": passed_tests,
            "total_tests": len(expected_ids),
            "feedback": ["The solution uses an operation that is outside this safe challenge."],
        }

    functions = [node for node in tree.body if isinstance(node, ast.FunctionDef)]
    target = next((node for node in functions if node.name == challenge.function_name), None)
    score = 20.0
    if target:
        score += 20
    else:
        feedback.append(f"Define the required `{challenge.function_name}` function.")

    attributes = {
        node.attr for node in ast.walk(target or tree) if isinstance(node, ast.Attribute)
    }
    if "strip" in attributes:
        score += 12
    else:
        feedback.append("Normalize surrounding whitespace with strip().")
    if "lower" in attributes:
        score += 12
    else:
        feedback.append("Normalize case with lower().")

    raises_value_error = any(
        isinstance(node, ast.Raise)
        and isinstance(node.exc, ast.Call)
        and isinstance(node.exc.func, ast.Name)
        and node.exc.func.id == "ValueError"
        for node in ast.walk(target or tree)
    )
    if raises_value_error:
        score += 16
    else:
        feedback.append("Use ValueError to make invalid input explicit to API callers.")

    branches = sum(isinstance(node, ast.If) for node in ast.walk(target or tree))
    if branches >= 2:
        score += 10
    else:
        feedback.append("Add explicit branches for empty, local-part, and domain validation.")

    if target and any(isinstance(node, ast.Return) for node in ast.walk(target)):
        score += 10
    else:
        feedback.append("Return the normalized value on the successful path.")

    code_score = round(min(score, 100.0), 1)
    if passed_tests == len(expected_ids):
        feedback.insert(0, "All browser-isolated behavior tests passed.")
    elif passed_tests:
        feedback.insert(0, f"{passed_tests}/{len(expected_ids)} behavior tests passed.")
    else:
        feedback.insert(0, "No behavior tests passed yet; use the failure details to iterate.")

    return {
        "code_score": code_score,
        "test_score": test_score,
        "passed_tests": passed_tests,
        "total_tests": len(expected_ids),
        "feedback": feedback[:5],
    }


def _clamp(value: object) -> float:
    try:
        return round(max(0.0, min(float(value), 100.0)), 1)
    except (TypeError, ValueError):
        return 0.0


def _deterministic_viva(answers: list[dict[str, str]]) -> dict[str, object]:
    keyword_sets = (
        {"normalize", "strip", "lower", "validate", "order", "error", "consistent"},
        {"edge", "empty", "unicode", "length", "domain", "duplicate", "whitespace"},
        {"fastapi", "schema", "database", "unique", "log", "test", "rate", "security"},
    )
    answer_scores: list[float] = []
    combined = " ".join(str(item.get("answer", "")) for item in answers).lower()
    for index, item in enumerate(answers):
        answer = str(item.get("answer", ""))
        words = answer.split()
        keywords = keyword_sets[min(index, len(keyword_sets) - 1)]
        coverage = sum(keyword in answer.lower() for keyword in keywords)
        length_component = min(len(words) / 70, 1) * 45
        keyword_component = min(coverage / 4, 1) * 45
        structure_component = 10 if any(term in answer.lower() for term in ("because", "first", "then")) else 4
        answer_scores.append(length_component + keyword_component + structure_component)

    viva_score = _clamp(sum(answer_scores) / max(len(answer_scores), 1))
    reasoning_terms = ("because", "trade-off", "first", "then", "test", "failure", "edge", "monitor")
    reasoning_hits = sum(term in combined for term in reasoning_terms)
    problem_solving_score = _clamp(45 + reasoning_hits * 7)

    evidence = []
    if viva_score >= 75:
        evidence.append("The viva answers connect implementation choices to API behavior and failure modes.")
    else:
        evidence.append("The candidate completed all three viva prompts with reviewable explanations.")
    if "test" in combined or "edge" in combined:
        evidence.append("The explanation identifies testing or edge-case work beyond the happy path.")

    improvements = []
    if viva_score < 80:
        improvements.append("Explain one concrete production failure mode and how you would observe it.")
    if "database" not in combined and "unique" not in combined:
        improvements.append("Discuss database-level uniqueness because application validation can race.")
    if "rate" not in combined and "security" not in combined:
        improvements.append("Add abuse controls such as rate limiting and safe error messages.")

    return {
        "viva_score": viva_score,
        "problem_solving_score": problem_solving_score,
        "evidence": evidence,
        "improvements": improvements,
        "provider": "deterministic",
    }


def _json_object(text: str) -> dict[str, object]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
    value = json.loads(cleaned)
    if not isinstance(value, dict):
        raise ValueError("Expected an object")
    return value


def evaluate_viva(
    code: str,
    answers: list[dict[str, str]],
    role: str,
) -> dict[str, object]:
    fallback = _deterministic_viva(answers)
    if not settings.openai_api_key:
        return fallback

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds)
        prompt = f"""
You are the evidence evaluator for SkillProof, a practice assessment for {role}.
Evaluate only the candidate's technical explanations. Do not infer personality, accent,
emotion, age, gender, or employability. Return strict JSON with this shape:
{{"viva_score": 0-100, "problem_solving_score": 0-100,
  "evidence": [two short evidence statements],
  "improvements": [up to three specific improvements]}}

Submitted code:
{code[:3500]}

Viva answers:
{json.dumps(answers, ensure_ascii=False)[:7000]}
""".strip()
        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
        )
        result = _json_object(response.output_text)
        return {
            "viva_score": _clamp(result.get("viva_score")),
            "problem_solving_score": _clamp(result.get("problem_solving_score")),
            "evidence": [str(item)[:240] for item in result.get("evidence", [])][:3],
            "improvements": [str(item)[:240] for item in result.get("improvements", [])][:3],
            "provider": "openai",
        }
    except Exception:
        return fallback


def build_passport(
    code_score: float,
    test_score: float,
    viva_result: dict[str, object],
) -> dict[str, object]:
    viva_score = _clamp(viva_result.get("viva_score"))
    problem_score = _clamp(viva_result.get("problem_solving_score"))
    overall = round(
        test_score * 0.40 + code_score * 0.20 + viva_score * 0.25 + problem_score * 0.15,
        1,
    )
    skill_scores = {
        "Python": round(code_score * 0.45 + test_score * 0.35 + viva_score * 0.20, 1),
        "API Design": round(code_score * 0.35 + viva_score * 0.45 + problem_score * 0.20, 1),
        "Testing": round(test_score * 0.75 + problem_score * 0.25, 1),
        "Production Safety": round(viva_score * 0.55 + problem_score * 0.45, 1),
    }
    evidence = [
        f"Browser-isolated tests: {round(test_score)}% passed.",
        f"Static code review: {round(code_score)}% for structure, validation, and safety.",
        *[str(item) for item in viva_result.get("evidence", [])],
    ]
    return {
        "overall_score": overall,
        "skill_scores": skill_scores,
        "evidence": evidence[:5],
        "improvements": [str(item) for item in viva_result.get("improvements", [])][:4],
    }
