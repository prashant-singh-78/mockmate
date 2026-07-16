import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileSearch,
  FileText,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { ResumeAnalysis } from "../types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt"];
const roles = ["Software Engineer", "Data Scientist", "Product Manager"];

export function ResumeAnalyzerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState(roles[0]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase() || "";
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Upload a PDF, DOCX, or TXT resume.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Resume must be 5 MB or smaller.");
      return;
    }
    setFile(selected);
    setAnalysis(null);
    setError("");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("target_role", targetRole);

    try {
      const result = await api<ResumeAnalysis>("/resumes/analyze", {
        method: "POST",
        body: form,
      });
      setAnalysis(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not analyze the resume");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="resume-page page-pad">
      <header className="resume-header">
        <div>
          <span className="page-kicker">Resume intelligence</span>
          <h1>Make your resume interview-ready.</h1>
          <p>Upload your resume to check its structure, contact details, role-specific skills, measurable impact, and ATS readiness.</p>
        </div>
        <span className="privacy-chip"><ShieldCheck size={17} /> Analyzed in memory · Not stored</span>
      </header>

      {!analysis ? (
        <div className="resume-workspace">
          <section className="resume-upload-card">
            <div className="resume-step"><span>1</span><div><h2>Upload your resume</h2><p>Use the latest version you send to recruiters.</p></div></div>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleInput} hidden />
            <div
              className={`resume-dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <span className="resume-file-icon"><FileText size={28} /></span>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024).toFixed(0)} KB · Ready to analyze</small>
                  <button type="button" onClick={reset}><X size={16} /> Remove</button>
                </>
              ) : (
                <>
                  <span className="upload-icon"><UploadCloud size={30} /></span>
                  <strong>Drop your resume here</strong>
                  <p>or <button type="button" onClick={() => inputRef.current?.click()}>browse your files</button></p>
                  <small>PDF, DOCX or TXT · Maximum 5 MB</small>
                </>
              )}
            </div>
          </section>

          <section className="resume-role-card">
            <div className="resume-step"><span>2</span><div><h2>Choose the target role</h2><p>Skill matching changes for each role.</p></div></div>
            <div className="resume-role-options">
              {roles.map((role) => (
                <button key={role} className={targetRole === role ? "selected" : ""} onClick={() => setTargetRole(role)}>
                  <span className="radio-dot" /><span>{role}</span>{targetRole === role && <Check size={16} />}
                </button>
              ))}
            </div>
            <div className="resume-check-list">
              <span><CheckCircle2 size={16} /> Contact and profile links</span>
              <span><CheckCircle2 size={16} /> Resume sections and readability</span>
              <span><CheckCircle2 size={16} /> Skills for your target role</span>
              <span><CheckCircle2 size={16} /> Action verbs and measurable impact</span>
            </div>
          </section>

          {error && <p className="resume-error" role="alert"><AlertCircle size={17} /> {error}</p>}
          <button className="button button-primary resume-analyze-button" onClick={analyze} disabled={!file || analyzing}>
            {analyzing ? <><LoaderCircle className="spin" size={18} /> Analyzing resume…</> : <><FileSearch size={18} /> Check my resume</>}
          </button>
        </div>
      ) : (
        <ResumeResults analysis={analysis} onReset={reset} />
      )}
    </div>
  );
}

function ResumeResults({ analysis, onReset }: { analysis: ResumeAnalysis; onReset: () => void }) {
  const scoreTone = analysis.overall_score >= 80 ? "strong" : analysis.overall_score >= 60 ? "medium" : "weak";
  const labels: Record<string, string> = {
    contact: "Contact details",
    structure: "Structure",
    skills: "Role skills",
    impact: "Measurable impact",
    readability: "Readability",
  };
  const maximums: Record<string, number> = { contact: 15, structure: 30, skills: 20, impact: 20, readability: 15 };

  return (
    <div className="resume-results">
      <section className="resume-score-card">
        <div className={`resume-score resume-score-${scoreTone}`}><strong>{analysis.overall_score}</strong><span>/100</span></div>
        <div><span className="eyebrow"><Sparkles size={15} /> Analysis complete</span><h2>{analysis.verdict}</h2><p>{analysis.filename} · {analysis.target_role} · {analysis.word_count} words</p></div>
        <button className="button button-secondary" onClick={onReset}><RotateCcw size={16} /> Check another</button>
      </section>

      <div className="resume-result-grid">
        <section className="resume-result-panel">
          <span className="page-kicker">Score breakdown</span>
          <h2>What the checker found</h2>
          <div className="score-bars">
            {Object.entries(analysis.category_scores).map(([key, value]) => (
              <div key={key}><span><strong>{labels[key] || key}</strong><small>{value}/{maximums[key] || 100}</small></span><i><b style={{ width: `${(value / (maximums[key] || 100)) * 100}%` }} /></i></div>
            ))}
          </div>
          <div className="contact-checks">
            {Object.entries(analysis.contact_checks).map(([key, value]) => (
              <span className={value ? "found" : "missing"} key={key}>{value ? <Check size={14} /> : <X size={14} />}{key}</span>
            ))}
          </div>
        </section>

        <section className="resume-result-panel">
          <span className="page-kicker">Skill match</span>
          <h2>Detected skills</h2>
          {analysis.detected_skills.length ? <div className="skill-tags">{analysis.detected_skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p className="empty-copy">No matching role skills were detected.</p>}
          <div className="section-summary"><p><strong>Sections found</strong>{analysis.found_sections.join(", ") || "None"}</p><p><strong>Sections missing</strong>{analysis.missing_sections.join(", ") || "None"}</p></div>
        </section>
      </div>

      <div className="resume-feedback-grid">
        <section><span className="feedback-title success"><CheckCircle2 size={18} /> Strengths</span>{analysis.strengths.map((item) => <p key={item}>{item}</p>)}</section>
        <section><span className="feedback-title improve"><AlertCircle size={18} /> Improve next</span>{analysis.improvements.map((item) => <p key={item}>{item}</p>)}</section>
      </div>
    </div>
  );
}

