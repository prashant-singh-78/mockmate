import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clock3, Code2, LoaderCircle, Play, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../lib/api";
import { runPythonChallenge } from "../lib/pythonRunner";
import type { SkillAssessment, SkillProofTestResult, SkillSubmissionResult } from "../types";

export function SkillProofChallengePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<SkillAssessment | null>(null);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<SkillProofTestResult[]>([]);
  const [review, setReview] = useState<SkillSubmissionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SkillAssessment>(`/skillproof/assessments/${id}`)
      .then((item) => {
        if (item.status === "completed") navigate(`/skillproof/${id}/report`, { replace: true });
        else if (item.status === "viva") navigate(`/skillproof/${id}/viva`, { replace: true });
        else {
          setAssessment(item);
          setCode(item.challenge.starter_code);
        }
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Assessment could not be loaded"));
  }, [id, navigate]);

  const runTests = async () => {
    if (!assessment) return [];
    setRunning(true);
    setError("");
    try {
      const results = await runPythonChallenge(code, assessment.challenge.function_name, assessment.challenge.tests);
      setTestResults(results);
      return results;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tests could not run");
      return [];
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    const results = testResults.length ? testResults : await runTests();
    if (!results.length) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await api<SkillSubmissionResult>(`/skillproof/assessments/${id}/submission`, {
        method: "POST",
        body: JSON.stringify({ code, test_results: results }),
      });
      setReview(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Submission could not be reviewed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment) {
    return <div className="proof-loading"><LoaderCircle className="spin" /> {error || "Loading your challenge..."}</div>;
  }

  return (
    <div className="challenge-page">
      <header className="challenge-topbar">
        <Link to="/skillproof"><Code2 size={18} /> SkillProof</Link>
        <div className="proof-steps"><span className="active">1 <small>Challenge</small></span><i /><span>2 <small>Viva</small></span><i /><span>3 <small>Passport</small></span></div>
        <span><Clock3 size={16} /> {assessment.challenge.estimated_minutes} min target</span>
      </header>

      <main className="challenge-layout">
        <aside className="challenge-brief">
          <span className="page-kicker">Python · API boundary</span>
          <h1>{assessment.challenge.title}</h1>
          <p>{assessment.challenge.summary}</p>
          <h2>Acceptance criteria</h2>
          <ol>{assessment.challenge.instructions.map((instruction) => <li key={instruction}><Check size={15} />{instruction}</li>)}</ol>
          <div className="challenge-safety"><ShieldCheck size={19} /><span><strong>Browser-isolated runner</strong><small>Imports and dynamic execution are blocked. The API receives only your code and test evidence.</small></span></div>
        </aside>

        <section className="code-workspace">
          <div className="code-toolbar"><span><i /> solution.py</span><small>{code.split("\n").length} lines</small></div>
          <textarea className="code-editor" value={code} onChange={(event) => { setCode(event.target.value); setTestResults([]); setReview(null); }} spellCheck={false} aria-label="Python solution" />
          <div className="test-console">
            <div className="test-console-head"><strong>Behavior tests</strong><button type="button" onClick={runTests} disabled={running || submitting}>{running ? <LoaderCircle size={16} className="spin" /> : <Play size={16} fill="currentColor" />} {running ? "Loading isolated Python..." : "Run tests"}</button></div>
            {testResults.length === 0 ? <p className="console-empty">Run the tests when you are ready. The first run downloads the isolated Python runtime.</p> : (
              <div className="test-list">{assessment.challenge.tests.map((test) => {
                const result = testResults.find((item) => item.id === test.id);
                return <div key={test.id} className={result?.passed ? "passed" : "failed"}>{result?.passed ? <CheckCircle2 size={16} /> : <X size={16} />}<span><strong>{test.label}</strong><small>{result?.detail}</small></span></div>;
              })}</div>
            )}
          </div>
          {error && <p className="challenge-error"><AlertTriangle size={16} /> {error}</p>}
          <footer className="challenge-actions"><span>{testResults.filter((item) => item.passed).length}/{assessment.challenge.tests.length} tests passing</span><button className="button button-primary" onClick={submit} disabled={running || submitting}>{submitting ? "Reviewing evidence..." : "Submit for review"}<ArrowRight size={17} /></button></footer>
        </section>
      </main>

      {review && <div className="review-overlay"><div className="review-modal"><span className="review-check"><CheckCircle2 size={27} /></span><small>Code evidence captured</small><h2>{review.passed_tests}/{review.total_tests} tests passed</h2><div className="review-scores"><span><strong>{Math.round(review.test_score)}%</strong>Behavior tests</span><span><strong>{Math.round(review.code_score)}%</strong>Static review</span></div><ul>{review.feedback.map((item) => <li key={item}>{item}</li>)}</ul><button className="button button-primary" onClick={() => navigate(`/skillproof/${id}/viva`)}>Continue to technical viva <ArrowRight size={17} /></button></div></div>}
    </div>
  );
}
