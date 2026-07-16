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

export interface ResumeAnalysis {
  filename: string;
  target_role: string;
  overall_score: number;
  verdict: string;
  word_count: number;
  category_scores: Record<string, number>;
  contact_checks: Record<string, boolean>;
  found_sections: string[];
  missing_sections: string[];
  detected_skills: string[];
  strengths: string[];
  improvements: string[];
}

export interface SkillProofTest {
  id: string;
  label: string;
  input: string;
  expected: string | null;
  expected_error: string | null;
}

export interface SkillProofTestResult {
  id: string;
  passed: boolean;
  detail: string;
}

export interface SkillProofChallenge {
  id: string;
  title: string;
  summary: string;
  instructions: string[];
  starter_code: string;
  function_name: string;
  tests: SkillProofTest[];
  estimated_minutes: number;
}

export interface SkillScore {
  name: string;
  score: number;
  status: "Verified" | "Demonstrated" | "Developing";
}

export interface SkillAssessmentSummary {
  id: string;
  role: string;
  level: "entry" | "mid";
  status: "challenge" | "viva" | "completed";
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface SkillAssessment extends SkillAssessmentSummary {
  share_token: string;
  job_description: string;
  resume_skills: string[];
  challenge: SkillProofChallenge;
  test_results: SkillProofTestResult[];
  code_score: number | null;
  test_score: number | null;
  viva_questions: string[];
  viva_answers: Array<{ question: string; answer: string }>;
  viva_score: number | null;
  problem_solving_score: number | null;
  skill_scores: SkillScore[];
  evidence: string[];
  improvements: string[];
  evaluation_provider: "openai" | "deterministic";
}

export interface SkillSubmissionResult {
  code_score: number;
  test_score: number;
  passed_tests: number;
  total_tests: number;
  feedback: string[];
  ready_for_viva: boolean;
}

export interface PublicSkillPassport {
  role: string;
  level: string;
  overall_score: number;
  skill_scores: SkillScore[];
  evidence: string[];
  improvements: string[];
  completed_at: string;
}
