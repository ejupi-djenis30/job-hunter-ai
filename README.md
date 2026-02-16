# Job Hunter AI 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/vite-5.0+-646cff.svg)](https://vitejs.dev/)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

**Job Hunter AI** is an advanced, self-hosted job search assistant designed to automate the repetitive and tedious aspects of finding a new job. By leveraging the power of Large Language Models (LLMs) and automated web scraping, it acts as a personalized recruiter working 24/7 to find opportunities that match your specific profile.

Unlike standard job boards that rely on simple keyword matching, Job Hunter AI uses **semantic understanding** of your CV and career goals to identify relevant opportunities, even if the phrasing doesn't match exactly. It allows you to aggregate listings from multiple sources into a single, clean dashboard, score them based on fit, and track your application execution.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Architecture & Design](#-architecture--design)
    - [System Overview](#system-overview)
    - [Backend Layering](#backend-layering)
    - [Frontend Structure](#frontend-structure)
    - [Data Flow](#data-flow)
4. [Technology Stack](#-technology-stack)
5. [Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Database Setup](#database-setup)
6. [Configuration Guide](#-configuration-guide)
    - [Environment Variables](#environment-variables)
    - [LLM Provider Setup](#llm-provider-setup)
7. [Usage Guide](#-usage-guide)
    - [User Registration](#2-user-registration)
    - [Creating a Search Profile](#3-creating-a-search-profile)
    - [Running a Search](#4-running-a-search)
    - [Scheduling](#6-scheduling)
8. [API Documentation](#-api-documentation)
    - [Authentication](#authentication-endpoints)
    - [Jobs](#job-endpoints)
    - [Search](#search-endpoints)
    - [Profiles](#profile-endpoints)
9. [Database Schema](#-database-schema)
10. [Development Guide](#-development-guide)
    - [Running Tests](#running-tests)
    - [Adding New Providers](#adding-new-providers)
11. [Deployment](#-deployment)
12. [Troubleshooting](#-troubleshooting)
13. [Contributing](#-contributing)
14. [License](#-license)

---

## 🌟 Project Overview

Finding a job is a full-time job. You have to check multiple sites, filter through hundreds of irrelevant listings, and tailor your CV for every application. **Job Hunter AI** solves this by:

1. **Reading your CV**: It understands your skills, seniority, and preferences.
2. **Scraping the Web**: It connects to job boards (starting with Swiss market leader `job-room.ch`) to fetch raw listings.
3. **Applying AI Logic**: It uses LLMs to "read" every job description and score it against your profile.
4. **Automating the Hunt**: It can run on a schedule, alerting you only when high-quality matches are found.

This project is designed to be **self-hosted**, ensuring your data (CV, search preferences) stays private on your own machine.

---

## ✨ Key Features

### 🔍 AI-Powered Discovery

- **Smart Keyword Extraction**: Analyzes your uploaded CV (PDF/Text) to extract relevant technical skills, soft skills, and domain expertise.
- **Semantic Matching**: Uses LLMs to understand the *intent* of a job posting, not just keyword frequency.
- **Customizable Strategy**: You can instruct the AI (e.g., "Focus on startups," "Avoid heavy legacy java roles") to refine its filtering criteria.

### 🤖 Intelligent Analysis

- **Scoring Engine**: Every found job is scored from 0-100% based on your profile compatibility.
- **Summary Generation**: The AI generates a concise reason *why* a job is a good or bad fit (e.g., "Strong match for Python skills, but requires 5 years experience where you have 3").
- **Multi-Provider Support**: Seamlessly switch between different AI brains:
  - **Groq** (Llama 3, Mixtral) - Ultra-fast inference.
  - **DeepSeek** - Cost-effective coding specialist.
  - **Google Gemini** - High context window and reasoning capabilities.
  - **OpenAI** (GPT-4) - Industry standard for reasoning.

### 🇨🇭 Optimized for the Swiss Market

- **JobRoom Integration**: Built-in adapter for `job-room.ch` (RAV/Unemployment office database).
- **Language Support**: Capable of processing job descriptions in German, French, Italian, and English.
- **Location Filtering**: Precise radius-based filtering (e.g., "Within 50km of Zurich").

### 🌍 Location Intelligence

- **OpenStreetMap Integration**: Built-in address autocomplete for Swiss locations.
- **Geolocation**: One-click "Use My Location" to automatically infer coordinates and address.
- **Radius Filtering**: Precise distance-based filtering from your exact coordinates.

### ⚡ Automation & Workflow

- **Background Scheduling**: Set up cron-like schedules to run searches every X hours automatically.
- **Application Tracking**: Mark jobs as "Applied" to keep track of your progress.
- **Duplicate Detection**: Intelligent hashing prevents seeing the same job twice, even if reposted.

### 📊 Modern User Interface

- **Responsive Dashboard**: Built with React and Bootstrap for a clean, mobile-friendly experience.
- **Real-time Progress**: Watch the search agent work in real-time with live log streaming.
- **Dark Mode**: Easy on the eyes for late-night job hunting sessions.

---

## 🏗 Architecture & Design

Job Hunter AI follows a **Clean Architecture** approach (also known as Onion or Hexagonal Architecture principles) to ensure maintainability, testability, and independence from external frameworks.

### System Overview

```mermaid
graph TD
    User[User] -->|Browser| Frontend[React Frontend]
    Frontend -->|REST API| Backend[FastAPI Backend]
    
    subgraph "Backend Services"
        Backend -->|Auth| AuthService
        Backend -->|Search| SearchService
        Backend -->|Data| RepositoryLayer
    end
    
    subgraph "External Providers"
        SearchService -->|Job Data| Scraper[Job Scrapers]
        SearchService -->|Reasoning| LLM[LLM Provider]
    end
    
    subgraph "Persistence"
        RepositoryLayer -->|SQLAlchemy| Database[(SQLite/Postgres)]
    end
```

### Backend Layering

The backend corresponds to `backend/` in the source tree and is divided into strict layers:

1. **API Layer (`backend/api`)**:
    - **Responsibility**: Handles HTTP requests, input validation (Pydantic), and response formatting.
    - **Characteristics**: thin, contains no business logic. Delegates immediately to Services.
    - **Endpoints**: `/auth`, `/jobs`, `/search`, `/profiles`.

2. **Service Layer (`backend/services`)**:
    - **Responsibility**: Core business logic. Orchestrates interactions between Repositories and Providers.
    - **Examples**: `SearchService` (manages generic search flow), `AuthService` (handles JWT issuance).
    - **Key Logic**: "Get keywords from LLM -> Run Scrapers -> Filter Results -> Save to DB".

3. **Repository Layer (`backend/repositories`)**:
    - **Responsibility**: Abstract data access. Provides clean interfaces (`get`, `create`, `update`, `delete`) to the database.
    - **Pattern**: Repository Pattern.
    - **Benefit**: Decouples business logic from specific ORM (SQLAlchemy) calls, making testing easier via mocking.

4. **Provider Layer (`backend/providers`)**:
    - **Responsibility**: Interfaces with external worlds.
    - **Details**:
        - `llm/`: Adapters for OpenAI, Gemini, Groq.
        - `jobs/`: Adapters for JobRoom, LinkedIn (planned), Indeed (planned).
    - **Pattern**: Adapter/Strategy Pattern.

### Frontend Structure

The frontend is a Single Page Application (SPA) built with Vite + React.

- **Components**: Reusable UI elements (`JobTable`, `SearchForm`).
- **Services**: API client wrappers that mirror the backend controllers.
- **State**: Local state management with React Hooks (`useState`, `useEffect`).
- **Routing**: Simple view-based routing for Dashboard, Search, and Schedules.

### Data Flow

**Scenario: A User runs a new Search.**

1. **Frontend**: User fills form, uploads CV. `POST /api/v1/search/start` is called.
2. **API**: `SearchRouter` validates the input JSON. Calls `SearchService.execute_search_async()`.
3. **Service**:
    - Calls `ProfileRepository` to save the search configuration.
    - Calls `LLMProvider` to extract keywords from CV.
    - Iterates through keywords:
        - Calls `JobProvider` (e.g., JobRoom) to fetch raw HTML/JSON.
        - Parses results into standard `Job` objects.
    - Calls `LLMProvider` again to score each job against the profile.
    - Calls `JobRepository` to save new jobs (checking for duplicates).
4. **Frontend**: Polls `/api/v1/search/status/{id}` to show progress bar and logs.
5. **Database**: Stores final results.

---

## 💻 Technology Stack

### Backend

- **Language**: Python 3.10+
- **Framework**: FastAPI (High performance async framework)
- **ORM**: SQLAlchemy (Database abstraction)
- **Validation**: Pydantic v2 (Data validation settings)
- **Authentication**: OAuth2 with JWT (JSON Web Tokens)
- **HTTP Client**: Httpx (Async HTTP requests)
- **Testing**: Pytest, Pytest-Asyncio
- **Task Queue**: BackgroundTasks (Simple in-memory queue)

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite (Next generation frontend tooling)
- **Styling**: Bootstrap 5 (CSS Framework), Bootstrap Icons
- **Language**: JavaScript (ES6+)
- **HTTP Client**: Fetch API (wrapped in custom client)

### DevOps & Tools

- **Database**: SQLite (default), extensible to PostgreSQL
- **Linting**: ESLint (Frontend), Ruff (Backend - recommended)
- **Version Control**: Git

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed:

- **Python 3.10** or higher: [Download Python](https://www.python.org/downloads/)
- **Node.js 18** or higher (LTS recommended): [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/)
- **API Key**: You need an API key for Groq, DeepSeek, or Gemini.

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/ejupi-djenis30/job-hunter-ai.git
cd job-hunter-ai
```

#### 2. Backend Setup

It is recommended to use a virtual environment to manage Python dependencies.

**Windows:**

```powershell
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

#### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### Database Setup

By default, the application uses **SQLite**, which requires no additional installation. The database file `job_hunter.db` will be automatically created in the root directory upon the first run of the application.

If you wish to use PostgreSQL:

1. Install PostgreSQL and create a database (e.g., `jobhunter`).
2. Install the driver: `pip install psycopg2-binary`.
3. Update the `DATABASE_URL` in `.env`.

---

## ⚙ Configuration Guide

The application is configured using environment variables. This serves as the single source of truth for configuration.

1. Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

    *(On Windows, copy and rename manually)*

2. Open `.env` in your text editor.

### Environment Variables

Here is a detailed explanation of every available configuration option:

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| **General** | | | |
| `PROJECT_NAME` | No | Job Hunter AI | Name of the application displayed in Swagger UI. |
| `API_V1_STR` | No | /api/v1 | Prefix for all API endpoints. Only change if running behind a proxy with path rewriting. |
| `LOG_LEVEL` | No | INFO | Logging verbosity (DEBUG, INFO, WARNING, ERROR). Use DEBUG for detailed traces. |
| **Security** | | | |
| `SECRET_KEY` | **Yes** | *changeme* | Random string used to sign JWT tokens. **CRITICAL**: Change this in production. Run `openssl rand -hex 32` to generate one. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 11520 | Token validity in minutes (11520 = 8 days). |
| `CORS_ORIGINS` | No | * | Comma-separated list of allowed origins (e.g., `http://localhost:5173`). In production, set this to your exact frontend domain. |
| **Database** | | | |
| `DATABASE_URL` | No | `sqlite:///./job_hunter.db` | Connection string. <br>SQLite: `sqlite:///./file.db`<br>Postgres: `postgresql://user:pass@localhost:5432/db` |
| **LLM Configuration** | | | |
| `LLM_PROVIDER` | **Yes** | `groq` | Which AI provider to use. Options: `groq`, `deepseek`, `gemini`, `openai`. |
| `LLM_API_KEY` | **Yes** | - | The specific API key for the chosen provider. |
| `LLM_MODEL` | No | *Provider Default* | Override the specific model name (e.g., `llama3-70b-8192` for Groq, `gemini-pro` for Gemini). |
| **Job Providers** | | | |
| `ENABLE_JOBROOM` | No | `true` | Enable/Disable the JobRoom scraper. |
| `JOBROOM_USER_AGENT` | No | *Generic User Agent* | User Agent string used for scraping requests. Important to identify your bot responsibly. |

### LLM Provider Setup

#### Groq (Recommended for Speed)

Groq offers incredibly fast inference speeds, which is great for the interactive nature of search.

- **Sign up**: [console.groq.com](https://console.groq.com)
- **Env**:

    ```ini
    LLM_PROVIDER=groq
    LLM_API_KEY=gsk_...
    LLM_MODEL=llama3-70b-8192
    ```

#### DeepSeek (Recommended for Cost)

DeepSeek provides excellent reasoning capabilities at a very low cost.

- **Sign up**: [deepseek.com](https://platform.deepseek.com)
- **Env**:

    ```ini
    LLM_PROVIDER=deepseek
    LLM_API_KEY=sk-...
    LLM_MODEL=deepseek-chat
    ```

#### Google Gemini

Google's Gemini models have massive context windows, useful for very long CVs or job descriptions.

- **Sign up**: [aistudio.google.com](https://aistudio.google.com/)
- **Env**:

    ```ini
    LLM_PROVIDER=gemini
    LLM_API_KEY=AIza...
    LLM_MODEL=gemini-pro
    ```

---

## 📖 Usage Guide

### 1. Starting the Application

You need two terminal windows running simultaneously.

**Terminal 1 (Backend):**

```bash
# Ensure venv is active
uvicorn backend.main:app --reload
```

*The backend will start at `http://localhost:8000`*

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

*The frontend will start at `http://localhost:5173`*

### 2. User Registration

1. Open `http://localhost:5173`.
2. You will be greeted by the Login screen.
3. Click "Don't have an account? Register".
4. Enter a username and password (min 4 chars).
5. Click "Create Account". You will be automatically logged in.

### 3. Creating a Search Profile

The Search Profile acts as the "Instruction Manual" for the AI.

1. Click **New Search** in the navigation bar.
2. **Role Description**: Describe what you want in natural language.
    - *Example: "I am looking for a Senior Frontend Developer role using React and TypeScript. I prefer remote work or hybrid in Zurich. I am interested in Fintech."*
3. **Upload CV (Required)**:
    - Job Hunter AI uses your CV to extract technical keywords (e.g., "React", "Docker") that you might forget to mention in the description.
    - Supported formats: `.pdf`, `.txt`, `.md`.
4. **Filters**:
    - **Location**: e.g., "Bern".
    - **Workload**: e.g., "80-100%".
    - **Latitude/Longitude**: (Advanced) Used for radius calculation. Defaults to Zurich.
5. **AI Strategy**:
    - Give specific instructions to the AI scoring engine.
    - *Example: "Downrank consultancy roles. Prioritize product companies. Ignore internships."*

### 4. Running a Search

1. Click **Start Intelligent Search**.
2. You will be redirected to the **Progress View**.
3. **Stages**:
    - **Generating Queries**: AI analyzes your CV + Description to create search permutations (e.g., "React Developer Zurich", "Frontend Engineer Remote").
    - **Searching**: The system executes these queries against enabled Job Providers (e.g., JobRoom).
    - **Processing**: Each found job is parsed, de-duplicated, and passed to the AI for scoring.
4. Watch the **Live Log** to see exactly what the agent is doing.

### 5. Interpreting Results

Once scanning is complete, go to the **Dashboard**.

- **Match Score**: A percentage (0-100%) indicating how well the job fits your profile.
  - <span style="color:green">Green (>75%)</span>: Strong Match.
  - <span style="color:orange">Yellow (50-75%)</span>: Potential Match.
  - <span style="color:red">Red (<50%)</span>: Low relevance.
- **Worth Applying**: A special badge 💡 indicates that even if the score is mediocre, the AI found a compelling reason to apply (e.g., "Perfect stack match despite location mismatch").
- **Actions**:
  - **Apply**: Click to open the original job listing in a new tab.
  - **Mark Applied**: Toggle the checkmark status to hide it from the "New" list or track your progress.

### 6. Scheduling

You can automate the search to run periodically.

1. In the "New Search" form, enable **Auto-Repeat Search**.
2. Select an interval (e.g., "Every 24 hours").
3. The system will create a background schedule.
4. View active schedules in the **Schedules** tab.
    - *Note: The backend server must be running for schedules to execute.*

---

## 📡 API Documentation

The backend provides a comprehensive Swagger/OpenAPI documentation interface.

- **Interactive Docs (Swagger UI)**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json`

Below is a detailed reference of the key endpoints.

### Authentication Endpoints

#### Register

- **URL**: `POST /api/v1/auth/register`
- **Body**:

    ```json
    {
      "username": "user1",
      "password": "secretpassword"
    }
    ```

- **Response**: `200 OK` (returns User object)

#### Login

- **URL**: `POST /api/v1/auth/login`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `username=user1&password=secretpassword`
- **Response**:

    ```json
    {
      "access_token": "ey...",
      "token_type": "bearer"
    }
    ```

### Job Endpoints

#### List Jobs

- **URL**: `GET /api/v1/jobs/`
- **Params**: `applied` (boolean, optional)
- **Response**: Array of Job objects.

    ```json
    [
      {
        "id": 123,
        "title": "Software Engineer",
        "company": "Tech Corp",
        "affinity_score": 85,
        "worth_applying": true,
        ...
      }
    ]
    ```

#### Update Job

- **URL**: `PATCH /api/v1/jobs/{job_id}`
- **Body**:

    ```json
    {
      "applied": true
    }
    ```

- **Response**: Updated Job object.

### Search Endpoints

#### Upload CV

- **URL**: `POST /api/v1/search/upload-cv`
- **Content-Type**: `multipart/form-data`
- **File**: `file=@my_cv.pdf`
- **Response**:

    ```json
    {
      "filename": "my_cv.pdf",
      "text": "Extracted text content from resume..."
    }
    ```

#### Start Search

- **URL**: `POST /api/v1/search/start`
- **Body**:

    ```json
    {
      "role_description": "Python Developer",
      "location_filter": "Zurich",
      "cv_content": "Extracted text...",
      "schedule_enabled": false
    }
    ```

- **Response**:

    ```json
    {
      "profile_id": 42,
      "message": "Search started"
    }
    ```

#### Get Search Status

- **URL**: `GET /api/v1/search/status/{profile_id}`
- **Response**:

    ```json
    {
      "state": "searching",
      "total_searches": 5,
      "current_search_index": 2,
      "jobs_new": 10,
      "log": [ ... ]
    }
    ```

### Profile Endpoints

#### List Profiles

- **URL**: `GET /api/v1/profiles/`
- **Response**: List of saved search profiles.

#### Delete Profile

- **URL**: `DELETE /api/v1/profiles/{id}`
- **Response**: `204 No Content`

---

## 💾 Database Schema

The generic database schema is defined in typical ORM fashion. Here are the core tables:

### `users`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Unique ID |
| `username` | String | Unique username |
| `hashed_password` | String | Bcrypt hash |

### `search_profiles`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Unique ID |
| `user_id` | Integer (FK) | Owner |
| `name` | String | Profile name |
| `role_description` | Text | User's job wish |
| `search_keywords` | JSON | AI-generated keywords |
| `schedule_enabled` | Boolean | True if recurring |
| `schedule_interval_hours` | Integer | Hours between runs |
| `last_run` | DateTime | Last execution |

### `jobs`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Unique ID |
| `provider_id` | String | Ext ID (e.g. from JobRoom) |
| `title` | String | Job Title |
| `company` | String | Company Name |
| `description` | Text | Full HTML/Text description |
| `url` | String | Link to apply |
| `affinity_score` | Integer | 0-100 AI Score |
| `affinity_analysis` | Text | AI reasoning |
| `applied` | Boolean | Has user applied? |
| `created_at` | DateTime | Timestamp |

---

## 💻 Development Guide

### Project Structure (Refactored)

The project structure is organized for scalability:

```text
job-hunter-ai/
├── backend/                  # Python Backend
│   ├── api/                  # API Routers
│   │   ├── auth.py           # Login/Register endpoints
│   │   ├── jobs.py           # Job management endpoints
│   │   ├── profiles.py       # Profile/Schedule endpoints
│   │   ├── schedules.py      # Schedule monitoring
│   │   └── search.py         # Search orchestration
│   ├── core/                 # App Core
│   │   ├── config.py         # Pydantic Settings
│   │   └── exceptions.py     # Custom Exceptions
│   ├── db/                   # Database
│   │   ├── base.py           # SQLAlchemy Base
│   │   └── session.py        # DB Session Management
│   ├── providers/            # External Adapter Layer
│   │   ├── llm/              # LLM Implementations (Groq, etc.)
│   │   └── jobs/             # Scraper Implementations
│   ├── repositories/         # DB Access Layer
│   │   ├── job_repository.py
│   │   └── ...
│   ├── services/             # Business Logic Layer
│   │   ├── search.py         # Search Orchestration
│   │   └── auth.py           # Auth Logic
│   ├── schemas.py            # Pydantic Models (DTOs)
│   ├── models.py             # SQLAlchemy Models
│   └── main.py               # Application Entry
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # UI Components
│   │   ├── services/         # API Clients
│   │   └── ...
│   └── ...
├── tests/                    # Pytest Suite
└── ...
```

### Running Tests

We use `pytest` for unit and integration testing.

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/unit/test_auth.py
```

**Test Coverage**:

- **Unit Tests**: Mocked dependencies to test Services and Repositories in isolation.
- **Integration Tests**: Test the full API flow using a test database (SQLite in-memory).

### Adding New Providers

One of the core design goals is extensibility. Here is how you can add new sources.

#### Adding a new Job Board (Scraper)

1. Create a new file in `backend/providers/jobs/` (e.g., `indeed.py`).
2. Inherit from the `JobProvider` base class.
3. Implement the `fetch_jobs(query)` method to return list of dictionaries.
4. Implement `parse_job(html)` method to return a standard `JobSchema`.
5. Register the provider in `SearchService`.

#### Adding a new LLM

1. Create a new file in `backend/providers/llm/` (e.g., `claude.py`).
2. Inherit from `LLMProvider`.
3. Implement `generate_text()` and `generate_json()`.
4. Add it to `LLMFactory` in `backend/providers/llm/factory.py` with a new key.

---

## 🚢 Deployment

### Docker Compose (Recommended)

The easiest way to run the full stack (Frontend + Backend + Database) is via Docker.

1. **Configure Environment**:
   - Ensure your `.env` file lists your `LLM_PROVIDER` and `LLM_API_KEY`.
   - `docker-compose.yml` is pre-configured to read these values.

2. **Run with Docker Compose**:

   ```bash
   docker-compose up -d --build
   ```

3. **Access the App**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/docs`

4. **Stop the App**:

   ```bash
   docker-compose down
   ```

### Manual Deployment (Linux/VPS)

1. **Backend**:
    - Use `systemd` to run `uvicorn` as a service.
    - Use `nginx` as a reverse proxy to forward `/api` requests to port 8000.
2. **Frontend**:
    - Run `npm run build` to generate static files in `dist/`.
    - Serve `dist/` using Nginx.
3. **Environment**:
    - Ensure `.env` is secure and `SECRET_KEY` is strong.
    - Set `LOG_LEVEL=WARNING` for production.

---

## ❓ Troubleshooting

### Common Issues

**1. `ModuleNotFoundError: No module named 'backend'`**

- **Cause**: Python path issue.
- **Fix**: Run uvicorn from the project root directory, not inside `backend/`.

    ```bash
    # Defines root as python path
    python -m uvicorn backend.main:app --reload
    ```

**2. `AttributeError: type object 'Settings' has no attribute 'LLM_PROVIDER'`**

- **Cause**: `.env` file is missing or not loaded.
- **Fix**: Ensure `.env` exists in the root directory and contains `LLM_PROVIDER`.

**3. Frontend shows "Network Error"**

- **Cause**: Backend is not running or CORS issue.
- **Fix**: Ensure Backend is running on port 8000. Check `CORS_ORIGINS` in `.env`.

**4. "HuggingFace Token not found"**

- **Cause**: Only if using local transformers (not default).
- **Fix**: This project uses remote APIs (Groq/DeepSeek) by default, so this shouldn't happen unless you modified the code to use local models.

**5. Search stuck on "Generating Queries"**

- **Cause**: LLM API key might be invalid or out of credits.
- **Fix**: Check backend logs (`uvicorn` terminal) for 401/403 errors from the LLM provider.

---

## 🤝 Contributing

We welcome contributions from the community!

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

Please make sure to update tests as appropriate.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- **FastAPI**: For the amazing speed and Developer Experience (DX).
- **Vite**: For the lightning-fast frontend tooling.
- **Groq**: For enabling real-time LLM inference.
- **JobRoom.ch**: For providing the data source for Swiss job seekers.
- **React Query / Bootstrap**: For making frontend development sane.
