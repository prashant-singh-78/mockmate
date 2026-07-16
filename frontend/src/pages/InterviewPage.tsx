import { ArrowLeft, ArrowRight, Check, ChevronDown, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { FullPageLoader } from "../components/FullPageLoader";
import { api } from "../lib/api";
import type { AnswerResult, InterviewSession, Question } from "../types";

export function InterviewPage() {
  const { id } = useParams();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadSession = () => {
    if (!id) return;
    api<InterviewSession>(`/interviews/${id}`).then((data) => {
      setSession(data);
      setQuestion(data.current_question);
    });
  };

  useEffect(loadSession, [id]);

  if (!session) return <FullPageLoader />;
  if (session.status === "completed") return <ResultsView session={session} />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await api<AnswerResult>(`/interviews/${id}/answers`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });
      setResult(data);
    } catch {
      setError("We could not score that answer. Your text is still here—please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const continueInterview = () => {
    if (result?.completed) {
      loadSession();
      return;
    }
    setQuestion(result?.next_question || null);
    setSession((current) => current ? { ...current, current_index: current.current_index + 1 } : current);
    setAnswer("");
    setResult(null);
  };

  const progress = ((session.current_index + (result ? 1 : 0)) / session.total_questions) * 100;

  return (
    <div className="interview-room">
      <header className="room-header">
        <Link to="/dashboard" aria-label="Leave interview"><ArrowLeft size={19} /></Link>
        <div><strong>{session.role}</strong><small>{session.level} interview</small></div>
        <span className="room-progress-label">{Math.min(session.current_index + (result ? 1 : 0) + 1, session.total_questions)} / {session.total_questions}</span>
      </header>
      <div className="room-progress"><i style={{ width: `${progress}%` }} /></div>

      <main className="room-content">
        <section className="question-panel">
          <div className="interviewer-line"><span className="coach-avatar">M</span><div><strong>Mockmate coach</strong><small><i className="live-dot" /> Listening</small></div></div>
          <span className="question-category">{question?.category}</span>
          <h1>{question?.prompt}</h1>
          <p>Take a moment to think. A specific example and clear outcome usually make the strongest answer.</p>
          <div className="answer-tip"><Lightbulb size={18} /><span><strong>Quick structure</strong>Situation → your action → why you chose it → measurable result</span></div>
        </section>

        <section className="answer-panel">
          {!result ? (
            <form onSubmit={submit}>
              <div className="answer-heading"><div><span className="page-kicker">Your answer</span><h2>Respond in your own words</h2></div><span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span></div>
              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} minLength={20} maxLength={5000} placeholder="Start with the context. What was the challenge, what did you personally do, and what changed because of it?" required autoFocus />
              <div className="answer-footer">
                <span>Minimum 20 characters</span>
                {error && <p className="form-error">{error}</p>}
                <button className="button button-primary" disabled={submitting || answer.trim().length < 20}>{submitting ? <><LoaderCircle size={18} className="spin" /> Reviewing…</> : <>Get feedback <ArrowRight size={18} /></>}</button>
              </div>
            </form>
          ) : (
            <div className="inline-feedback">
              <div className="feedback-score-large"><span><Sparkles size={18} /> Answer review</span><strong>{result.score}<small>/10</small></strong></div>
              <div className="feedback-section"><span><Check size={18} /></span><div><h3>Coach feedback</h3><p>{result.feedback}</p></div></div>
              <div className="feedback-section suggestion"><span><Lightbulb size={18} /></span><div><h3>A stronger structure</h3><p>{result.suggested_answer}</p></div></div>
              <details><summary>Review my answer <ChevronDown size={17} /></summary><p>{answer}</p></details>
              <button className="button button-primary feedback-next" onClick={continueInterview}>{result.completed ? "See my results" : "Next question"}<ArrowRight size={18} /></button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResultsView({ session }: { session: InterviewSession }) {
  const score = session.overall_score || 0;
  const topAnswer = [...session.answers].sort((a, b) => b.score - a.score)[0];
  return (
    <div className="results-page">
      <header><Link to="/dashboard"><ArrowLeft size={18} /> Dashboard</Link><span>{session.role} · {session.level}</span></header>
      <main>
        <div className="results-hero">
          <span className="trophy"><Trophy size={28} /></span>
          <span className="eyebrow">Session complete</span>
          <h1>You showed up.<br />Now build on it.</h1>
          <div className="result-score"><strong>{score}</strong><span>/ 10<small>overall score</small></span></div>
          <p>{score >= 8 ? "You gave clear, well-structured answers. Your next edge is sharper evidence and tighter delivery." : score >= 6 ? "You have a solid base. Focus next on specific examples, your personal contribution, and measurable results." : "This session found the gaps—that is useful. Focus on one specific story and use a simple situation-action-result structure."}</p>
        </div>

        {topAnswer && <section className="result-highlight"><span><Sparkles size={20} /></span><div><small>Your strongest answer</small><h2>{topAnswer.question_text}</h2><p>{topAnswer.feedback}</p></div><strong>{topAnswer.score}</strong></section>}

        <section className="answer-breakdown">
          <div><span className="page-kicker">Detailed review</span><h2>Answer breakdown</h2></div>
          {session.answers.map((item, index) => (
            <details key={item.id} open={index === 0}>
              <summary><span>0{index + 1}</span><strong>{item.question_text}</strong><i>{item.score}/10 <ChevronDown size={17} /></i></summary>
              <div><p>{item.feedback}</p><small>Suggested approach</small><p>{item.suggested_answer}</p></div>
            </details>
          ))}
        </section>

        <div className="result-actions"><Link to="/practice" className="button button-primary"><RotateCcw size={17} /> Practice another round</Link><Link to="/dashboard" className="button button-secondary">Back to dashboard</Link></div>
      </main>
    </div>
  );
}

