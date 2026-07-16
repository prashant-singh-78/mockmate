import { ArrowRight, Check, LoaderCircle, Mic, MicOff, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../lib/api";
import type { SkillAssessment } from "../types";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function speechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
}

export function SkillProofVivaPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [assessment, setAssessment] = useState<SkillAssessment | null>(null);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<SkillAssessment>(`/skillproof/assessments/${id}`)
      .then((item) => {
        if (item.status === "completed") navigate(`/skillproof/${id}/report`, { replace: true });
        else if (item.status === "challenge") navigate(`/skillproof/${id}/challenge`, { replace: true });
        else setAssessment(item);
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Viva could not be loaded"));
    return () => recognition.current?.stop();
  }, [id, navigate]);

  const toggleVoice = () => {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      setError("Voice dictation is not available in this browser. You can type the answer instead.");
      return;
    }
    const instance = new Recognition();
    instance.lang = "en-IN";
    instance.interimResults = false;
    instance.continuous = true;
    instance.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setAnswers((current) => current.map((answer, index) => index === active ? `${answer} ${transcript}`.trim() : answer));
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => { setListening(false); setError("Voice dictation stopped. Continue by typing if needed."); };
    recognition.current = instance;
    instance.start();
    setListening(true);
    setError("");
  };

  const submit = async () => {
    if (!assessment || answers.some((answer) => answer.trim().length < 20)) {
      setError("Give a useful answer to all three questions before generating the passport.");
      return;
    }
    recognition.current?.stop();
    setSubmitting(true);
    setError("");
    try {
      await api<SkillAssessment>(`/skillproof/assessments/${id}/viva`, {
        method: "POST",
        body: JSON.stringify({
          answers: assessment.viva_questions.map((question, index) => ({ question, answer: answers[index] })),
        }),
      });
      navigate(`/skillproof/${id}/report`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The viva could not be evaluated");
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment) return <div className="proof-loading"><LoaderCircle className="spin" /> {error || "Preparing your viva..."}</div>;

  const question = assessment.viva_questions[active];
  return (
    <div className="viva-page">
      <header className="viva-header"><span><Sparkles size={18} /> SkillProof technical viva</span><div className="proof-steps"><span className="done"><Check size={13} /><small>Challenge</small></span><i /><span className="active">2 <small>Viva</small></span><i /><span>3 <small>Passport</small></span></div><small>Question {active + 1} of 3</small></header>
      <main className="viva-layout">
        <section className="viva-question-panel">
          <span className="page-kicker">Defend your decisions</span>
          <h1>{question}</h1>
          <p>Explain your reasoning as if you were reviewing this change with another engineer.</p>
          <div className="viva-privacy"><ShieldCheck size={18} /><span><strong>Content-only evaluation</strong><small>We score technical evidence—not accent, emotion, appearance, or personality.</small></span></div>
          <div className="viva-dots">{assessment.viva_questions.map((_, index) => <button key={index} className={`${index === active ? "active" : ""} ${answers[index].length >= 20 ? "answered" : ""}`} onClick={() => { recognition.current?.stop(); setListening(false); setActive(index); }}>{answers[index].length >= 20 ? <Check size={14} /> : index + 1}</button>)}</div>
        </section>
        <section className="viva-answer-panel">
          <div className="viva-answer-head"><div><small>Your explanation</small><h2>Speak naturally or type</h2></div><button type="button" className={listening ? "listening" : ""} onClick={toggleVoice}>{listening ? <MicOff size={18} /> : <Mic size={18} />}{listening ? "Stop dictation" : "Use voice"}</button></div>
          <textarea value={answers[active]} onChange={(event) => setAnswers((current) => current.map((answer, index) => index === active ? event.target.value : answer))} placeholder="Start with the decision you made, then explain the trade-off and how you would test it..." />
          <div className="viva-answer-meta"><span>{answers[active].trim().split(/\s+/).filter(Boolean).length} words</span><span>Tip: name one failure mode and one test.</span></div>
          {error && <p className="form-error">{error}</p>}
          <footer>{active > 0 && <button className="button button-secondary" onClick={() => setActive(active - 1)}>Previous</button>}{active < 2 ? <button className="button button-primary" onClick={() => setActive(active + 1)} disabled={answers[active].trim().length < 20}>Next question <ArrowRight size={17} /></button> : <button className="button button-primary" onClick={submit} disabled={submitting}>{submitting ? "Evaluating evidence..." : "Generate Skill Passport"}<ArrowRight size={17} /></button>}</footer>
        </section>
      </main>
    </div>
  );
}
