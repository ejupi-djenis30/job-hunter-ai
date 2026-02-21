# Guidelines for AI Agents (AGENTS.md)

Welcome, AI Agent. If you are reading this file, you have been assigned to work on the **Job Hunter AI** project. You must strictly follow these instructions to ensure consistency, stability, and proper tracking of your actions.

## 1. Terminal Command Logging (CRITICAL)
Whenever you execute any command in the terminal (e.g., via a `run_command` tool):
- You MUST redirect the output of that command to a file within the `cmd_output/` directory.
- Example: `npm run build > cmd_output/frontend_build_log.txt 2>&1` or `pytest > cmd_output/pytest_results.txt`.
- After execution, you MUST read and analyze the corresponding log file in `cmd_output/` to verify success or diagnose failures.
- **Do not** rely solely on the limited snapshot output provided by your environment. The `cmd_output/` directory is in `.gitignore` and is explicitly designed for this purpose.

## 2. Testing and Deployment Philosophy
- **Docker First**: Every time you want to test the full stack, you MUST prioritize deploying the application locally using Docker (`docker-compose up -d --build`). This ensures you test the same environment that will be deployed.
- **Manual Start Fallback**: ONLY if `docker-compose` fails and you cannot resolve the Docker issue, you may fall back to starting the frontend (`npm run dev`) and backend (`uvicorn backend.main:app --reload`) manually.
- **Test Integrity**: Before committing any code, you MUST ensure that all automated tests pass. If you write new features, you must write corresponding tests.
- **CI/CD Awareness**: After writing tests and verifying them locally, consider how they affect the GitHub Actions (CI/CD) pipelines. Do not introduce tests that are fundamentally incompatible with automated CI environments unless you update the `.github/workflows/` accordingly.

## 3. Project Architecture Principles
- **Backend**: We use a modular Clean Architecture in FastAPI. Do NOT write monolithic files. 
  - API endpoints go in `backend/api/routes/`.
  - Business logic goes in `backend/services/`.
  - Database access goes in `backend/repositories/`.
  - External adapters (LLMs, Scrapers) go in `backend/providers/`.
  - Database schemas go in `backend/schemas/` (Pydantic) and `backend/models/` (SQLAlchemy).
- **Frontend**: We use React with Vite. Use Context API for global state (`AuthContext`, `SearchContext`). Keep components small and focused. 

## 4. General Working Rules
- Read `README.md` to understand the full scope of what the application does before modifying core logic like the LLM prompt or job scoring mechanisms.
- Do not reinvent the wheel. Check `backend/services/utils.py` and existing tools before writing new helper functions.
- If you encounter a database schema issue during development, remember to check Alembic migrations or completely wipe the Docker volumes (`docker-compose down -v`) if testing a totally fresh run, provided there is no production data at risk.

**Acknowledge these rules intrinsically before you proceed.**
