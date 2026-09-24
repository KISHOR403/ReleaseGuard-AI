# Autonomous Agent Architecture

ReleaseGuard AI organizes its quality engineering intelligence into eight specialized, decoupled agents. Each agent operates with defined inputs, strict schemas, verifiable reasoning steps, and structured outputs.

---

## 1. Change Intelligence Agent

### Role
Analyzes incoming pull request diffs, commit histories, and code structures to extract semantic code intent.

### Responsibilities
* Parses unified diffs and AST changes across modified files.
* Distinguishes between cosmetic changes (formatting, comments), non-breaking changes, and semantic changes (logic modifications, database migrations, configuration adjustments).
* Identifies newly introduced functions, modified parameter lists, and deleted symbols.

### Inputs
* Git commit range / PR unified diff.
* Repository AST tree.
* PR title and description.

### Outputs
* Structured change summary (files touched, symbols added/modified/removed, semantic categories).

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
