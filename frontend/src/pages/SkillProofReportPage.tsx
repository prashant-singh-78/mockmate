import { ArrowLeft, BadgeCheck, CheckCircle2, Copy, ExternalLink, LoaderCircle, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { ApiError, api } from "../lib/api";
import type { PublicSkillPassport, SkillAssessment } from "../types";

type ReportData = PublicSkillPassport & {
  share_token?: string;
  test_score?: number | null;
  code_score?: number | null;
  viva_score?: number | null;
  problem_solving_score?: number | null;
  evaluation_provider?: string;
};

export function SkillProofReportPage({ publicView = false }: { publicView?: boolean }) {
  const params = useParams();
  const identifier = publicView ? params.token : params.id;
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!identifier) return;
    const path = publicView ? `/skillproof/public/${identifier}` : `/skillproof/assessments/${identifier}`;
    api<PublicSkillPassport | SkillAssessment>(path)
      .then((data) => {
        if ("status" in data && data.status !== "completed") throw new Error("Complete the viva to unlock your Skill Passport.");
        setReport(data as ReportData);
      })
      .catch((caught) => setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Passport could not be loaded"));
  }, [identifier, publicView]);

  const share = async () => {
    if (!report?.share_token) return;
    const url = `${window.location.origin}/skillproof/share/${report.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!report) return <div className="proof-loading"><LoaderCircle className="spin" /> {error || "Building your Skill Passport..."}</div>;

  return (
    <div className={`passport-page ${publicView ? "public" : ""}`}>
      {publicView && <header className="passport-public-header"><Brand to="/" /><span>Verified practice evidence by Mockmate</span></header>}
      <main className="passport-sheet">
        <header className="passport-hero">
          <span className="passport-seal"><BadgeCheck size={31} /></span>
          <span className="page-kicker">SkillProof Passport</span>
          <h1>{report.role}</h1>
          <p>Evidence collected from browser-isolated behavior tests, static code review, and a technical viva.</p>
          <div className="passport-score"><strong>{Math.round(report.overall_score)}</strong><span>/100<small>Overall evidence score</small></span></div>
          <span className="passport-date"><ShieldCheck size={15} /> Completed {new Date(report.completed_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
        </header>

        {!publicView && <section className="passport-components"><article><span>Behavior tests</span><strong>{Math.round(report.test_score || 0)}%</strong><i style={{ width: `${report.test_score || 0}%` }} /></article><article><span>Code quality</span><strong>{Math.round(report.code_score || 0)}%</strong><i style={{ width: `${report.code_score || 0}%` }} /></article><article><span>Technical viva</span><strong>{Math.round(report.viva_score || 0)}%</strong><i style={{ width: `${report.viva_score || 0}%` }} /></article><article><span>Problem solving</span><strong>{Math.round(report.problem_solving_score || 0)}%</strong><i style={{ width: `${report.problem_solving_score || 0}%` }} /></article></section>}

        <section className="passport-section">
          <div><span className="page-kicker">Verified capabilities</span><h2>Skill evidence</h2></div>
          <div className="skill-score-grid">{report.skill_scores.map((skill) => <article key={skill.name}><div className="skill-ring" style={{ "--skill-score": `${skill.score * 3.6}deg` } as CSSProperties}><span>{Math.round(skill.score)}</span></div><div><strong>{skill.name}</strong><small className={skill.status.toLowerCase()}>{skill.status}</small></div></article>)}</div>
        </section>

        <section className="passport-detail-grid">
          <article><span className="detail-icon good"><CheckCircle2 size={19} /></span><div><small>Evidence captured</small><h2>What this assessment demonstrates</h2><ul>{report.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div></article>
          <article><span className="detail-icon next"><Sparkles size={19} /></span><div><small>Next growth loop</small><h2>How to strengthen the passport</h2><ul>{report.improvements.length ? report.improvements.map((item) => <li key={item}>{item}</li>) : <li>Retake with a harder challenge and explain more production trade-offs.</li>}</ul></div></article>
        </section>

        <footer className="passport-actions">
          {publicView ? <Link to="/register" className="button button-primary">Create your own Skill Passport <ExternalLink size={17} /></Link> : <><Link to="/skillproof" className="button button-secondary"><ArrowLeft size={17} /> Assessment history</Link><button className="button button-primary" onClick={share}>{copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}{copied ? "Public link copied" : "Copy share link"}</button><Link to="/skillproof" className="passport-retake"><RotateCcw size={15} /> Retake</Link></>}
        </footer>
        <p className="passport-disclaimer">SkillProof reports practice evidence from one controlled assessment. They are not identity verification, employment certification, or a prediction of job performance.</p>
      </main>
    </div>
  );
}
