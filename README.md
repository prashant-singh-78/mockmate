# Mockmate AI Interview Coach

A deployment-ready AI career coaching product. It includes interview practice, resume analysis, and SkillProof: a practical coding assessment that turns resume claims into reviewable evidence and a shareable Skill Passport.

## What is included

- Landing page, registration, login, protected dashboard, practice setup, live interview, and results
- SkillProof setup, browser-isolated Python challenge, behavior tests, technical viva, history, and shareable evidence passport
- Optional OpenAI Responses API evaluation with a deterministic fallback when no API key is configured
- Argon2 password hashing and short-lived JWTs stored in HTTP-only cookies
- SQLite for local development and PostgreSQL-ready SQLAlchemy models for production
- Alembic database migration, typed API schemas, health check, and backend tests
- Vercel SPA configuration, Render blueprint, Dockerfiles, and local Docker Compose
- A provider boundary where an LLM-based evaluator can replace the built-in deterministic coach

## SkillProof flow

```text
Resume skills + target role
        ↓
Curated Python API challenge
        ↓
Browser-isolated behavior tests (Pyodide Web Worker)
        ↓
Server-side static code review
        ↓
Three-question voice/text technical viva
        ↓
Evidence-weighted Skill Passport + public share link
```

Assessment weights are behavior tests 40%, code quality 20%, technical viva 25%, and problem solving 15%. User code is not executed by the FastAPI server. The browser worker blocks imports and dynamic execution, and the backend independently performs an AST-based static safety review.

## Project structure

```text
ai-interview-coach/
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Shared UI and route guards
│   │   ├── context/           # Authentication state
│   │   ├── lib/               # API client and utilities
│   │   ├── pages/             # Product routes
│   │   └── types/             # Shared frontend types
│   ├── Dockerfile
│   └── vercel.json
├── backend/                   # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/        # HTTP endpoints
│   │   ├── core/              # Settings and security
│   │   ├── db/                # Database lifecycle
│   │   ├── models/            # Persistent entities
│   │   ├── schemas/           # Request/response contracts
│   │   └── services/          # Interview question and scoring logic
│   ├── migrations/            # Alembic migrations
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── IMPLEMENTATION_PLAN.md
```

## Run locally

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite development proxy forwards `/api` to the backend.

Open `http://localhost:5173/skillproof` after signing in to run the SkillProof flow.

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:5173`. PostgreSQL data is kept in a named Docker volume.

## Deploy

### Render backend

1. Push this repository to GitHub.
2. In Render, create a Blueprint from `render.yaml`.
3. Set `FRONTEND_URL` to the final Vercel domain after the frontend deploys.
4. Render creates the PostgreSQL database, runs migrations, and starts the API.

### Vercel frontend

1. Import the repository and set the Root Directory to `frontend`.
2. Set `VITE_API_URL` to the Render service URL, for example `https://mockmate-api.onrender.com`.
3. Deploy, then update `FRONTEND_URL` on Render.

For the strongest cookie behavior, proxy `/api` through the frontend domain or place both services behind one custom domain. See `IMPLEMENTATION_PLAN.md`.

## Environment variables

Never commit `.env` files. Generate a strong backend secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

For AI-evaluated viva feedback, set these backend variables:

```bash
OPENAI_API_KEY=your-server-side-key
OPENAI_MODEL=gpt-5.6-luna
```

Never expose `OPENAI_API_KEY` through a `VITE_` variable or commit it to Git. Without a key, SkillProof uses its tested deterministic evaluator, so local development and the demo flow still work.

## SkillProof limitations

- A Skill Passport is practice evidence from one controlled task, not identity verification or an employment certification.
- Voice dictation uses the browser speech-recognition capability when available; typing is always supported.
- The Pyodide runtime is downloaded from jsDelivr on the first test run. A strict production CSP must allow that CDN or self-host the pinned runtime.

## Quality checks

```bash
cd frontend && npm run lint && npm run build
cd backend && ruff check . && pytest
```
