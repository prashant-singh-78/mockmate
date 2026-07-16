export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Question {
  id: string;
  prompt: string;
  category: string;
}

export interface InterviewAnswer {
  id: string;
  question_text: string;
  answer_text: string;
  score: number;
  feedback: string;
  suggested_answer: string;
}

export interface InterviewSummary {
  id: string;
  role: string;
  level: "entry" | "mid" | "senior";
  status: "active" | "completed";
  current_index: number;
  total_questions: number;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface InterviewSession extends InterviewSummary {
  current_question: Question | null;
  answers: InterviewAnswer[];
}

export interface AnswerResult {
  score: number;
  feedback: string;
  suggested_answer: string;
  completed: boolean;
  overall_score: number | null;
  next_question: Question | null;
}

