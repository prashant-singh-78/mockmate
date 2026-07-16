import { ArrowRight, BrainCircuit, Check, MessageSquareText, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header container">
        <Brand />
        <nav aria-label="Landing navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/login">Log in</Link>
          <Link to="/register" className="button button-small">Practice free <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> Your calmest interview starts here</span>
            <h1>Stop rehearsing.<br /><em>Start improving.</em></h1>
            <p>Practice real role-specific questions, get useful feedback after every answer, and walk into your next interview knowing exactly what to say.</p>
            <div className="hero-actions">
              <Link to="/register" className="button button-primary">Start a mock interview <ArrowRight size={18} /></Link>
              <span className="microcopy"><Check size={15} /> Free to practice · No card required</span>
            </div>
          </div>

          <div className="coach-demo" aria-label="Example interview feedback">
            <div className="demo-topbar">
              <span><i className="live-dot" /> Interview in progress</span>
              <span>02:14</span>
            </div>
            <div className="coach-question">
              <span className="question-count">Question 2 of 5</span>
              <h2>Tell me about a production bug you diagnosed and fixed.</h2>
            </div>
            <div className="voice-strip">
              <span className="demo-avatar">PS</span>
              <div className="waveform" aria-hidden="true">
                {[18, 30, 21, 42, 35, 56, 28, 47, 24, 39, 19, 31, 16, 26].map((height, index) => (
                  <i key={index} style={{ height }} />
                ))}
              </div>
              <span className="record-time">0:48</span>
            </div>
            <div className="feedback-card">
              <div className="score-ring"><strong>8.4</strong><span>/ 10</span></div>
              <div>
                <span className="feedback-label"><Sparkles size={14} /> Coach feedback</span>
                <p>Strong structure. Make the result sharper by quantifying the impact of your fix.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container">
            <span>Practice for roles in</span>
            <strong>Software engineering</strong><i />
            <strong>Data science</strong><i />
            <strong>Product management</strong>
          </div>
        </section>

        <section className="how container" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">Built for deliberate practice</span>
            <h2>One focused loop.<br />Noticeable improvement.</h2>
            <p>Each session gives you a clear next step—not a wall of generic advice.</p>
          </div>
          <div className="steps">
            <article>
              <span className="step-icon"><Target size={23} /></span><small>01</small>
              <h3>Choose your target</h3>
              <p>Pick the role and experience level that matches the interview ahead.</p>
            </article>
            <article>
              <span className="step-icon"><MessageSquareText size={23} /></span><small>02</small>
              <h3>Answer naturally</h3>
              <p>Work through five thoughtful questions in a calm, distraction-free room.</p>
            </article>
            <article>
              <span className="step-icon"><BrainCircuit size={23} /></span><small>03</small>
              <h3>Improve with evidence</h3>
              <p>See your score, strongest moments, missing details, and a better structure.</p>
            </article>
          </div>
        </section>

        <section className="final-cta container">
          <span className="eyebrow"><Sparkles size={15} /> Your next interview can feel different</span>
          <h2>Build confidence one answer at a time.</h2>
          <Link to="/register" className="button button-light">Start practicing free <ArrowRight size={18} /></Link>
        </section>
      </main>

      <footer className="site-footer container">
        <Brand />
        <p>Focused practice for ambitious candidates.</p>
        <span>© 2026 Mockmate</span>
      </footer>
    </div>
  );
}

