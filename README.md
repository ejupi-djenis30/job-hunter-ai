<div align="center">
  <h1>🎯 Job Hunter AI</h1>
  <p><strong>AI-powered Swiss job search platform</strong></p>
  <p>Automated scraping · LLM-driven analysis · Smart scheduling</p>

  <br/>
  
  ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
  ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-yellow)
</div>

---

## Overview

Job Hunter AI is a full-stack application that automates the Swiss job search process. It scrapes listings from [job-room.ch](https://www.job-room.ch) (Switzerland's federal job portal), analyzes them with LLMs to compute affinity scores, and schedules recurring searches — so you spend less time browsing and more time applying.

### Key Features

- **🔍 Intelligent Scraping** — Custom-built scraper engine with CSRF bypass, browser fingerprint simulation, and stealth mode
- **🤖 LLM-Powered Analysis** — Upload your CV and get AI-generated affinity scores and fit analysis for each job
- **⏰ Scheduled Searches** — Set up recurring search profiles that run automatically on your schedule
- **📊 Dashboard** — React-based UI to manage searches, review results, and track applications
- **🔐 Authentication** — JWT-based auth with PBKDF2-SHA256 password hashing
- **🐘 Dual Database** — SQLite for local dev, PostgreSQL for production — auto-detected from `DATABASE_URL`
- **🐳 Docker Ready** — Optional `docker-compose` deployment with PostgreSQL

---

## Architecture

```
job-hunter-ai/
├── backend/                    # FastAPI application
│   ├── main.py                 # App setup, middleware, router includes
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic v2 request/response schemas
│   ├── database.py             # DB config (SQLite / PostgreSQL auto-detect)
│   ├── routes/                 # API route modules
│   │   ├── auth.py             # /auth — register, login
│   │   ├── jobs.py             # /jobs — CRUD operations
│   │   ├── search.py           # Search workflow, CV upload, status
│   │   └── profiles.py        # Profile management, scheduling
│   ├── services/               # Business logic layer
│   │   ├── auth.py             # JWT + password hashing
│   │   ├── llm.py              # LLM integration (OpenAI-compatible)
│   │   ├── scraper.py          # Search orchestration
│   │   ├── reference.py        # Occupation code resolution
│   │   ├── scheduler.py        # APScheduler background jobs
│   │   ├── search_status.py    # Real-time search progress tracking
│   │   └── utils.py            # File processing (PDF, TXT)
│   └── scraper/                # Embedded scraper engine
│       ├── core/               # Models, session mgmt, exceptions
│       └── providers/          # Job portal implementations
│           └── job_room/       # job-room.ch provider
├── frontend/                   # React + Vite application
├── alembic/                    # Database migrations
├── tests/                      # Comprehensive test suite (63 tests)
│   ├── unit/                   # Model, auth, scraper tests
│   ├── integration/            # API endpoint tests
│   └── e2e/                    # Live scraper tests
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # App + PostgreSQL deployment
├── requirements.txt            # Python dependencies
└── .env.example                # Environment variable template
```

### Scraper Engine

The embedded scraper engine (originally a standalone library) provides:

| Feature | Description |
|---------|-------------|
| **Anti-Detection** | HTTP/2, browser fingerprinting, realistic headers |
| **CSRF Handling** | Automatic Angular XSRF token management |
| **Execution Modes** | FAST (speed) · STEALTH (evasion) · AGGRESSIVE (retry) |
| **BFS Mapper** | Swiss municipality → BFS code resolution (150+ cities) |
| **Provider Pattern** | Extensible `BaseJobProvider` for adding new sources |

---

## Getting Started

### Option 1: Local Development

#### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (for the frontend)

```bash
# Clone the repository
git clone https://github.com/JobGipfel/job-hunter-ai.git
cd job-hunter-ai

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and settings

# Start the backend
python run.py
```

```bash
# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8000`.

### Option 2: Docker Deployment

```bash
# Clone and configure
git clone https://github.com/JobGipfel/job-hunter-ai.git
cd job-hunter-ai
cp .env.example .env
# Edit .env with your API keys

# Start with PostgreSQL
docker-compose up -d

# Or start app only (SQLite mode)
docker-compose up -d app
```

### Database Migrations (Alembic)

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | ✅ |
| `LLM_PROVIDER` | LLM backend (`groq` or `deepseek`) | ✅ |
| `GROQ_API_KEY` / `DEEPSEEK_API_KEY` | API key for the chosen provider | ✅ |
| `DATABASE_URL` | `sqlite:///./job_hunter.db` or `postgresql://...` | Optional |
| `CORS_ORIGINS` | Comma-separated allowed origins | Optional |
| `API_HOST` / `API_PORT` | Server bind address (default: `127.0.0.1:8000`) | Optional |
| `LOG_LEVEL` | Logging level (default: `INFO`) | Optional |

See [`.env.example`](.env.example) for the full list with LLM configuration options.

---

## Testing

```bash
# Run all tests (excluding live tests)
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=backend --cov-report=term-missing

# Run live tests (hits real APIs)
python -m pytest tests/ --run-live -v
```

**Test Coverage (63 tests):**

- 📦 **Scraper Models** — Request validation, listing creation, response pagination
- 🗺️ **BFS Mapper** — City/postal code resolution, partial matching, error handling
- 🔐 **Authentication** — Password hashing, JWT creation/verification
- 🗄️ **Database** — ORM model creation, constraints, defaults
- 📡 **API Integration** — Auth flow, protected endpoints, CRUD operations
- 🌐 **E2E Live** — Real scraper searches against job-room.ch (gated by `--run-live`)

---

## How It Works

1. **Create a Profile** — Define your search criteria (role, location, workload, CV)
2. **Generate Keywords** — The LLM analyzes your profile to create optimized, multilingual search queries
3. **Scrape Jobs** — The engine searches job-room.ch with each generated query
4. **Analyze Results** — Each job is scored by the LLM for relevance to your profile
5. **Review & Apply** — Browse ranked results in the dashboard and track applications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy, Alembic, APScheduler |
| **Frontend** | React 18, Vite, Bootstrap |
| **Scraping** | httpx (HTTP/2), tenacity |
| **AI/LLM** | OpenAI-compatible (Groq, DeepSeek) |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Auth** | JWT (PyJWT), PBKDF2-SHA256 |
| **Deploy** | Docker, gunicorn + uvicorn |
| **Testing** | pytest, pytest-asyncio |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
