# Job Hunter AI 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/vite-5.0+-646cff.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

**Job Hunter AI** is an advanced, self-hosted, agentic job search assistant designed to automate the repetitive and tedious aspects of finding a new job. By leveraging the power of Large Language Models (LLMs) and automated web scraping, it acts as a personal recruiter working 24/7 to find opportunities that match your specific profile, career goals, and technical background.

Unlike standard job boards that rely on simple, rigid keyword matching, Job Hunter AI uses **semantic understanding** of your curriculum vitae (CV) and career aspirations to identify highly relevant opportunities, even if the exact phrasing in the job description doesn't match your resume perfectly. It allows you to aggregate listings from multiple diverse sources into a single, unified, and aesthetically pleasing dashboard, score them based on complex organizational fit, and continuously track your application execution lifecycle.

This project is actively maintained and has recently undergone a massive architectural overhaul to support advanced modularity, robust Docker deployments, and sophisticated AI-driven search strategies.

---

## 📑 Comprehensive Table of Contents

1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [Deep Dive: Key Features](#2-deep-dive-key-features)
    - [AI-Powered Discovery](#ai-powered-discovery)
    - [Intelligent Applicant Analysis](#intelligent-applicant-analysis)
    - [Swiss Market Optimization](#swiss-market-optimization)
    - [Workflow Automation](#workflow-automation)
    - [Modern User Interface](#modern-user-interface)
3. [The AI Brain: Strategy & Models](#3-the-ai-brain-strategy--models)
4. [Architecture & System Design](#4-architecture--system-design)
    - [System Overview](#system-overview)
    - [Backend Modularity (Clean Architecture)](#backend-modularity-clean-architecture)
    - [Frontend Component Hierarchy](#frontend-component-hierarchy)
    - [Data Flow Lifecycle](#data-flow-lifecycle)
5. [Database Schema & Models](#5-database-schema--models)
6. [Technology Stack](#6-technology-stack)
7. [Installation & Deployment](#7-installation--deployment)
    - [Prerequisites](#prerequisites)
    - [Method A: Docker Deployment (Recommended)](#method-a-docker-deployment-recommended)
    - [Method B: Manual Local Setup](#method-b-manual-local-setup)
8. [Comprehensive Configuration Guide](#8-comprehensive-configuration-guide)
    - [Environment Variables Detail](#environment-variables-detail)
9. [Usage Guide: Step-by-Step](#9-usage-guide-step-by-step)
    - [User Registration & Authentication](#user-registration--authentication)
    - [Creating a Strategic Search Profile](#creating-a-strategic-search-profile)
    - [Running & Monitoring Searches](#running--monitoring-searches)
    - [Interpreting Job Scores & Applying](#interpreting-job-scores--applying)
    - [Automated Scheduling](#automated-scheduling)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Development & Agentic Guidelines](#11-development--agentic-guidelines)
    - [Testing Suite](#testing-suite)
    - [Agent Operations (AGENTS.md)](#agent-operations-agentsmd)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Roadmap](#13-roadmap)
14. [License](#14-license)

---

## 1. Project Overview & Philosophy

Finding a job is a full-time job. You have to check multiple sites daily, filter through hundreds of entirely irrelevant or slightly off-target listings, read lengthy requirements, and tailor your CV for every single application. 

**Job Hunter AI** solves this systemic inefficiency by operating on a simple philosophy: Let machines do the reading, searching, and filtering, while the human makes the final executive decision.

The tool operates through a sophisticated pipeline:
1. **Intelligent Ingestion**: It reads your CV in PDF or raw Text format. It doesn't just parse text; it understands your seniority, technical stack, soft skills, and past domains.
2. **Dynamic Query Generation**: Instead of you typing "Python Developer", the AI looks at your CV and generates dozens of highly optimized search queries across multiple languages (English, German, French) to cast the widest, yet most precise, net possible.
3. **Automated Extraction**: It connects to major job boards (starting with Swiss market leaders) to fetch raw listings automatically.
4. **Deep Semantic Scoring**: It uses LLMs (like Llama 3, DeepSeek, or Gemini) to "read" every single job description outputted by the scrapers. It then scores the job against your specific profile, considering critical nuances like seniority mismatch, required languages, and workload percentages.
5. **Continuous Automation**: It runs silently in the background on a schedule, alerting you only when high-quality, actionable matches are discovered.

This project is built to be **100% self-hosted**. Your CV, your career goals, and your application history remain entirely private on your local machine or personal VPS.

---

## 2. Deep Dive: Key Features

### AI-Powered Discovery

- **Smart Keyword Extraction**: Automatically analyzes your uploaded CV to extract relevant technical frameworks, soft skills, language fluencies, and domain expertise.
- **Dynamic Search Strategies**: The system translates your plain-English career goals into precise executable queries. It uses a strict architecture of "Occupation" queries to ensure pure job titles are searched across multiple linguistic variations.
- **Semantic Matching**: Unlike Regex or basic SQL `ILIKE` matches, the system uses LLMs to understand the *intent* and *context* of a job posting. It knows that a "Software Engineer II" is different from a "Principal Software Architect" even if both listings contain the word "Python".

### Intelligent Applicant Analysis

- **Granular Scoring Engine**: Every newly discovered job is passed through an LLM evaluator and scored from 0% to 100% based on your profile compatibility.
- **Narrative Summaries**: For every job, the AI generates a concise, 2-3 sentence narrative explaining *exactly why* the job is a good or bad fit. Example: "Strong technical match for your React and Node.js skills, but the role mandates fluent German (C1) which is missing from your profile."
- **"Worth Applying" Boolean Flag**: The AI separates "perfect matches" from "reach goals", actively flagging jobs that might have a lower score but are strategically worth sending an application to.

### Swiss Market Optimization

- **Native Integrations**: Built-in, robust scrapers for `job-room.ch` (the official RAV/Unemployment office database) and expanding to platforms like `swissdevjobs.ch`.
- **Multilingual Support**: Natively capable of parsing and scoring job descriptions in German (High German and Swiss German nuances), French, Italian, and English.
- **Geospatial Location Filtering**: Precise radius-based filtering using the Haversine formula (e.g., "Find jobs strictly within a 45km radius of Zurich").

### Workflow Automation

- **Background Scheduling**: Set up cron-like schedules to run searches automatically (e.g., "Run my 'Backend Architect' profile every 12 hours").
- **Live WebSocket/Polling Tracking**: Watch the agent generate queries, scrape geographic data, fetch listings, and analyze jobs in real-time through the frontend Progress dashboard.
- **Application Lifecycle Tracking**: Mark jobs as "Applied", track rejection/acceptance statuses, and maintain a complete historical ledger of your job hunt.
- **Smart Duplicate Detection**: Intelligent hashing mechanisms prevent you from ever seeing the same job twice, even if the company reposts the listing weeks later.

### Modern User Interface

- **Premium Glassmorphism Design**: A stunning, translucent React-based UI featuring interactive animated gradients and fluid transitions.
- **Device Responsiveness**: Fully optimized two-column layouts for desktop, and card-based vertical stacks for mobile device tracking.
- **Contextual Smart Filters**: Dynamically filter your global dashboard. Selecting a specific Search Profile instantly recalculates your average match scores and application conversion rates specific to that search parameter.

---

## 3. The AI Brain: Strategy & Models

Job Hunter AI is LLM-agnostic, meaning it is designed to hot-swap the underlying "brain" of the application based on your needs, API costs, or privacy concerns.

### Supported Providers
- **Groq (Recommended)**: Utilizes models like `llama3-70b-8192`. Groq is heavily recommended because job analysis requires processing hundreds of listings. Groq's specialized LPU hardware provides instantaneous inference, reducing search times from minutes to seconds.
- **DeepSeek**: Excellent for highly technical software engineering searches. DeepSeek's models have profound reasoning capabilities regarding complex technical stacks.
- **Google Gemini**: Useful for its massive context windows, particularly if your CV is incredibly lengthy or if you are analyzing massive conglomerate job descriptions.
- **Ollama (Full Privacy)**: Allows you to run models like `llama3` safely and completely offline on your local hardware.

### The Two-Pass Brain Architecture
1. **The Generation Pass**: The AI reads your Profile and outputs strictly formatted JSON containing an array of Search Queries. The prompt is heavily constrained to avoid boolean logic nightmares and force the model to explore linguistic variations.
2. **The Evaluation Pass**: The AI acts as a "Career Coach". It takes exactly one job listing and exactly one CV, evaluating them against strict rules (e.g., "If the user is a Junior and the job says Principal, cap the score at 50% max").

---

## 4. Architecture & System Design

The application recently underwent a monumental refactoring process, moving from monolithic files to a strictly typed, modular Clean Architecture.

### System Overview

The application is orchestrated via Docker, connecting a Vite-compiled React Single Page Application to a Uvicorn-served FastAPI asynchronous backend, which persists data to a relational database.

### Backend Modularity (Clean Architecture)

The backend (`backend/`) is divided into distinct, isolated responsibility layers:

1. **API Layer (`backend/api/routes/`)**:
    - **Responsibility**: Pure HTTP transport layer. Handles receiving requests, enforcing Pydantic validation via FastAPI dependencies, and returning HTTP responses or exceptions.
    - **Isolation**: Absolutely zero business or database logic. Completely delegates to Services.
    - **Files**: `auth.py`, `jobs.py`, `search.py`, `profiles.py`.

2. **Service Layer (`backend/services/`)**:
    - **Responsibility**: The core business rules and orchestration engine.
    - **Examples**: `search_service.py` coordinates the LLM query generation, the Scraper execution, deduplication logic, and AI scoring. `job_service.py` handles business logic regarding job progression.
    - **Concurrency**: Relies heavily on `asyncio` for parallelizing external HTTP scrape requests and LLM inferences.

3. **Repository Layer (`backend/repositories/`)**:
    - **Responsibility**: Abstract data persistence. Implements the Repository Pattern, completely decoupling the Services from SQLAlchemy intricacies.
    - **Benefit**: Simplifies testing and querying. Handles complex SQLAlchemy `case` statements for universal compatibility across SQLite and PostgreSQL.

4. **Provider Layer (`backend/providers/`)**:
    - **Responsibility**: External world interfaces (Adapter Pattern).
    - **Submodules**: 
      - `llm/`: Contains concrete classes for Groq, DeepSeek, Gemini.
      - `jobs/`: Connects to `job-room.ch` APIs, formatting their proprietary JSON into internal systemic Request models.

### Frontend Component Hierarchy

The `frontend/` directory is a highly modern React 19 application.
- **Context API (`src/context/`)**: Manages the global state. `AuthContext` guarantees secure JWT token lifecycle. `SearchContext` strictly polls active background processes to keep the UI inherently reactive to backend mutations.
- **Pages (`src/pages/`)**: Top-level route components (`JobsPage`, `NewSearchPage`, `HistoryPage`).
- **Components (`src/components/`)**: Granular, reusable UI units like the `FilterBar` (which dynamically handles context scoping) and the `JobTable`.

### Data Flow Lifecycle (Search Execution)

1. Client POSTs to `/api/v1/search/start` with a `profile_id`.
2. The endpoint passes the ID to FastAPI `BackgroundTasks` and immediately returns a 202 Accepted.
3. The `SearchService` wakes up in the background. It reads the Profile from `ProfileRepository`.
4. It calls the `LLMService` to generate an execution plan.
5. It iterates over the generated queries, calling the `JobRoomProvider`.
6. Results are deduplicated against existing database indices.
7. Unique jobs are chunked and evaluated in parallel via `asyncio.gather` through the `LLMService`.
8. Fully scored jobs are persisted via the `JobRepository`.
9. The frontend `SearchContext` polling detects the completion and gracefully ceases its refresh loops.

---

## 5. Database Schema & Models

The system relies on a strictly relational schema, managed by SQLAlchemy ORM.

### Key Entities

1. **User (`users` table)**:
   - Contains credentials, hashed passwords, and creation metadata.
   - Relationship: One-to-Many with `Profiles` and `Jobs`.

2. **Search Profile (`search_profiles` table)**:
   - The central configuration entity.
   - Fields: `name`, `role_description`, `cv_content`, `search_strategy`, `location_filter`, `workload_filter`, `max_queries`.
   - Stores scheduling configurations (`schedule_interval_hours`, `is_active_schedule`).

3. **Job (`jobs` table)**:
   - The primary data asset.
   - Core Fields: `title`, `company`, `description`, `location`, `url`.
   - Advanced Fields: `affinity_score` (Integer), `affinity_analysis` (Text), `worth_applying` (Boolean).
   - Relationship: Every job is linked to the User and strictly linked via Foreign Key (`search_profile_id`) to the specific search variation that spawned it, enabling granular UI filtering.

4. **Search History (`search_histories` table)**:
   - Audit ledger recording every time a search execution occurs, how many jobs were queried, new uniquely discover jobs, and duplicates encountered.

---

## 6. Technology Stack

### Backend
- **Language**: Python 3.10+
- **Framework**: FastAPI (High-performance asynchronous framework)
- **ORM**: SQLAlchemy 2.0+
- **Database Migrations**: Alembic
- **Validation**: Pydantic v2
- **Authentication**: Passlib (Bcrypt), PyJWT (OAuth2 with Bearer token)
- **HTTP/Network**: Httpx (Async REST Client)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with Bootstrap 5 utility classes and Bootstrap Icons
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (wrapped in an interception `ApiClient` for JWT injection)

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Default Database in Container**: PostgreSQL 15
- **Default Database Local**: SQLite 3

---

## 7. Installation & Deployment

Job Hunter AI is designed to run everywhere, from a local Windows laptop to a dedicated Linux cloud server. You have two methodologies for installation.

### Prerequisites
- **Git**
- **LLM API Key**: You must possess at least one API key from Groq, DeepSeek, Google AI Studio, or have a local Ollama instance running.

### Method A: Docker Deployment (Highly Recommended)

Docker is the sanctioned, official method for running Job Hunter AI. It guarantees absolute consistency, automatically spins up a robust PostgreSQL database, prevents CORS/Binding issues, and correctly serves both layers on a unified network.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ejupi-djenis30/job-hunter-ai.git
   cd job-hunter-ai
   ```

2. **Configure Environment Variables**:
   Copy the example file and input your specific keys.
   ```bash
   cp .env.example .env
   ```
   *CRITICAL: You MUST set an `LLM_API_KEY` and define your `LLM_PROVIDER` in the `.env` file.* You should also change the `SECRET_KEY` and `POSTGRES_PASSWORD`.

3. **Deploy with Docker Compose**:
   Ensure Docker Desktop or the Docker Engine is running on your machine.
   ```bash
   docker-compose up -d --build
   ```
   **Note**: The `--build` flag is critical on your first run or after pulling new code to ensure the Python and Node modules compile correctly inside the images.

4. **Access the Application**:
   - Frontend Access: `http://localhost:5173`
   - Backend API Docs: `http://localhost:8000/docs`

### Method B: Manual Local Setup (Development Mode)

If you are actively developing and modifying the codebase, you may prefer running the services directly on your host machine targeting a local SQLite file.

1. **Clone and Setup Backend**:
   ```bash
   git clone https://github.com/ejupi-djenis30/job-hunter-ai.git
   cd job-hunter-ai
   
   # Create Virtual Environment
   python -m venv venv
   
   # Activate Environment (Windows)
   .\venv\Scripts\activate
   # Activate Environment (macOS/Linux)
   source venv/bin/activate
   
   # Install Dependencies
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Make sure `DATABASE_URL` is set to `sqlite:///./job_hunter.db` for local running without Postgres. Set your `LLM_API_KEY`.

3. **Start the Backend Server**:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Start the Frontend Development Server**:
   Open a completely new terminal window.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 8. Comprehensive Configuration Guide

The entire behavior of Job Hunter AI is dictated by environment variables. A robust `.env` file is required.

### Environment Variables Detail

| Variable Name | Status | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PROJECT_NAME` | Optional | Job Hunter AI | Displayed in OpenAPI Swagger documentation headers. |
| `API_V1_STR` | Optional | `/api/v1` | Base routing path for the REST API. |
| `LOG_LEVEL` | Optional | `INFO` | Affects server stdout. Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`. |
| `SECRET_KEY` | **Required** | `change_this_to_a_random_secure_string` | Used to cryptographically sign JSON Web Tokens. If this is leaked, your session data is compromised. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | `11520` | Duration of authentication sessions (in minutes). 11520 minutes equals precisely 8 days. |
| `CORS_ORIGINS` | Optional | `http://localhost:5173,http://localhost:8000` | Critical for browser security. If running on a remote proxy, add the domain here (e.g. `https://jobhunter.mydomain.com`). |
| `DATABASE_URL` | Optional | `postgresql://user:password@db:5432/jobhunter` | The connection string. If deploying via Docker, use the PostgreSQL string. If local, use `sqlite:///./job_hunter.db`. |
| `LLM_PROVIDER` | **Required** | `groq` | Options: `groq`, `deepseek`, `gemini`. |
| `LLM_API_KEY` | **Required** | N/A | The cryptographic API authorization key corresponding to the selected provider. |
| `LLM_MODEL` | Optional | *(Provider defaults)* | Overrides systemic defaults. E.g., setting to `llama3-8b-8192` if you want a faster/cheaper Groq run. |

---

## 9. Usage Guide: Step-by-Step

### User Registration & Authentication

Job Hunter AI is a multi-tenant system. The first user to register effectively becomes the primary owner of that specific account silo.

1. Navigate to your frontend address (e.g., `http://localhost:5173`).
2. You will be greeted by the Login screen. Click the hyperlink **"Don't have an account? Register"**.
3. Create a unique username and a password. Due to local hosting philosophy, complex email verifications are disabled—your username is your master key.
4. Upon successful registration, the system will instantly log you in and route you to an empty Global Dashboard.

### Creating a Strategic Search Profile

To extract value from the system, you must configure its parameters carefully.

1. Click on the **New Search** tab in the Sidebar.
2. **Title the Profile**: Give it a memorable name conceptually linked to the goal (e.g., "Remote React Devs - Startup Focus").
3. **Role Description**: Write sentences. Do not write "Frontend". Write "I am looking for a mid-to-senior level Frontend Engineering reality utilizing React, TypeScript, and Vite. I am indifferent to the backend stack."
4. **Upload CV**: Click the file uploader and provide a clean PDF or TXT version of your resume. The backend Python utilities will strip the text and ingest it.
5. **Geographic Constraints**: Specify the city (e.g., "Zurich") and utilize the Distance Slider to configure strict radius bounds (e.g., "45km max").
6. **AI Command Directives**: The "Search Strategy" field allows you to give the LLM explicit filtering rules. E.g., *"Strictly ignore any job listing from recruiting agencies like Hays or Randstad. Only direct company hires."*

### Running & Monitoring Searches

1. At the bottom of the Search setup, click **Start Job Search**.
2. Assuming you left "Immediate Execution" checked, the UI will instantly route you to the **Search in Progress** console.
3. Watch the terminal-like output window. You will see:
   - The LLM generating precise queries.
   - The Scrapers launching across API endpoints.
   - The parallel asynchronous analysis of each unique job found against your uploaded CV.
4. The system will gracefully conclude, displaying how many completely new, non-duplicate jobs were permanently appended to your database.

### Interpreting Job Scores & Applying

Switch over to the **Dashboard** (Jobs) tab.

- Look at the top **Filter Bar**. You can choose to view the "Global Dashboard" (everything you've ever found) or drill down to the specific Search Profile you just created.
- Review the Cards:
  - **Score Badge**: Indicates algorithmic compatibility. 
  - **Worth Applying Marker**: If the AI flagged it, there's a glowing indicator. These are the jobs you should prioritize reading first.
- Click a card to expand it and read the AI's personalized 2-sentence rationale regarding your fit for the role.
- If you intend to apply, click the external link button, then click the **Mark Applied** toggle in your dashboard to move the card out of your pending queue and into your metrics.

### Automated Scheduling

If you don't want to click manually:
1. Navigate to **Schedules**.
2. Select an existing Search Profile.
3. Toggle the switch to **Active**.
4. Set an interval (e.g., "Every 24 Hours").
5. The backend BackgroundTasks will silently execute the pipeline. You only need to check your Dashboard organically to see fresh, pre-scored listings waiting for you.

---

## 10. REST API Documentation

FastAPI automatically generates comprehensive API documentation conforming to the OpenAPI specification.

- **Swagger GUI**: `http://localhost:8000/docs`

### Critical Endpoints List

- **Authentication**:
  - `POST /api/v1/auth/login` → Returns `{"access_token": "...", "token_type": "bearer"}`
  - `POST /api/v1/auth/register` → Registers a new user.
- **Jobs**:
  - `GET /api/v1/jobs/` → Paginated retrieval. Accepts query params: `search_profile_id`, `status` (pending/applied), `worth_applying` (boolean).
  - `PUT /api/v1/jobs/{job_id}/apply` → Flips the application boolean tracker.
- **Search Execution**:
  - `POST /api/v1/search/upload-cv` → Multipart form upload for parsing.
  - `POST /api/v1/search/start` → Initiates the execution pipeline. Returns the `profile_id`.
  - `GET /api/v1/search/status/all` → Returns a deeply nested JSON object of all current executing statuses and terminal logs for the frontend to render.
- **Profiles**:
  - `GET /api/v1/profiles/` → Fetches the user's available search configs.

---

## 11. Development & Agentic Guidelines

If you are a developer, an AI agent, or a contributor working on the project, you must adhere to the rules mapped out in the infrastructure.

### Testing Suite

The project includes an advanced testing setup. We explicitly mandate that unit and integration tests must pass before any pull request is merged or before any feature is considered complete.

- **Running Backend Tests**:
  You must have `pytest` installed.
  ```bash
  cd job-hunter-ai
  pytest tests/backend/ -v
  ```
- **Test Locations**: All tests are grouped by their Clean Architecture logical tier inside `tests/backend/`.

### Agent Operations (AGENTS.md)

There is a dedicated file titled `AGENTS.md` located in the root directory. **Any AI agent interacting with this codebase must read that file before performing actions.** It contains explicitly formatted instructions outlining requirements for redirecting terminal output to the `.gitignore`-protected `cmd_output/` directory, strict Docker-first testing priorities, and mandates for architectural consistency.

---

## 12. Troubleshooting Guide

### 1. 🐞 "Axios Network Error / Connection Refused"
**Symptom**: The frontend loads, but attempting to login or save a profile throws a red toast notification saying `Network Error` or the browser console shows CORS Policy blockages.
**Resolution**: 
- If running manually: Ensure your backend terminal is running without crash loops.
- If using Docker: Ensure you navigated to `http://localhost:5173` absolutely perfectly. Navigating to `127.0.0.1:5173` might fail CORS policies depending on your browser. Check the `.env` file to ensure `CORS_ORIGINS` explicitly includes the exact URI you are typing into the address bar.

### 2. 🐞 "Search Progress is stuck at 'Connecting...'"
**Symptom**: You execute a search, but the progress bar does not move and no logs are printed to the frontend UI.
**Resolution**: The frontend relies on HTTP polling (every 1.5 seconds) to `GET /search/status/all`. Open your browser's Developer Tools (F12) -> Network tab. 
- Are the `/status/all` requests failing with 500s? Your backend has crashed (likely an LLM timeout). Check the backend Docker logs: `docker logs job-hunter-ai-backend-1`.
- If the requests are completing and returning `{}` (empty brace), there is an in-memory state desynchronization. Ensure your Docker compose file is running Gunicorn with exactly **1 worker thread**. Multiple threads will result in the state locking memory in an isolated thread inaccessible to the poller.

### 3. 🐞 "Database Integrity / Missing Columns Exception"
**Symptom**: `sqlalchemy.exc.OperationalError: no such column: ...`
**Resolution**: A backend structural change (like adding `search_profile_id`) occurred but your database file/volume has old schema definitions. 
- Docker: Stop the containers and violently wipe the volumes: `docker-compose down -v`, then `docker-compose up -d --build`.
- Manual: Delete `job_hunter.db` and restart `uvicorn`.

### 4. 🐞 "LLM Generation Failed / Returned 0 Keywords"
**Symptom**: The search completes instantly and says "Generated 0 queries".
**Resolution**: 
- Your `LLM_API_KEY` is likely invalid, expired, or out of credits.
- Double-check the exact provider name. If using a local ollama network instance, ensure the Docker bridge network allows the backend container to reach the host port 11434.

---

## 13. Roadmap

Future integrations planned for the Job Hunter AI ecosystem:
- [ ] Incorporate comprehensive LinkedIn automated scraping (via authenticated cookie session injection).
- [ ] Add `swissdevjobs.ch` and `jobs.ch` native providers to expanding caching capabilities.
- [ ] Implement an automated Cover Letter Generator utilizing the specific `<job_description>` context paired with the `<cv_content>`.
- [ ] Provide analytical charts visually plotting application success rates over time.

---

## 14. License

This highly robust and opinionated project is licensed freely under the MIT License. You are free to copy, modify, distribute, and self-host for your own personal career advantage. See the [LICENSE](LICENSE) file for exhaustive legal details. Happy Hunting! 🚀
