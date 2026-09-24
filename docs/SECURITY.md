# Security Architecture & Policies

Security and confidentiality are foundational to ReleaseGuard AI. Because the platform interacts directly with source code, CI/CD pipelines, and internal defect trackers, rigorous safeguards must be enforced at every layer.

---

## Core Security Principles

### 1. Zero Secrets in Version Control
* **Policy**: Hard-coded secrets, API tokens, database passwords, private keys, and webhooks are strictly forbidden from being committed into Git repositories.
* **Enforcement**:
  * Git ignore policies (`.gitignore`) block `.env*` files with the sole exception of sanitized `.env.example` templates.
  * Pre-commit hooks and CI security linters (e.g. Gitleaks / TruffleHog) will scan commits before merge.
  * All runtime secrets are injected dynamically via environment variables or cloud secret managers (e.g., AWS Secrets Manager, HashiCorp Vault).

### 2. Strict Environment-Based Configuration
* Development, staging, and production environments are strictly separated.
* Configuration is managed via validated environment variables using type-safe schemas.
* No fallback defaults to insecure credentials in production builds.

### 3. Multi-Tenant Isolation
* **Logical & Data Isolation**: Every customer workspace and organization is isolated using tenant identifiers (`tenant_id`/`org_id`) indexed across all database queries.
* **Row-Level Security (RLS)**: Enforced at the PostgreSQL level for tenant-owned tables to prevent cross-tenant data leakage.
* **Queue Isolation**: Asynchronous worker jobs are segregated by tenant context, ensuring worker sandboxes never share cross-tenant state.

### 4. Least-Privilege Integrations
* **GitHub Integration**:
  * Connected via a dedicated GitHub App rather than broad personal access tokens (PATs).
  * Requests only minimal required permissions (e.g., `pull_requests:read`, `checks:write`, `contents:read`).
* **Jira / Issue Tracker Integration**:
  * Scoped solely to designated project keys and issue-creation permissions.
* **Database & Cache Permissions**:
  * Application connection strings use unprivileged database roles without superuser rights.

### 5. Human Approval for Destructive or Production-Gating Actions
* Autonomous agents can analyze, recommend, and draft artifacts, but **cannot** perform irreversible operations without explicit human authorization:
  * Merging pull requests.
  * Overriding failed release gates.
  * Executing production rollbacks.
  * Deleting projects or historical audit trails.
* Releases require explicit human-in-the-loop sign-off.

### 6. Comprehensive Audit Logging
* All security-critical events are recorded in append-only, tamper-evident audit logs:
  * Authentication attempts and credential refreshes.
  * Changes to repository access or webhook configurations.
  * Release gate overrides and approval decisions.
  * Agent execution traces and prompt/response metadata.
* Audit logs include timestamp, actor ID, IP address, user-agent, target resource, and action outcome.

### 7. Code Privacy & PII Protection
* **Customer Code Privacy**:
  * Customer source code is analyzed in transient memory or sandboxed worker environments and is not used to train third-party foundation models.
  * Prompts sent to external LLMs strip identified secrets, database connection strings, and sensitive credentials.
* **PII Minimization**:
  * Defect evidence (DOM snapshots, network logs, HAR traces) automatically masks passwords, session cookies, Authorization headers, and credit card numbers prior to storage.
