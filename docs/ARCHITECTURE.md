# System Architecture Document

## Overview

ReleaseGuard AI is built on a modular monorepo architecture designed for high scalability, separation of concerns, and rapid extensibility. The system decouples interactive user interfaces, API orchestration, compute-heavy analysis engines, and asynchronous worker queues.

---

## Monorepo Layout

The repository leverages **npm workspaces** with a shared TypeScript root configuration:

```
releaseguard-ai/
├── apps/
│   ├── web/                    # Next.js frontend (App Router, Tailwind CSS, shadcn/ui)
│   └── api/                    # NestJS REST & WebSocket API gateway
│
├── packages/
│   ├── shared/                 # Universal TypeScript types, DTOs, schemas & constants
│   ├── database/               # Database client, ORM entities, migrations & seeds
│   ├── ai/                     # LLM orchestration, prompt templates & agent interfaces
│   ├── github/                 # GitHub Webhooks, Octokit integration & git utilities
│   ├── risk-engine/            # Deterministic & probabilistic risk scoring algorithms
│   └── test-engine/            # Test selector algorithms, runner interfaces & coverage parsers
│
├── workers/
│   ├── repository-worker/      # Asynchronous worker for git cloning, AST parsing & indexing
│   └── test-worker/            # Isolated test execution worker (Playwright, Jest, etc.)
│
├── docs/                       # Architectural blueprints, PRD, security policies & API specs
├── docker-compose.yml          # Container configuration for local databases & infrastructure
├── tsconfig.base.json          # Root TypeScript configuration extended across workspaces
└── package.json                # Monorepo workspaces manifest
```

---

## Component Architecture

### 1. Frontend (`apps/web`)
* **Framework**: Next.js (React 18/19, App Router) with TypeScript.
* **Styling**: Tailwind CSS with custom design tokens adhering to high-density B2B developer tool standards (low glare, high contrast, clean typography, zero synthetic AI gradients).
* **Navigation & Shell**: Persistent sidebar layout with quick access to `/dashboard`, `/projects`, and `/settings`.
* **State & Networking**: Server Components for static/semi-static data, React Query / SWR for dynamic client state and real-time status feeds.
* **Component Architecture**: Built according to shadcn/ui principles (reusable, accessible UI primitives with Radix UI fundamentals).

### 2. Backend API Gateway (`apps/api`)
* **Framework**: NestJS (TypeScript) utilizing modular dependency injection.
* **Core Responsibilities**:
  * Ingesting incoming GitHub Webhooks (pull request opened, synchronized, merged).
  * Exposing REST endpoints for the dashboard and third-party integrations.
  * Coordinating task dispatch to Redis BullMQ queues.
  * Serving real-time execution status to the frontend via WebSockets/SSE.
* **Modules**:
  * `HealthModule`: High-frequency liveness and readiness probes (`/health`).
  * `ProjectsModule`: Repository and organization configuration management.
  * `DatabaseModule`: Connection pooling and transaction management for PostgreSQL.
  * `RedisModule`: Connection handling and client management for Redis.

### 3. Database Layer (PostgreSQL)
* **Engine**: PostgreSQL 16+.
* **Purpose**: Primary relational datastore providing ACID guarantees for tenants, organizations, user accounts, repository settings, pull request metadata, risk assessments, test execution runs, and defect evidence records.
* **Access Pattern**: Managed via pooled connections with connection health monitoring and prepared statements.
* **Persistence**: Local development uses Docker named volumes (`postgres_data`).

### 4. Cache & Queue Layer (Redis)
* **Engine**: Redis 7+.
* **Purpose**:
  * Job Queues: Powering asynchronous worker pipelines (repository analysis, test execution, evidence processing).
  * Caching: Storing AST dependency graphs, test execution history, and short-lived session states.
  * Pub/Sub: Real-time broadcast of live test execution steps and agent reasoning traces.
