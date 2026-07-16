import type { AnswerResult, InterviewSession, Question, User } from "../types";

const USER_KEY = "mockmate_demo_user";
const AUTH_KEY = "mockmate_demo_auth";
const SESSIONS_KEY = "mockmate_demo_sessions";

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

function readSessions(): InterviewSession[] {
  return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]") as InterviewSession[];
}

function writeSessions(sessions: InterviewSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
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
  const body = options.body ? JSON.parse(String(options.body)) as Record<string, string> : {};

  if (path === "/auth/register" && method === "POST") {
    const user: User = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email.toLowerCase(),
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
    if (user.email !== body.email.toLowerCase()) throw new DemoApiError("Use the email you registered in this demo", 401);
    localStorage.setItem(AUTH_KEY, "true");
    return { user } as T;
  }

  if (path === "/auth/logout" && method === "POST") {
    localStorage.setItem(AUTH_KEY, "false");
    return undefined as T;
  }

  if (path === "/auth/me") return { user: requireUser() } as T;
  requireUser();

  if (path === "/interviews" && method === "GET") return readSessions() as T;

  if (path === "/interviews" && method === "POST") {
    const role = body.role in questions ? body.role : "Software Engineer";
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
    const review = evaluate(body.answer);
    session.answers.push({
      id: crypto.randomUUID(),
      question_text: question.prompt,
      answer_text: body.answer,
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

