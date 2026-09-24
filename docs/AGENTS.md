# Autonomous Agent Architecture

ReleaseGuard AI organizes its quality engineering intelligence into eight specialized, decoupled agents. Each agent operates with defined inputs, strict schemas, verifiable reasoning steps, and structured outputs.

---

## 1. Change Intelligence Agent

### Purpose
The Change Intelligence Agent is the primary perceptual layer of ReleaseGuard AI. Its mission is to analyze a software change and produce a structured, deterministic, and evidence-grounded understanding of what changed, which components and APIs are affected, what risk indicators exist, and what candidate regression tests are implicated.

It operates independently of any specific Git hosting provider (GitHub, GitLab, Bitbucket, local git CLI) by utilizing an abstract, provider-agnostic input contract.

### Inputs (`ChangeAnalysisInput`)
* `repository`: Repository identifier or project name.
* `repositoryUrl`: Optional URL to the remote repository.
* `baseBranch`: Target base branch (default: `main`).
* `targetBranch`: Feature branch under analysis.
* `commitSha`: Optional commit hash.
* `pullRequestNumber`: Optional pull request number.
* `changedFiles`: Array of changed files:
  * `path`: Relative file path.
  * `status`: `added` | `modified` | `deleted` | `renamed`.
  * `additions`: Number of lines added.
  * `deletions`: Number of lines deleted.
  * `patch`: Raw unified diff chunk.
* `repositoryMetadata`: Optional configuration and package manifest metadata.
* `existingTests`: Optional inventory of known test suite files.

### Outputs (`ChangeAnalysisResult`)
* `summary`: Concise, factual explanation of the change.
* `changeType`: Classified category (`FEATURE`, `BUG_FIX`, `REFACTOR`, `CONFIGURATION`, `DEPENDENCY`, `DATABASE`, `API`, `SECURITY`, `TEST`, `DOCUMENTATION`, `UNKNOWN`).
* `changedAreas`: Array of impacted domains with name, type (e.g. `service`, `controller`), and `impact` level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `UNKNOWN`).
* `affectedComponents`: List of identified code components, classes, or modules.
* `affectedApis`: Array of detected API endpoints (`method`, `path`, `sourceFile`, `confidence`).
* `riskIndicators`: Array of concrete risk factors (`type`, `description`, `evidence`, `confidence`).
* `testImplications`: Array of candidate regression tests for modified source files.
* `confidence`: Quantitative assessment confidence score (0.0 to 1.0).
* `unknowns`: List of ambiguous, truncated, or unresolvable items.

### Tools & Deterministic Analyzers
The agent enforces a **Deterministic Analysis First** workflow:
1. **`FileAnalyzer`**: Heuristically classifies files by language, extension, and functional category (Frontend React/pages/hooks/styles, Backend controllers/routes/services/repositories/models, Testing unit/integration/e2e/fixtures, Infrastructure Docker/K8s/Terraform/CI-CD/configs, Database migrations/schemas/seeds, and Documentation).
2. **`DiffAnalyzer`**: Extracts additions, deletions, changed lines, added/removed functions, modified imports/exports, environment variables, and dependency references.
3. **`ApiAnalyzer`**: Identifies API route decorators and patterns across Express (`app.get`, `router.post`), NestJS (`@Controller`, `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`), and Next.js App Router handlers.
4. **`DependencyAnalyzer`**: Inspects package manifests (`package.json`, lockfiles, `requirements.txt`) and flags major upgrades, dependency removals, or sensitive package additions.
5. **`CandidateTestDetector`**: Employs naming and directory conventions to suggest candidate unit/integration tests for each touched non-test file.
6. **`ChangePreprocessor`**: Aggregates deterministic extractions and enforces context truncation safety (flagging truncations in `unknowns`).

### Evidence Requirements & Explainability
Every risk indicator **must** include an `evidence` array referencing concrete source files, line diffs, or API endpoints. The system strictly forbids ungrounded assertions (e.g., "AI thinks this is risky"). All explanations must state technical facts (e.g., "Payment API route signature changed in src/payment/controller.ts: POST /api/v1/payments/charge").

### Failure Handling & Resilience
1. **Schema Validation**: All LLM outputs are validated against a strict Zod schema (`ChangeAnalysisResultSchema`).
2. **Auto-Correction Retry**: If output is malformed JSON or schema-invalid, the agent prompts the model with explicit schema error feedback up to `maxRetries` (default: 2).
3. **AgentRun Lifecycle**: Every execution is tracked in PostgreSQL via `AgentRun` (`RUNNING` → `COMPLETED` or `FAILED`), preserving sanitized error traces and token metrics without leaking secrets.
4. **Provider-Independent Fallback**: If an LLM provider is unconfigured, a descriptive configuration error is thrown while the deterministic analysis pipeline remains independently testable.

