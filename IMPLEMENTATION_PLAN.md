# Implementation plan

The starter is intentionally usable without an AI key: its deterministic coach makes the complete interview flow testable today. Build the production product in the following order.

## Phase 1 — Foundation (included)

- Secure email/password registration and login
- Protected dashboard and persisted interview history
- Role and difficulty selection
- Five-question practice sessions with feedback and results
- Local and production database configuration
- Deployment, migration, health-check, lint, build, and test setup

## Phase 2 — Real AI evaluation

1. Add an `AI_PROVIDER` setting and provider credentials only on the backend.
2. Implement a provider in `backend/app/services/evaluator.py` that returns a strict typed result: score, strengths, improvement, and suggested answer.
3. Keep the existing deterministic evaluator as the timeout/error fallback.
4. Add per-user and per-IP rate limits before exposing paid model calls.
5. Store prompt version, model name, latency, and token use with every evaluation.
6. Add prompt-injection tests and never place secrets or unrelated user data in prompts.

## Phase 3 — Interview experience

- Add microphone recording only after a clear permission action.
- Transcribe audio on the backend and let users edit the transcript before scoring.
- Add code-interview mode with a sandboxed execution service; never execute code in the API process.
- Generate follow-up questions from the current answer and job description.
- Add resume/job-description upload with file type, size, malware, and retention controls.

## Phase 4 — Product hardening

- Replace access-only JWTs with rotating refresh sessions stored and revocable in the database.
- Add email verification, password reset, account deletion, and optional OAuth.
- Put frontend and API behind the same parent domain; enforce Secure cookies and strict CORS.
- Add Redis-backed rate limiting, structured logs, error monitoring, and audit events.
- Add a privacy policy, retention rules, export/delete controls, and consent text for recordings.
- Run dependency, secret, SAST, and container scans in CI.

## Phase 5 — Measurement and growth

- Track completion rate, repeated practice, role popularity, and score improvement without storing raw answer text in analytics.
- Add a focused progress view showing skill trends rather than vanity metrics.
- Introduce plan limits only after usage and model cost are observable.

## Recommended production topology

```text
Browser -> app.example.com (Vercel/CDN)
                 |
                 +-> /api/* -> API service (Render)
                                      |
                                      +-> Managed PostgreSQL
                                      +-> Redis rate limiter
                                      +-> AI provider
```

Using one public origin avoids third-party-cookie problems and makes security headers and CORS easier to reason about.

## Definition of done for the next milestone

- AI evaluation is typed, timed out, retried conservatively, and has a deterministic fallback.
- No AI or database secret appears in browser code or build output.
- A user can verify email, reset a password, revoke sessions, and delete their account.
- Automated tests cover auth failure paths, ownership checks, interview completion, and provider failure.
- Staging and production use separate databases and secrets.

