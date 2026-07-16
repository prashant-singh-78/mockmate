import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const isLogin = mode === "login";
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      const destination = (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Practice with purpose</span>
          <blockquote>“The best answers don’t sound memorized. They sound clear.”</blockquote>
          <ul>
            <li><Check size={17} /> Role-specific question sets</li>
            <li><Check size={17} /> Feedback after every answer</li>
            <li><Check size={17} /> Progress you can return to</li>
          </ul>
        </div>
        <p>Your practice answers stay connected to your account.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="back-link"><ArrowLeft size={17} /> Back to home</Link>
          <div className="auth-heading">
            <span className="mobile-brand"><Brand /></span>
            <h1>{isLogin ? "Welcome back" : "Start practicing"}</h1>
            <p>{isLogin ? "Your next stronger answer is waiting." : "Create your free account in under a minute."}</p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {!isLogin && (
              <label>Full name
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Prashant Singh" minLength={2} required />
              </label>
            )}
            <label>Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label>Password
              <span className="password-field">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 8 characters" minLength={8} required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={submitting}>
              {submitting ? "Please wait…" : isLogin ? "Log in" : "Create account"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="auth-switch">
            {isLogin ? "New to Mockmate?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

