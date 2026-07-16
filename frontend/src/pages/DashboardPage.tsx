import { ArrowRight, BadgeCheck, BarChart3, CalendarDays, FileSearch, Play, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { InterviewSummary } from "../types";

export function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<InterviewSummary[]>("/interviews")
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  const completed = sessions.filter((session) => session.status === "completed");
  const average = completed.length
    ? (completed.reduce((sum, session) => sum + (session.overall_score || 0), 0) / completed.length).toFixed(1)
    : "—";
  const firstName = user?.name.split(" ")[0] || "there";
  const date = useMemo(
    () => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()),
    [],
  );

  return (
    <div className="dashboard page-pad">
      <header className="dashboard-header">
        <div><span className="page-kicker">{date}</span><h1>Ready to practice, {firstName}?</h1><p>One focused session is enough to make today’s answers sharper.</p></div>
        <Link to="/practice" className="button button-primary"><Play size={17} fill="currentColor" /> Start interview</Link>
      </header>

      <section className="focus-card">
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Recommended next step</span>
          <h2>{sessions.length ? "Build on your last session" : "Complete your first practice round"}</h2>
          <p>{sessions.length ? "Return for another five questions and turn your last feedback into a stronger answer." : "Choose a role, answer five realistic questions, and receive a clear improvement plan."}</p>
          <Link to="/practice">Choose a practice track <ArrowRight size={17} /></Link>
        </div>
        <div className="focus-visual">
          <span className="orbit orbit-one" /><span className="orbit orbit-two" />
          <span className="focus-score">{average}<small>{average === "—" ? "new" : "avg"}</small></span>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Practice statistics">
        <article><span><Target size={19} /></span><div><strong>{completed.length}</strong><small>Sessions completed</small></div></article>
        <article><span><BarChart3 size={19} /></span><div><strong>{average}</strong><small>Average score</small></div></article>
        <article><span><CalendarDays size={19} /></span><div><strong>{sessions.length ? "Active" : "New"}</strong><small>Practice status</small></div></article>
      </section>

      <section className="recent-section">
        <div className="section-row"><div><span className="page-kicker">Your history</span><h2>Recent interviews</h2></div></div>
        {loading ? (
          <div className="list-skeleton"><span /><span /><span /></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state"><span><Target size={24} /></span><h3>No interviews yet</h3><p>Your completed practice sessions and feedback will appear here.</p><Link to="/practice">Start your first session <ArrowRight size={16} /></Link></div>
        ) : (
          <div className="session-list">
            {sessions.slice(0, 6).map((session) => (
              <Link to={`/interview/${session.id}`} key={session.id} className="session-row">
                <span className="role-initial">{session.role.charAt(0)}</span>
                <span><strong>{session.role}</strong><small>{new Date(session.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {session.level} level</small></span>
                <span className={`status status-${session.status}`}>{session.status}</span>
                <strong className="row-score">{session.overall_score ? `${session.overall_score}/10` : `${session.current_index}/${session.total_questions}`}</strong>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="dashboard-promos">
        <Link to="/skillproof" className="resume-promo skillproof-promo">
          <span><BadgeCheck size={24} /></span>
          <div><small>New · Build Week project</small><h2>Prove your Python skills</h2><p>Complete a practical challenge, defend your decisions, and earn a shareable evidence passport.</p></div>
          <strong>Start SkillProof <ArrowRight size={17} /></strong>
        </Link>
        <Link to="/resume" className="resume-promo">
          <span><FileSearch size={24} /></span>
          <div><small>Before your next application</small><h2>Check your resume readiness</h2><p>Find missing sections, role-specific skill gaps, and weak achievement bullets.</p></div>
          <strong>Analyze resume <ArrowRight size={17} /></strong>
        </Link>
      </div>
    </div>
  );
}
