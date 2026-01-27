# TalentSync Codebase Guide for Agents

This repository is a monorepo containing a **Next.js Frontend** and a **FastAPI Backend**.

## Critical Agent Constraints

1.  **NO Dev Servers**: Do NOT start `bun run dev`, `uvicorn`, or any long-running processes unless explicitly asked.
2.  **NO Emojis**: Do not use emojis in UI text or code comments. Use SVGs or icons (`lucide-react`) instead.
3.  **Absolute Paths**: ALWAYS use absolute paths for file operations (e.g., `/Users/taf/Projects/TalentSync/TalentSync-Normies/frontend/...`).
4.  **Tooling**: Use **Bun** for frontend and **uv** for backend.

---

## Frontend (`frontend/`)

### dependency Management
- **Tool:** Bun (`bun`)
- **Lockfile:** `bun.lock`
- **Install:** `cd frontend && bun install`

### Design Philosophy
- **Mobile First:** Build for mobile screens first, then use Tailwind's `md:`, `lg:` prefixes to scale up.
- **Desktop Optimized:** While mobile-first, ensure a rich, dense, and high-performance experience on desktop.
- **Visuals:** NO Emojis. Use `lucide-react` icons or raw SVGs.

### Verification & Testing
*Run these commands from `frontend/` to verify your changes.*

- **Type Check (Recommended):** `bun x tsc --noEmit`
  - *Run this after every significant TS change.*
- **Lint:** `bun run lint`
- **Build:** `bun run build`
  - *Ensures all pages and components compile correctly.*
- **Single Component Verification:**
  - If editing a component, try to compile it or check usage: `bun x tsc --noEmit` is your best friend here.

### Code Style
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS + `cn()` utility.
- **UI Components:** Shadcn/UI (`@/components/ui`).
- **Icons:** `lucide-react` (Use these instead of text emojis).
- **Imports:** Use aliases `@/` (e.g., `@/components/ui/button`).
  - *Order:* External -> Internal Libs -> Components -> Styles.

---

## Backend (`backend/`)

### Dependency Management
- **Tool:** uv (`uv`)
- **Lockfile:** `uv.lock`
- **Install:** `cd backend && uv sync`
- **Add Dependency:** `cd backend && uv add <package>`

### Verification & Testing
*Run these commands from `backend/` to verify your changes.*

- **Syntax Check (Fast):** `uv run python -m py_compile <path_to_file>`
  - *Run this after editing any .py file to catch syntax errors.*
- **Run Tests:** `uv run python test.py`
  - *Currently uses manual asyncio scripts. Do not use pytest unless you set it up.*
- **Type Checking:** Strict type hints are required (Python 3.13+).
  - Use `pydantic` models for validation.

### Code Style
- **Async:** Codebase is heavily async. Use `async def` and `await`.
- **Structure:**
  - `app/`: Main application code.
  - `main.py`: Entry point (do not run via uvicorn for checks).
- **Formatting:** PEP 8 standard. NO Emojis in strings/comments.

---

## General Workflow for Agents

1.  **Explore:** Use `ls -F` and `read` to understand the file structure before editing.
2.  **Edit:** Make changes using `edit` or `write`.
3.  **Verify (Frontend):**
    ```bash
    workdir="/Users/taf/Projects/TalentSync/TalentSync-Normies/frontend" command="bun x tsc --noEmit"
    ```
4.  **Verify (Backend):**
    ```bash
    workdir="/Users/taf/Projects/TalentSync/TalentSync-Normies/backend" command="uv run python -m py_compile app/main.py"
    ```
5.  **Commit:** Only if tests/checks pass. Message: `type(scope): description`.

## Common Pitfalls to Avoid
- **Do not** use `npm` or `pip` directly. Stick to `bun` and `uv`.
- **Do not** add `console.log` or `print` for debugging unless you remove them immediately.
- **Do not** revert existing logic without understanding it; read the surrounding code first.