---

## 2. Impact Analysis Agent

### Role
Calculates the transitive blast radius of the code changes identified by the Change Intelligence Agent.

### Responsibilities
* Traverses the code dependency graph (import statements, API route mappings, RPC definitions, schema references).
* Maps impacted downstream consumers, services, and shared libraries.
* Detects breaking API contract changes or database schema incompatibilities.

### Inputs
* Semantic change summary from Agent 1.
* Project dependency graph and architecture map.

### Outputs
* Blast radius report: list of impacted files, API routes, user-facing flows, and downstream consumers.

---

## 3. Risk Agent

### Role
Evaluates the release risk score (0 to 100) for the PR based on quantitative heuristics and AI reasoning.

### Responsibilities
* Computes weighted multi-factor risk scores:
  * **Code Churn Factor**: Lines added/deleted, complexity of diff.
  * **Critical Path Factor**: Whether core business logic (payments, auth, checkout) was modified.
  * **Blast Radius Factor**: Number of downstream dependencies impacted.
  * **Historical Volatility Factor**: Historical defect density and commit frequency of modified files.
* Classifies risk into **LOW**, **MEDIUM**, **HIGH**, or **CRITICAL**.

### Inputs
* Blast radius report.
* Git repository historical statistics.
* PR metadata.

### Outputs
* Risk score, risk classification, key risk drivers, and recommended mitigation actions.

---

## 4. Test Selection Agent

### Role
Determines the minimal sufficient subset of automated tests (unit, integration, E2E) required to validate the PR.

### Responsibilities
* Correlates impacted components with existing test suites using code coverage maps and historical test-to-code traces.
* Eliminates redundant and irrelevant test cases from the execution queue.
* Prioritizes test execution order (fast failure detection first).

### Inputs
* Blast radius report.
* Available test suite inventory and metadata.
* Historical test flakiness and execution duration metrics.

### Outputs
* Optimized execution manifest: specific test files, test suites, and individual test cases to execute.

---

## 5. Test Execution Agent

### Role
Orchestrates and monitors distributed test execution across runner workers.

### Responsibilities
* Coordinates job dispatch to worker pools (`workers/test-worker`).
* Monitors runner health, timeouts, and resource utilization.
* Collects raw test results, logs, traces, and metrics in real time.

### Inputs
* Execution manifest from Agent 4.
* Worker pool availability.

### Outputs
* Raw test run execution results (passed, failed, skipped, duration, logs).

---

## 6. Failure Investigation Agent

### Role
Performs automated root cause analysis on failed tests to distinguish between real regressions and environmental/flaky failures.

### Responsibilities
* Analyzes stack traces, DOM snapshots, network HAR recordings, and application server logs.
* Cross-references failure signatures with recent master branch runs to identify pre-existing flakes.
* Pinpoints the exact commit and code line responsible for the test failure.

### Inputs
* Test run execution results and artifacts.
* PR diff and commit history.
* Historical test reliability records.

### Outputs
* Failure classification (Genuine Defect vs. Flaky Test vs. Infrastructure Error).
* Pinpointed root-cause explanation with suspect code locations.

---

## 7. Bug Intelligence Agent

### Role
Synthesizes failure investigation findings into structured, reproducible defect reports ready for issue trackers.

### Responsibilities
* Generates clear, concise bug descriptions with reproduction steps.
* Packages forensic evidence (video traces, network requests, console errors, stack traces).
* Formulates integration payloads for Jira, GitHub Issues, or Linear with appropriate severity and component tagging.

### Inputs
* Root cause analysis report from Agent 6.
* Execution artifacts (screenshots, traces, logs).
* Issue tracker configuration.

### Outputs
* Structured bug report payload with complete forensic evidence attachments.

---

## 8. Self-Healing Agent

### Role
Suggests or generates automated fixes for selector drifts, broken test assertions, or minor implementation bugs.

### Responsibilities
* Detects when a test failure is caused by an intended UI/copy change (e.g. updated button text or changed CSS selector).
* Proposes updated Playwright/Cypress locator definitions that match the new DOM structure.
* Creates draft PRs or suggested code patches with human-in-the-loop review.

### Inputs
* Failure investigation report.
* Current DOM snapshot and previous passing DOM snapshot.
* Test source code.

### Outputs
* Proposed locator/assertion patch diff with confidence score for developer approval.
