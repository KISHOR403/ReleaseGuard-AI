# ReleaseGuard AI

> **AI-powered release risk and autonomous regression platform.**

ReleaseGuard AI is an enterprise Quality Engineering (QE) platform that empowers engineering teams to ship software with high velocity and total release confidence. By analyzing incoming pull requests at the Abstract Syntax Tree (AST) level, ReleaseGuard AI quantifies release risk, maps component blast radiuses, intelligently selects only the necessary regression tests, autonomously diagnoses test failures, gathers forensic defect evidence, and streamlines human-approved release governance.

---

## Architecture Overview

ReleaseGuard AI is structured as a modular TypeScript monorepo using **npm workspaces**:

* **Frontend (`apps/web`)**: Next.js 14 (App Router) with Tailwind CSS, built with a high-density, accessible B2B SaaS design system.
* **Backend API Gateway (`apps/api`)**: NestJS application managing REST endpoints, database connection pooling, Redis connectivity, and health monitoring.
* **Domain Packages (`packages/*`)**:
  * `shared`: Shared TypeScript types, interfaces (e.g. `HealthStatus`), and contracts.
  * `database`: Relational database client and schemas (PostgreSQL).
  * `ai`: Autonomous QE agent workflows and orchestration.
  * `github`: GitHub App webhooks and Octokit client integration.
  * `risk-engine`: Quantitative multi-factor risk heuristics and scoring algorithms.
  * `test-engine`: Intelligent regression test selection algorithms and coverage mapping.
* **Background Workers (`workers/*`)**:
  * `repository-worker`: Asynchronous git cloning, commit parsing, and AST dependency indexing.
  * `test-worker`: Sandboxed test execution and forensic artifact capture.
* **Local Infrastructure (`docker-compose.yml`)**:
  * PostgreSQL 16 (persisted via Docker volume).
  * Redis 7 (persisted via Docker volume, queue and caching broker).

---

## Tech Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | NestJS 10, TypeScript, RxJS, node-postgres (`pg`), `ioredis` |
| **Databases** | PostgreSQL 16 (Relational DB), Redis 7 (Cache & Queues) |
| **Infrastructure** | Docker, Docker Compose |
| **Monorepo** | npm workspaces, TypeScript Project References |

---

## Repository Structure

```
releaseguard-ai/
├── apps/
│   ├── web/                    # Next.js web console (port 3000)
│   └── api/                    # NestJS API gateway (port 4000)
│
├── packages/
│   ├── shared/                 # Shared interfaces (HealthStatus, DTOs)
│   ├── database/               # Database client and entities
│   ├── ai/                     # AI agents and LLM orchestration
│   ├── github/                 # GitHub App integration
│   ├── risk-engine/            # Risk scoring algorithms
│   └── test-engine/            # Test selector algorithms
│
├── workers/
│   ├── repository-worker/      # Git parsing and AST worker
│   └── test-worker/            # Isolated test runner worker
│
├── docs/
│   ├── PRD.md                  # Product Requirements Document
│   ├── ARCHITECTURE.md         # Detailed System Architecture
│   ├── AGENTS.md               # 8 Autonomous QE Agent Specifications
│   ├── SECURITY.md             # Security Policies & Tenant Isolation
│   └── API.md                  # REST API Specifications
│
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules (blocks secrets & build outputs)
├── docker-compose.yml          # PostgreSQL & Redis container definitions
├── package.json                # Root monorepo manifest and npm scripts
├── tsconfig.base.json          # Root TypeScript configuration
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites

* **Node.js**: `v20.0.0` or higher (verified on `v22.x`)
* **npm**: `v10.0.0` or higher
* **Docker Desktop**: Running with Docker Compose support

---

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd "ReleaseGuard AI"

# Install all monorepo dependencies across all workspaces
npm install
```

---

### Step 2: Configure Environment Variables

Create your local `.env` file by copying `.env.example`:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

The default values in `.env.example` are pre-configured for local Docker development:

```ini
# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=releaseguard
DATABASE_USER=releaseguard
DATABASE_PASSWORD=change_me

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
PORT=4000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Security Note**: Never commit `.env` or production credentials to Git. Review [SECURITY.md](file:///d:/Project/ReleaseGuard%20AI/docs/SECURITY.md) for details.

---

### Step 3: Start Infrastructure (PostgreSQL & Redis)

Start PostgreSQL and Redis in the background using Docker Compose:

```bash
# Start Docker services
npm run docker:up
# Or: docker compose up -d

# Verify containers are healthy
docker compose ps
```

To stop containers when needed:

```bash
npm run docker:down
# Or: docker compose down
```

---

### Step 4: Run the Development Servers

You can launch both the API and Web applications concurrently or individually:

#### Terminal 1 (API Server):
```bash
npm run dev:api
# Or: npm --workspace=apps/api run start:dev
```
The NestJS API starts on `http://localhost:4000`. On boot, it automatically verifies connectivity to both PostgreSQL and Redis.

#### Terminal 2 (Web Console):
```bash
npm run dev:web
# Or: npm --workspace=apps/web run dev
```
The Next.js web application starts on `http://localhost:3000`.

---

## Health Checks & Verification

### 1. API Health Check

Query the system health endpoint:

```bash
curl http://localhost:4000/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "service": "releaseguard-api"
}
```

### 2. Frontend Console

Open `http://localhost:3000/dashboard` in your browser.
* Verify the title displays **ReleaseGuard AI** and subtitle **AI-powered release risk and autonomous regression platform.**
* The live header pill will detect the running API and display: `API: releaseguard-api`.
* Navigate between `/dashboard`, `/projects`, and `/settings`.

### 3. TypeScript & Lint Verification

Run the typecheck command to verify strict TypeScript adherence:

```bash
npm run typecheck
```

---

## Development Roadmap

* [x] **Milestone 1 (Current)**: Core monorepo foundation, Docker compose (PostgreSQL & Redis), NestJS API gateway, Next.js dashboard shell, shared types, and comprehensive architecture documentation.
* [ ] **Milestone 2**: GitHub App integration, webhook ingestion, repository connection flows, and `repository-worker` setup.
* [ ] **Milestone 3**: Change Intelligence & Impact Analysis agents, AST dependency tree generation, and Risk Engine heuristics.
* [ ] **Milestone 4**: Test Engine, intelligent regression selection algorithms, Playwright runner execution via `test-worker`.
* [ ] **Milestone 5**: Failure Investigation Agent, forensic evidence capture (HAR/video/DOM), and Jira bug creation.
* [ ] **Milestone 6**: Self-Healing Agent and human-in-the-loop release approval gates.
