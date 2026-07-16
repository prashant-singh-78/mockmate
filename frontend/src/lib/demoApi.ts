import type {
  AnswerResult,
  InterviewSession,
  Question,
  SkillAssessment,
  SkillAssessmentSummary,
  SkillProofChallenge,
  SkillProofTestResult,
  User,
} from "../types";

const USER_KEY = "mockmate_demo_user";
const AUTH_KEY = "mockmate_demo_auth";
const SESSIONS_KEY = "mockmate_demo_sessions";
const ASSESSMENTS_KEY = "mockmate_demo_skillproof";

export class DemoApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const questions: Record<string, Question[]> = {
  "Software Engineer": [
    { id: "se-1", prompt: "Tell me about a technically difficult project you built.", category: "Communication" },
    { id: "se-2", prompt: "How would you design an API that must handle sudden traffic spikes?", category: "System design" },
    { id: "se-3", prompt: "Describe a production bug you diagnosed and fixed.", category: "Problem solving" },
    { id: "se-4", prompt: "When would you choose SQL over NoSQL?", category: "Fundamentals" },
    { id: "se-5", prompt: "How do you make code ready for production?", category: "Engineering" },
  ],
  "Data Scientist": [
    { id: "ds-1", prompt: "Tell me about a machine-learning project and its real outcome.", category: "Communication" },
    { id: "ds-2", prompt: "How would you handle an imbalanced classification dataset?", category: "Modeling" },
    { id: "ds-3", prompt: "A model works offline but poorly in production. What do you check?", category: "MLOps" },
    { id: "ds-4", prompt: "Explain overfitting to a non-technical stakeholder.", category: "Communication" },
    { id: "ds-5", prompt: "How do you evaluate whether a model should be deployed?", category: "Evaluation" },
  ],
  "Product Manager": [
    { id: "pm-1", prompt: "Tell me about a product decision you made with incomplete information.", category: "Judgment" },
    { id: "pm-2", prompt: "How would you prioritize a crowded feature backlog?", category: "Prioritization" },
    { id: "pm-3", prompt: "A key metric drops 20% overnight. What do you do?", category: "Analytics" },
    { id: "pm-4", prompt: "How do you work through disagreement with engineering?", category: "Collaboration" },
    { id: "pm-5", prompt: "How would you measure the success of a new onboarding flow?", category: "Metrics" },
  ],
};

const skillProofChallenge: SkillProofChallenge = {
  id: "python-email-normalizer-v1",
  title: "Build a production-ready email normalizer",
  summary: "Implement a validation boundary used by a registration API. Return a consistent email or reject unsafe input.",
  instructions: [
    "Strip leading and trailing whitespace, then lowercase the email.",
    "Reject empty input and addresses without exactly one @ symbol.",
    "Require a non-empty local part and a domain containing a dot.",
    "Raise ValueError for invalid input and return the normalized string otherwise.",
    "Do not import packages or read files; the challenge is self-contained.",
  ],
  starter_code: "def normalize_email(email: str) -> str:\n    \"\"\"Return a normalized email or raise ValueError.\"\"\"\n    # Your implementation here\n    pass\n",
  function_name: "normalize_email",
  tests: [
    { id: "trim-lower", label: "Trims whitespace and lowercases", input: "  Candidate@Example.COM  ", expected: "candidate@example.com", expected_error: null },
    { id: "plus-tag", label: "Preserves a valid plus tag", input: "Dev+API@example.com", expected: "dev+api@example.com", expected_error: null },
    { id: "empty", label: "Rejects empty input", input: "   ", expected: null, expected_error: "ValueError" },
    { id: "missing-at", label: "Rejects an address without @", input: "candidate.example.com", expected: null, expected_error: "ValueError" },
    { id: "bad-domain", label: "Rejects a domain without a dot", input: "candidate@localhost", expected: null, expected_error: "ValueError" },
  ],
  estimated_minutes: 15,
};

const vivaQuestions = [
  "Walk me through your validation order. Why did you normalize before validating?",
  "Which edge cases are still missing, and which would you add first in production?",
  "How would you use this function safely inside a FastAPI registration endpoint?",
];

function readSessions(): InterviewSession[] {
  return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]") as InterviewSession[];
}

function writeSessions(sessions: InterviewSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function readAssessments(): SkillAssessment[] {
  return JSON.parse(localStorage.getItem(ASSESSMENTS_KEY) || "[]") as SkillAssessment[];
}

function writeAssessments(assessments: SkillAssessment[]) {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
}

function assessmentSummary(item: SkillAssessment): SkillAssessmentSummary {
  return {
    id: item.id,
    role: item.role,
    level: item.level,
    status: item.status,
    overall_score: item.overall_score,
    created_at: item.created_at,
    completed_at: item.completed_at,
  };
}

function requireUser(): User {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw || localStorage.getItem(AUTH_KEY) !== "true") {
    throw new DemoApiError("Not authenticated", 401);
  }
  return JSON.parse(raw) as User;
}