* **Persistence**: Local development uses append-only files (AOF) with named Docker volumes (`redis_data`).

---

## Future Workers

Background tasks requiring heavy CPU, isolated filesystem operations, or long-running processes are partitioned into dedicated worker processes:

### 1. Repository Worker (`workers/repository-worker`)
* **Trigger**: Triggered whenever a pull request is opened or updated.
* **Duties**:
  * Shallow or targeted git fetch of changed commits.
  * Incremental AST parsing (TypeScript, JavaScript, Python, Go, Java).
  * Constructing file-to-file and function-to-function dependency matrices.
  * Caching code diff representations in Redis/Object Storage.

### 2. Test Worker (`workers/test-worker`)
* **Trigger**: Triggered by the API after Test Selection Agent defines the target test subset.
* **Duties**:
  * Executing selected regression tests in isolated sandboxes.
  * Capturing structured test output (JUnit XML, TAP, JSON).
  * Recording test artifacts: HAR files, video recordings, screenshots, and stdout/stderr.
  * Streaming live status updates back to Redis Pub/Sub.

---

## Future AI Agents

The intelligence layer (`packages/ai`) operates as a pipeline of cooperative, domain-specific agents:

```
┌────────────────────────────────────────────────────────┐
│                   GitHub Pull Request                  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │ Change Intelligence Agent │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Impact Analysis Agent   │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │        Risk Agent         │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Test Selection Agent    │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Test Execution Agent    │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │Failure Investigation Agent│
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  Bug Intelligence Agent   │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │    Self-Healing Agent     │
              └───────────────────────────┘
```

Detailed definitions, inputs, prompts, and outputs for each agent are documented in [AGENTS.md](file:///d:/Project/ReleaseGuard%20AI/docs/AGENTS.md).

---

## Change Intelligence Architecture

The **Change Intelligence Engine** (`packages/change-intelligence`) processes software changes using a **deterministic-first, AI-reasoned, schema-validated** architecture:

```
                  Raw Change Input (ChangeAnalysisInput)
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │       Pre-processing Layer      │
                  │ - Truncation guard (<150k char) │
                  │ - File change categorization    │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Deterministic Analyzers      │
                  │ - File classification (heurs.)  │
                  │ - Diff stats & symbol changes   │
                  │ - API routes (Express, Nest, Next)
                  │ - Dependency updates (npm, etc.)│
                  │ - Candidate test locator        │
                  └────────────────┬────────────────┘
                                   │
                     Structured Deterministic Context
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │   AI Provider Layer (packages/ai)│
                  │ - Google Gemini (gemini-2.5-flash)
                  │ - Mock Provider (offline/testing)│
                  │ - Strict JSON schema adherence  │
                  │ - Self-correcting retry loop    │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │      Fact Merging & Guard       │
                  │ - Injects deterministic APIs    │
                  │ - Injects candidate tests       │
                  │ - Validates evidence citations  │
                  │ - Enforces Zod Result Schema    │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Persistence & Observability  │
                  │ - AgentRun persisted (Postgres) │
                  │ - Token usage and latency logged│
                  │ - Returned via REST & Web UI    │
                  └─────────────────────────────────┘
```

### Key Principles

1. **Deterministic Analysis First**: AST and regex patterns extract file types, lines changed, endpoints, and dependency modifications prior to LLM invocation, conserving tokens and preventing hallucinations.
2. **Explainable AI with Evidence Chains**: Every risk indicator emitted by the agent must cite concrete evidence from the input (e.g., file paths, route definitions, symbol names). Generic claims without evidence are strictly rejected.
3. **Pluggable Model Architecture**: Provider abstraction (`LLMProvider`) isolates model vendors (Gemini, OpenAI, Anthropic, local) behind an interface that supports structured outputs and error correction.
4. **Resilient Data Merging**: Deterministically extracted endpoints and candidate tests are guaranteed to appear in the final `ChangeAnalysisResult` through automated fact merging.
