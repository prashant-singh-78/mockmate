import { ArrowRight, BadgeCheck, BriefcaseBusiness, Clock3, Code2, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../lib/api";
import type { SkillAssessment, SkillAssessmentSummary } from "../types";

const DEFAULT_SKILLS = "Python, FastAPI, REST API, SQL, Testing";

function assessmentPath(item: SkillAssessmentSummary) {
  if (item.status === "completed") return `/skillproof/${item.id}/report`;
  if (item.status === "viva") return `/skillproof/${item.id}/viva`;
  return `/skillproof/${item.id}/challenge`;
}

export function SkillProofPage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<"entry" | "mid">("entry");
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [jobDescription, setJobDescription] = useState("");
  const [history, setHistory] = useState<SkillAssessmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SkillAssessmentSummary[]>("/skillproof/assessments").then(setHistory).catch(() => undefined);
  }, []);

  const start = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const assessment = await api<SkillAssessment>("/skillproof/assessments", {
        method: "POST",
        body: JSON.stringify({
          role: "Python Backend Developer",
          level,
          job_description: jobDescription,
          resume_skills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        }),
      });
      navigate(`/skillproof/${assessment.id}/challenge`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create the assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skillproof-page page-pad">
      <header className="skillproof-hero">
        <div>
          <span className="page-kicker"><BadgeCheck size={14} /> SkillProof by Mockmate</span>
          <h1>Turn resume claims into <em>reviewable evidence.</em></h1>
          <p>Complete one focused coding task, defend your decisions, and leave with a shareable Skill Passport.</p>
        </div>
        <div className="proof-formula" aria-label="Assessment weights">
          <span><strong>40%</strong> Tests</span>
          <span><strong>20%</strong> Code</span>
          <span><strong>25%</strong> Viva</span>
          <span><strong>15%</strong> Reasoning</span>
        </div>
      </header>

      <section className="proof-value-grid">
        <article><Code2 size={20} /><strong>Real task</strong><p>Work inside a controlled Python challenge instead of answering trivia.</p></article>
        <article><ShieldCheck size={20} /><strong>Safe execution</strong><p>Behavior tests run in an isolated browser worker, never on the API server.</p></article>
        <article><Sparkles size={20} /><strong>Evidence first</strong><p>Every score points back to tests, code structure, or your explanation.</p></article>
      </section>

      <form className="proof-setup-card" onSubmit={start}>
        <div className="proof-setup-heading">
          <span><BriefcaseBusiness size={19} /></span>
          <div><small>Assessment setup</small><h2>Python Backend Developer</h2></div>
          <i><Clock3 size={15} /> ~15 minutes</i>
        </div>

        <div className="proof-field-row">
          <label>
            Experience level
            <span className="segmented-control">
              <button type="button" className={level === "entry" ? "active" : ""} onClick={() => setLevel("entry")}>Entry</button>
              <button type="button" className={level === "mid" ? "active" : ""} onClick={() => setLevel("mid")}>Mid-level</button>
            </span>
          </label>
          <label>
            Skills from your resume
            <input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Python, FastAPI, SQL" />
            <small>Separate skills with commas.</small>
          </label>
        </div>

        <label>
          Target job description <span>Optional</span>
          <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the role requirements to make your evidence more relevant..." maxLength={6000} />
        </label>

        {error && <p className="form-error">{error}</p>}
        <div className="proof-setup-footer">
          <p><ShieldCheck size={16} /> This is practice evidence, not an employment certification.</p>
          <button className="button button-primary" disabled={loading}>{loading ? "Preparing challenge..." : "Start skill verification"}<ArrowRight size={17} /></button>
        </div>
      </form>

      <section className="proof-history">
        <div><span className="page-kicker">Your evidence</span><h2>Assessment history</h2></div>
        {history.length === 0 ? (
          <div className="proof-empty"><BadgeCheck size={23} /><p>Your first Skill Passport will appear here.</p></div>
        ) : (
          <div className="proof-history-list">
            {history.map((item) => (
              <Link key={item.id} to={assessmentPath(item)}>
                <span className="proof-history-icon"><Code2 size={18} /></span>
                <span><strong>{item.role}</strong><small>{new Date(item.created_at).toLocaleDateString()} · {item.level}</small></span>
                <span className={`proof-status ${item.status}`}>{item.status}</span>
                <strong>{item.overall_score == null ? "—" : `${Math.round(item.overall_score)}%`}</strong>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
