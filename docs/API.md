# ReleaseGuard AI - API Documentation

## Overview
This document details the public and internal REST API endpoints available in the ReleaseGuard AI API service (`apps/api`).

For the current foundation milestone, only the baseline system health endpoint is exposed. Additional business endpoints (Projects, Webhooks, Risk Evaluations, Test Runs) will be documented as their respective modules are implemented.

---

## System Endpoints

### 1. System Health Check

Returns the operational status of the API service and verifies that the process is healthy and ready to accept requests.

* **Endpoint**: `/health`
* **HTTP Method**: `GET`
* **Authentication**: None (Public)
* **Headers**: None required

#### Success Response

* **Status Code**: `200 OK`
* **Content-Type**: `application/json`

```json
{
  "status": "ok",
  "service": "releaseguard-api"
}
```

#### Response Attributes

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | string | Health indicator of the service (`"ok"` or `"error"`). |
| `service` | string | Identifier of the reporting microservice (`"releaseguard-api"`). |

#### Example Usage

```bash
curl -X GET http://localhost:4000/health
```

---

## Change Intelligence Endpoints

### 2. Trigger Change Analysis

Submits a software change (repository context, changed files, patches/diffs) for deterministic preprocessing and structured LLM change analysis. Works provider-independently without requiring active GitHub integration.

* **Endpoint**: `/analysis/change`
* **HTTP Method**: `POST`
* **Authentication**: None (Developer / Internal for Prompt 3; Tenant JWT in future)
* **Headers**: `Content-Type: application/json`

#### Request Body (`ChangeAnalysisInput`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `repository` | string | Yes | Name or identifier of the repository (e.g. `"demo-ecommerce"`). |
| `repositoryUrl` | string | No | Optional URL to remote repository. |
| `baseBranch` | string | Yes | Target base branch (e.g. `"main"`). |
| `targetBranch` | string | Yes | Feature or topic branch (e.g. `"feature/payment-update"`). |
| `commitSha` | string | No | Specific commit SHA if applicable. |
| `pullRequestNumber` | number | No | Optional Pull Request number. |
| `changedFiles` | array | Yes | Array of changed file records with path, status, additions, deletions, and patch. |
| `repositoryMetadata` | object | No | Optional context such as primary language or framework. |
| `existingTests` | array | No | Optional list of known existing test file paths. |

#### Example Request

```json
{
  "repository": "demo-ecommerce",
  "baseBranch": "main",
  "targetBranch": "feature/payment-update",
  "commitSha": "abc12345",
  "changedFiles": [
    {
      "path": "src/payment/controller.ts",
      "status": "modified",
      "additions": 15,
      "deletions": 3,
      "patch": "@@ -12,3 +12,15 @@\n+  @Post('/charge')\n+  async chargePayment() {}"
    },
    {
      "path": "src/payment/service.ts",
      "status": "modified",
      "additions": 42,
      "deletions": 8,
      "patch": "@@ -40,4 +40,12 @@\n+  async processStripe() {}"
    }
  ]
}
```

#### Success Response

* **Status Code**: `200 OK`
* **Content-Type**: `application/json`

```json
{
  "analysisId": "e30e1374-2e90-4e31-897b-40292701b22e",
  "status": "COMPLETED",
  "result": {
    "summary": "Modified payment controller and service to add new charge endpoint and Stripe processing.",
    "changeType": "API",
    "changedAreas": [
      {
        "name": "payment",
        "type": "service",
        "impact": "HIGH"
      }
    ],
    "affectedComponents": [
      "PaymentController",
      "PaymentService"
    ],
    "affectedApis": [
      {
        "method": "POST",
        "path": "/charge",
        "sourceFile": "src/payment/controller.ts",
        "confidence": 0.95
      }
    ],
    "riskIndicators": [
      {
        "type": "API_CHANGE",
        "description": "Payment endpoint POST /charge added or updated in payment controller.",
        "evidence": [
          "src/payment/controller.ts",
          "POST /charge"
        ],
        "confidence": 0.95
      }
    ],
    "testImplications": [
      {
        "changedFile": "src/payment/service.ts",
        "candidateTests": [
          "src/payment/service.test.ts",
          "src/payment/service.spec.ts"
        ]
      }
    ],
    "confidence": 0.94,
    "unknowns": []
  }
}
```

---

### 3. Get Change Analysis by ID

Retrieves an existing agent run by its unique identifier, including status, timestamps, token usage, and structured results.

* **Endpoint**: `/analysis/change/:id`
* **HTTP Method**: `GET`
* **Authentication**: None
* **URL Parameters**:
  * `id`: UUID of the AgentRun.

#### Success Response

* **Status Code**: `200 OK`
* **Content-Type**: `application/json`

```json
{
  "id": "e30e1374-2e90-4e31-897b-40292701b22e",
  "type": "CHANGE_ANALYSIS",
  "status": "COMPLETED",
  "startedAt": "2026-09-24T05:10:00.000Z",
  "completedAt": "2026-09-24T05:10:02.150Z",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "tokensUsed": {
    "promptTokens": 850,
    "completionTokens": 320,
    "totalTokens": 1170
  },
  "result": { ... },
  "error": null
}
```

#### Error Response

* **Status Code**: `404 Not Found` if the analysis ID does not exist.
