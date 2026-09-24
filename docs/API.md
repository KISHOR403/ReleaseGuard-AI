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
