# TalentSync Codebase Guide for Agents

This repository is a monorepo containing a **Next.js Frontend** and a **FastAPI Backend**.

## Critical Agent Constraints

1.  **NO Dev Servers**: Do NOT start `bun run dev`, `uvicorn`, or any long-running processes unless explicitly asked.
2.  **NO Emojis**: Do not use emojis in UI text or code comments. Use SVGs or icons (`lucide-react`) instead.
3.  **Absolute Paths**: ALWAYS use absolute paths for file operations (e.g., `/Users/taf/Projects/TalentSync/TalentSync-Normies/frontend/...`).
4.  **Tooling**: Use **Bun** for frontend and **uv** for backend.
5.  **Use Skills**: When tasked with creating frontend UI or components, ALWAYS invoke the `frontend-design` skill using your Skill tool to ensure high-quality, production-grade aesthetics.

---

## Frontend (`frontend/`)

### Dependency Management
- **Tool:** Bun (`bun`)
- **Lockfile:** `bun.lock`
- **Install:** `cd frontend && bun install`

### Frontend Design System & Architecture

**CRITICAL MANDATE:** When building web components, pages, or modifying the UI in any way, you MUST use the `frontend-design` skill via your Skill tool. This ensures creative direction, modern aesthetics, and adherence to our UI/UX standards.

1. **Component Architecture & Page Design:**
   - **Primitives (The Foundation):** Always rely on **Shadcn UI** components located in `@/components/ui/` (e.g., `button.tsx`, `card.tsx`, `input.tsx`). Do not rebuild basic elements from scratch.
   - **Feature Components (The Building Blocks):** Group complex, domain-specific logic into feature folders (e.g., `@/components/ats`, `@/components/dashboard`). Keep them modular and focused.
   - **Designing a Page:**
     - Start with a root wrapper ensuring theme colors: `<div className="min-h-screen bg-background text-foreground">`.
     - Structure content inside a container to maintain consistent margins: `<main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">`.
     - Use modular layouts: default to Flexbox (`flex flex-col gap-y-6`) or CSS Grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) for structuring cards and sections.

2. **Color Schemes & How to Pick Colors:**
   - **Strict Rule:** NEVER use hardcoded Tailwind color scales (like `bg-gray-100`, `text-blue-600`, or `border-slate-200`) for primary UI scaffolding. 
   - **Semantic Variables:** We strictly use CSS variables for automatic Light/Dark mode switching. Use the following:
     - `bg-background` & `text-foreground`: For main app backgrounds and primary text.
     - `bg-card` & `text-card-foreground`: For surfaces, containers, dialogs, and cards.
     - `bg-primary` & `text-primary-foreground`: For primary calls-to-action (CTAs), active states, and emphasis buttons.
     - `bg-secondary` & `text-secondary-foreground`: For less prominent buttons or badges.
     - `bg-muted` & `text-muted-foreground`: For subtle backgrounds (like table headers or secondary areas) and secondary/help text.
     - `border-border`: For borders and dividers.
     - `ring-ring`: For focus rings on inputs and buttons.

3. **Loaders, Overlays & States:**
   - Always implement loading states for async operations. Unhandled transitions cause layout shifts and poor UX.
   - **Inline/Small Loaders:** Use `@/components/ui/loader.tsx`. Perfect for placing inside a `<Button>` while a form is submitting.
   - **Page-Level / Heavy Transitions:** Use `@/components/ui/page-loader.tsx`. For domain-specific heavy tasks (like waiting for LLM extraction), use dedicated overlays like `@/components/ats/LoadingOverlay.tsx`.
   - **Skeleton States:** If building lists or cards that load progressively, use Tailwind's `animate-pulse` combined with `bg-muted` to create skeleton placeholders (e.g., `<div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>`).

4. **Typography & Layout Spacing:**
   - **Mobile First:** Start with mobile styles (e.g., `flex-col`, `gap-4`).
   - **Scale Up:** Use breakpoints (`md:`, `lg:`) to enhance the layout for desktop (e.g., `md:flex-row`, `md:gap-8`).
   - **Typography:** Use Tailwind typography utilities gracefully.
     - Page Headers: `text-3xl md:text-4xl font-bold tracking-tight`.
     - Section Headers: `text-xl font-semibold`.
     - Subtitles/Descriptions: `text-sm text-muted-foreground`.

5. **Visuals & Iconography:**
   - **Icons:** STRICTLY use `lucide-react`. Never use text-based emojis (🚫 🚀, ✨). Instead, import `<Sparkles className="h-4 w-4" />` from `lucide-react`.
   - **Classes:** Always use the `cn()` utility from `@/lib/utils` when writing components that accept `className` props. This securely merges custom classes with defaults (handling `clsx` and `tailwind-merge`).

### Verification & Testing
*Run these commands from `frontend/` to verify your changes.*

- **Type Check:** `bun x tsc --noEmit` (Run this after every significant TS change.)
- **Lint:** `bun run lint`
- **Build: (Recommended)** `bun run build`