function evaluate(answer: string) {
  const words = answer.trim().split(/\s+/).length;
  const structure = ["first", "then", "because", "result", "finally", "example"].filter((word) =>
    answer.toLowerCase().includes(word),
  ).length;
  const score = Math.min(9.4, Math.round((4.2 + Math.min(words / 45, 1) * 3 + Math.min(structure, 3) * 0.6) * 10) / 10);
  const feedback = score >= 8
    ? "Strong structure and useful detail. Make the result even sharper by adding one measurable impact."
    : "Good direction. Add a specific example, make your personal contribution clear, and finish with the result.";
  return {
    score,
    feedback,
    suggested_answer: "Use a simple situation → responsibility → action → result structure. Name the trade-off you considered and quantify what improved.",
  };
}

export async function demoApi<T>(path: string, options: RequestInit): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const method = options.method || "GET";
  const body = typeof options.body === "string"
    ? JSON.parse(options.body) as Record<string, unknown>
    : {};

  if (path === "/auth/register" && method === "POST") {
    const user: User = {
      id: crypto.randomUUID(),
      name: String(body.name),
      email: String(body.email).toLowerCase(),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_KEY, "true");
    return { user } as T;
  }

  if (path === "/auth/login" && method === "POST") {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) throw new DemoApiError("Create an account first in this private demo", 401);
    const user = JSON.parse(stored) as User;
    if (user.email !== String(body.email).toLowerCase()) throw new DemoApiError("Use the email you registered in this demo", 401);
    localStorage.setItem(AUTH_KEY, "true");
    return { user } as T;
  }

  if (path === "/auth/logout" && method === "POST") {
    localStorage.setItem(AUTH_KEY, "false");
    return undefined as T;
  }

  if (path === "/auth/me") return { user: requireUser() } as T;

  const publicPassportMatch = path.match(/^\/skillproof\/public\/([^/]+)$/);
  if (publicPassportMatch && method === "GET") {
    const assessment = readAssessments().find((item) => item.share_token === publicPassportMatch[1] && item.status === "completed");
    if (!assessment) throw new DemoApiError("Skill Passport not found", 404);
    return {
      role: assessment.role,
      level: assessment.level,
      overall_score: assessment.overall_score,
      skill_scores: assessment.skill_scores,
      evidence: assessment.evidence,
      improvements: assessment.improvements,
      completed_at: assessment.completed_at,
    } as T;
  }
  requireUser();

  if (path === "/skillproof/assessments" && method === "GET") {
    return readAssessments().map(assessmentSummary) as T;
  }

  if (path === "/skillproof/assessments" && method === "POST") {
    const now = new Date().toISOString();
    const assessment: SkillAssessment = {
      id: crypto.randomUUID(),
      share_token: crypto.randomUUID(),
      role: "Python Backend Developer",
      level: body.level === "mid" ? "mid" : "entry",
      status: "challenge",
      overall_score: null,
      created_at: now,
      completed_at: null,
      job_description: String(body.job_description || ""),
      resume_skills: Array.isArray(body.resume_skills) ? body.resume_skills.map(String) : [],
      challenge: skillProofChallenge,
      test_results: [],
      code_score: null,
      test_score: null,
      viva_questions: vivaQuestions,
      viva_answers: [],
      viva_score: null,
      problem_solving_score: null,
      skill_scores: [],
      evidence: [],
      improvements: [],
      evaluation_provider: "deterministic",
    };
    writeAssessments([assessment, ...readAssessments()]);
    return assessment as T;
  }

  const skillSubmissionMatch = path.match(/^\/skillproof\/assessments\/([^/]+)\/submission$/);
  if (skillSubmissionMatch && method === "POST") {
    const assessments = readAssessments();
    const assessment = assessments.find((item) => item.id === skillSubmissionMatch[1]);
    if (!assessment) throw new DemoApiError("Assessment not found", 404);
    const testResults = Array.isArray(body.test_results) ? body.test_results as SkillProofTestResult[] : [];
    const passed = testResults.filter((item) => item.passed).length;
    const code = String(body.code || "");
    const codeSignals = ["strip", "lower", "ValueError", "return", "if", "split"].filter((signal) => code.includes(signal)).length;
    assessment.test_results = testResults;
    assessment.test_score = Math.round(passed / skillProofChallenge.tests.length * 100);
    assessment.code_score = Math.min(100, 34 + codeSignals * 11);
    assessment.status = "viva";
    writeAssessments(assessments);
    return {
      code_score: assessment.code_score,
      test_score: assessment.test_score,
      passed_tests: passed,
      total_tests: skillProofChallenge.tests.length,
      feedback: [
        passed === skillProofChallenge.tests.length ? "All browser-isolated behavior tests passed." : `${passed}/${skillProofChallenge.tests.length} behavior tests passed.`,
        "Static review found explicit normalization, validation, and return paths.",
      ],
      ready_for_viva: true,
    } as T;
  }

  const skillVivaMatch = path.match(/^\/skillproof\/assessments\/([^/]+)\/viva$/);
  if (skillVivaMatch && method === "POST") {
    const assessments = readAssessments();
    const assessment = assessments.find((item) => item.id === skillVivaMatch[1]);
    if (!assessment) throw new DemoApiError("Assessment not found", 404);
    const answers = Array.isArray(body.answers) ? body.answers as Array<{ question: string; answer: string }> : [];
    const combined = answers.map((item) => item.answer).join(" ").toLowerCase();
    const terms = ["because", "test", "edge", "database", "security", "first", "failure", "rate"];
    const hits = terms.filter((term) => combined.includes(term)).length;
    assessment.viva_answers = answers;
    assessment.viva_score = Math.min(96, 58 + hits * 5);
    assessment.problem_solving_score = Math.min(96, 55 + hits * 5);
    assessment.overall_score = Math.round(
      (assessment.test_score || 0) * .4 + (assessment.code_score || 0) * .2 + assessment.viva_score * .25 + assessment.problem_solving_score * .15,
    );
    assessment.skill_scores = [
      { name: "Python", score: Math.round((assessment.code_score || 0) * .45 + (assessment.test_score || 0) * .35 + assessment.viva_score * .2), status: "Verified" },
      { name: "API Design", score: Math.round((assessment.code_score || 0) * .35 + assessment.viva_score * .45 + assessment.problem_solving_score * .2), status: assessment.viva_score >= 80 ? "Verified" : "Demonstrated" },
      { name: "Testing", score: Math.round((assessment.test_score || 0) * .75 + assessment.problem_solving_score * .25), status: "Verified" },
      { name: "Production Safety", score: Math.round(assessment.viva_score * .55 + assessment.problem_solving_score * .45), status: assessment.problem_solving_score >= 80 ? "Verified" : "Demonstrated" },
    ];
    assessment.evidence = [
      `Browser-isolated tests: ${assessment.test_score}% passed.`,
      `Static code review: ${assessment.code_score}% for structure, validation, and safety.`,
      "The viva connects implementation choices to API behavior and failure modes.",
    ];
    assessment.improvements = [
      "Discuss database-level uniqueness because application validation can race.",
      "Add monitoring and abuse controls to the production design.",
    ];
    assessment.status = "completed";
    assessment.completed_at = new Date().toISOString();
    writeAssessments(assessments);
    return assessment as T;
  }

  const skillAssessmentMatch = path.match(/^\/skillproof\/assessments\/([^/]+)$/);
  if (skillAssessmentMatch && method === "GET") {
    const assessment = readAssessments().find((item) => item.id === skillAssessmentMatch[1]);
    if (!assessment) throw new DemoApiError("Assessment not found", 404);
    return assessment as T;
  }

  if (path === "/interviews" && method === "GET") return readSessions() as T;

  if (path === "/interviews" && method === "POST") {
    const requestedRole = String(body.role);
    const role = requestedRole in questions ? requestedRole : "Software Engineer";
    const session: InterviewSession = {
      id: crypto.randomUUID(),
      role,
      level: body.level as InterviewSession["level"],
      status: "active",
      current_index: 0,
      total_questions: 5,
      overall_score: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      current_question: questions[role][0],
      answers: [],
    };
    writeSessions([session, ...readSessions()]);
    return session as T;
  }

  const answerMatch = path.match(/^\/interviews\/([^/]+)\/answers$/);
  if (answerMatch && method === "POST") {
    const sessions = readSessions();
    const index = sessions.findIndex((item) => item.id === answerMatch[1]);
    if (index < 0) throw new DemoApiError("Interview not found", 404);
    const session = sessions[index];
    const question = questions[session.role][session.current_index];
    const answerText = String(body.answer);
    const review = evaluate(answerText);
    session.answers.push({
      id: crypto.randomUUID(),
      question_text: question.prompt,
      answer_text: answerText,
      ...review,
    });
    session.current_index += 1;
    const completed = session.current_index >= session.total_questions;
    if (completed) {
      session.status = "completed";
      session.completed_at = new Date().toISOString();
      session.overall_score = Math.round((session.answers.reduce((sum, item) => sum + item.score, 0) / session.answers.length) * 10) / 10;
      session.current_question = null;
    } else {
      session.current_question = questions[session.role][session.current_index];
    }
    writeSessions(sessions);
    return {
      ...review,
      completed,
      overall_score: session.overall_score,
      next_question: session.current_question,
    } as AnswerResult as T;
  }

  const sessionMatch = path.match(/^\/interviews\/([^/]+)$/);
  if (sessionMatch && method === "GET") {
    const session = readSessions().find((item) => item.id === sessionMatch[1]);
    if (!session) throw new DemoApiError("Interview not found", 404);
    return session as T;
  }

  throw new DemoApiError("Demo route not found", 404);
}
