<div align="center">
  <h1>🎯 Job Hunter AI</h1>
  <p><strong>AI-powered Swiss job search platform</strong></p>
  <p>Automated scraping · LLM-driven analysis · Smart scheduling</p>

  <br/>
  
  ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
  ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
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

---

## Architecture

```
job-hunter-ai/
├── backend/                    # FastAPI application
│   ├── main.py                 # API routes & app lifecycle
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── database.py             # Database configuration
│   ├── services/               # Business logic layer
│   │   ├── auth.py             # JWT + password hashing
│   │   ├── llm.py              # LLM integration (OpenAI-compatible)
│   │   ├── scraper.py          # Search orchestration
│   │   ├── reference.py        # CV/profile management
│   │   ├── scheduler.py        # APScheduler background jobs
│   │   └── search_status.py    # Real-time search progress tracking
│   └── scraper/                # Embedded scraper engine
│       ├── core/               # Models, session mgmt, exceptions
│       └── providers/          # Job portal implementations
│           └── job_room/       # job-room.ch provider
├── frontend/                   # React + Vite application
├── tests/                      # Comprehensive test suite
│   ├── unit/                   # Model, auth, scraper tests
│   ├── integration/            # API endpoint tests
│   └── e2e/                    # Live scraper tests
├── pyproject.toml              # Python project configuration
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

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (for the frontend)

### Backend Setup

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

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8000`.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | ✅ |
| `LLM_PROVIDER` | LLM backend (`groq` or `deepseek`) | ✅ |
| `LLM_API_KEY` | API key for the LLM provider | ✅ |
| `DATABASE_URL` | SQLAlchemy database URL | Optional |
| `API_PORT` | Backend port (default: 8000) | Optional |

See [`.env.example`](.env.example) for the full list.

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

**Test Coverage:**

- 📦 **Scraper Models** — Request validation, listing creation, response pagination
- 🗺️ **BFS Mapper** — City/postal code resolution, partial matching, error handling
- 🔐 **Authentication** — Password hashing, JWT creation/verification
- 🗄️ **Database** — ORM model creation, constraints, defaults
- 📡 **API Integration** — Auth flow, protected endpoints, CRUD operations
- 🌐 **E2E Live** — Real scraper searches against job-room.ch (gated)

---

## How It Works

1. **Create a Profile** — Define your search criteria (role, location, workload, CV)
2. **Generate Keywords** — The LLM analyzes your profile to create optimized search queries
3. **Scrape Jobs** — The engine searches job-room.ch with each generated query
4. **Analyze Results** — Each job is scored by the LLM for relevance to your profile
5. **Review & Apply** — Browse ranked results in the dashboard and track applications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy, APScheduler |
| **Frontend** | React 18, Vite, Bootstrap |
| **Scraping** | httpx (HTTP/2), tenacity |
| **AI/LLM** | OpenAI-compatible (Groq, DeepSeek) |
| **Database** | SQLite |
| **Auth** | JWT (PyJWT), PBKDF2-SHA256 |
| **Testing** | pytest, pytest-asyncio |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
