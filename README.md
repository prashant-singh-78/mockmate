# Mockmate AI Interview Coach

A deployment-ready starter for an AI interview coaching product. It includes a polished React frontend, a FastAPI API, secure cookie authentication, persistent interview sessions, a deterministic coaching fallback, and clear extension points for a real LLM.

## What is included

- Landing page, registration, login, protected dashboard, practice setup, live interview, and results
- Argon2 password hashing and short-lived JWTs stored in HTTP-only cookies
- SQLite for local development and PostgreSQL-ready SQLAlchemy models for production
- Alembic database migration, typed API schemas, health check, and backend tests
- Vercel SPA configuration, Render blueprint, Dockerfiles, and local Docker Compose
- A provider boundary where an LLM-based evaluator can replace the built-in deterministic coach

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

## Quality checks

```bash
cd frontend && npm run lint && npm run build
cd backend && ruff check . && pytest
```