### API Routes & Backend Interop
The Next.js App Router API (`app/api/...`) acts as the primary gateway and is logically grouped using folder groups:

1. **Authentication:**
   - Handled via **NextAuth.js** (`next-auth`).
   - Every protected API route MUST verify the session using `const session = await getServerSession(authOptions);`.
   - Never trust client-side data for user identity; always extract the user from the `session`.

2. **`(backend-interface)` - The Proxy/BFF Layer:**
   - **Purpose:** Acts as a bridge between the Next.js frontend and the FastAPI python backend.
   - **Workflow:** 
     1. Receives the request from the client UI.
     2. Authenticates the user via NextAuth.
     3. (Optional) Fetches required entity data from the database using Prisma (e.g., retrieving a saved resume's `rawText`).
     4. Constructs the payload (JSON or `FormData`) and makes a `fetch()` call to `process.env.BACKEND_URL` (the FastAPI backend).
     5. Handles errors, sanitizes responses (e.g., removing HTML tags), and returns a clean JSON response to the client.

3. **`(db)` - Direct Database Operations:**
   - **Purpose:** Handles standard CRUD operations that do not require complex LLM/Python processing.
   - **Workflow:** Authenticate user -> Validate request -> Query/Mutate PostgreSQL via **Prisma** (`import { prisma } from "@/lib/prisma"`) -> Return JSON response.
   - Example: Fetching user resumes, renaming a resume, or deleting records.

---

## Backend (`backend/`)

### Dependency Management
- **Tool:** uv (`uv`)
- **Lockfile:** `uv.lock`
- **Install:** `cd backend && uv sync`
- **Add Dependency:** `cd backend && uv add <package>`

### Backend Architecture & Design

The backend is built with **FastAPI** and strictly follows a layered, modular architecture. All application code lives inside the `backend/app/` directory.

1. **`app/routes/` (Controllers)**
   - **Purpose:** FastAPI `APIRouter` instances that define the API endpoints.
   - **Rules:** Keep routes **thin**. They should only handle HTTP request parsing, dependency injection, and returning the HTTP response. All business logic must be delegated to services.
   - **Example:** `ats.py`, `interview.py`, `cold_mail.py`.

2. **`app/services/` (Business Logic)**
   - **Purpose:** Where the actual work happens. Contains complex logic, LLM calls, and orchestrations.
   - **Workflows/Agents:** Complex state machines and agentic workflows (like LangGraph) live in sub-directories within services (e.g., `app/services/ats_evaluator/graph.py`, `app/services/interview/graph.py`).
   - **Helpers:** Shared service utilities (e.g., `llm_helpers.py`, `data_processor.py`).

3. **`app/models/` (Validation & Schemas)**
   - **Purpose:** Pydantic models for request (`request.py`) and response (`response.py`) validation.
   - **Structure:** Grouped strictly by feature domain (e.g., `app/models/ats_evaluator/`, `app/models/cold_mail/`).
   - **Rules:** Always use strict type hints (Python 3.13+) and Pydantic validators.

4. **`app/data/prompt/` (Prompts & Templates)**
   - **Purpose:** Centralized location for all LLM prompts and instructions.
   - **Rules:** Do NOT hardcode large prompt strings directly in the services. Define them here as text variables or functions returning formatted strings (e.g., `ats_analysis.py`, `interview_question.py`).

5. **`app/core/` (Infrastructure)**
   - **Purpose:** Application setup, configuration, and foundational tools.
   - **Contents:** `config.py` (environment variables), `deps.py` (FastAPI dependencies), `llm.py` (LLM client initialization), `exceptions.py`.

6. **`app/agents/` (Standalone Agents)**
   - **Purpose:** Isolated, specialized agents or tools (e.g., `websearch_agent.py`, `github_agent.py`) that can be imported and utilized by the services.

### Code Style
- **Async First:** The codebase is heavily async. Use `async def` and `await` for all I/O bound operations (DB, LLM, network).
- **Type Hints:** Every function and every thing you do should have proper type tints, also prefer always to use `PEP 585` convension which prefers `list` over `List from typing`
- **Formatting:** Adhere to PEP 8 standards. Use strict typing everywhere.
- **NO Emojis:** Do not use emojis in strings or comments.

### Verification & Testing
*Run these commands from `backend/` to verify your changes.*

- **Syntax Check (Fast):** `uv run python -m py_compile <path_to_file>`
- **Run Tests:** `uv run python test.py` (Manual asyncio scripts; do not use pytest unless explicitly set up).

### Note:
- Please ignore the `server.py` file; it is a legacy file that is unrelated and should not be modified.

---

## Database (PostgreSQL)
It is situated in the next app and controlled using Prisma and the Next.js API routes.
- **Database:** PostgreSQL is used for storing data.
- **Prisma:** Prisma is used for database ORM.
- **API Routes:** Next.js API routes are used for database operations.

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
