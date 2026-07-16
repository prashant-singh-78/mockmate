import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Code2, Database, PackageOpen } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { InterviewSession } from "../types";

const roles = [
  { name: "Software Engineer", detail: "Technical depth, systems, and problem solving", icon: Code2 },
  { name: "Data Scientist", detail: "Modeling, experimentation, and business impact", icon: Database },
  { name: "Product Manager", detail: "Product sense, metrics, and collaboration", icon: PackageOpen },
];

const levels = [
  { value: "entry", label: "Entry level", detail: "Student · Intern · 0–2 years" },
  { value: "mid", label: "Mid level", detail: "2–5 years of experience" },
  { value: "senior", label: "Senior level", detail: "5+ years · Lead scope" },
] as const;

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState<"entry" | "mid" | "senior">("entry");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const session = await api<InterviewSession>("/interviews", {
        method: "POST",
        body: JSON.stringify({ role, level }),
      });
      navigate(`/interview/${session.id}`);
    } catch {
      setError("Could not start the interview. Please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="setup-page page-pad">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={17} /> Back to dashboard</Link>
      <header className="setup-heading"><span className="page-kicker">New practice session</span><h1>What are you preparing for?</h1><p>We’ll use your choices to set the question depth and coaching standard.</p></header>

      <section className="setup-block">
        <div className="setup-label"><span>1</span><div><h2>Choose a role</h2><p>Five questions · About 15 minutes</p></div></div>
        <div className="role-options">
          {roles.map(({ name, detail, icon: Icon }) => (
            <button key={name} className={role === name ? "selected" : ""} onClick={() => setRole(name)}>
              <span className="option-icon"><Icon size={22} /></span>
              <span><strong>{name}</strong><small>{detail}</small></span>
              <i>{role === name && <Check size={16} />}</i>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-block">
        <div className="setup-label"><span>2</span><div><h2>Set the difficulty</h2><p>Feedback adapts to expected experience</p></div></div>
        <div className="level-options">
          {levels.map((item) => (
            <button key={item.value} className={level === item.value ? "selected" : ""} onClick={() => setLevel(item.value)}>
              <span className="radio-dot" />
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            </button>
          ))}
        </div>
      </section>

      <div className="setup-footer">
        <div><BriefcaseBusiness size={19} /><span><strong>{role}</strong><small>{levels.find((item) => item.value === level)?.label} · 5 questions</small></span></div>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" onClick={start} disabled={starting}>{starting ? "Preparing room…" : "Enter interview room"}<ArrowRight size={18} /></button>
      </div>
    </div>
  );
}

