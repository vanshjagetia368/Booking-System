# API Specification (v1)

## Base Namespace & Convention

All backend API routes are versioned and mounted under the namespace:

```text
/api/v1
```

The frontend client communicates with this backend using the base URL configured in `client/.env` (e.g., `VITE_API_BASE_URL=http://localhost:5000/api/v1`).

---

## Standard Response Convention

All endpoints follow a consistent JSON response structure:

### Successful Responses
```json
{
  "success": true,
  "message": "Human-readable status summary",
  "data": {
    "key": "value"
  },
  "meta": {
    "optional": "metadata such as pagination"
  }
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Sanitized error description for user display",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {
    "field": "Specific field validation message"
  }
}
```

*Note: Stack traces are strictly excluded in production environments to avoid leaking internal implementation details.*

---

## Implemented Endpoints (Prompt 3)

### System Health & Diagnostics

`GET /api/v1/health`

Verifies backend process liveness and MongoDB readiness without leaking credentials or environment secrets.

- **Access:** Public
- **Success Status:** `200 OK` (when both process and database are healthy)
- **Degraded Status:** `503 Service Unavailable` (when process is running but database is not ready)

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Smart Resource Booking API is operating normally.",
  "data": {
    "status": "healthy",
    "service": "smart-resource-booking-api",
    "environment": "development",
    "uptimeSeconds": 142,
    "timestamp": "2026-10-27T10:30:00.000Z",
    "database": {
      "ready": true,
      "state": "connected"
    }
  }
}
```

#### Example 503 Degraded Response
```json
{
  "success": false,
  "message": "Smart Resource Booking API is operational, but the database connection is not ready.",
  "data": {
    "status": "degraded",
    "service": "smart-resource-booking-api",
    "environment": "development",
    "uptimeSeconds": 12,
    "timestamp": "2026-10-27T10:30:00.000Z",
    "database": {
      "ready": false,
      "state": "disconnected"
    }
  }
}
```

---

## Planned API Groups (Upcoming Prompts)

| Group | Namespace | Responsibilities | Target Prompt | Access |
|---|---|---|---|---|
| Health | `/api/v1/health` | Service liveness & database readiness | **Implemented (Prompt 3)** | Public |
| Authentication | `/api/v1/auth` | Registration, sign-in, session profile, sign-out | Prompt 4 | Public (sign-in/reg) / Authenticated (profile) |
| Resources | `/api/v1/resources` | Resource discovery, catalog search, details | Prompt 5 | Public reads / Admin writes |
| Availability | `/api/v1/resources/:id/availability` | Query bookable slots on `[start, end)` intervals | Prompt 5 | Public / Authenticated reads |
| Bookings | `/api/v1/bookings` | Create reservations, user booking history, cancel, reschedule | Prompt 6 | Authenticated (ownership enforced) |
| Administration | `/api/v1/admin` | Resource inventory, maintenance blackouts, audit | Prompt 7 | Administrator |

---

## Concurrency and Transaction Requirements

Create and reschedule operations in Prompt 6 must validate the interval, resource status, operating schedule, maintenance blocks, and slot alignment on the server. Conflicts must be rejected atomically even under high concurrent load.

The booking implementation is planned around fixed-duration `ResourceSlots` protected by a unique compound index on `(resourceId, slotStartAt)` and MongoDB transactions. Multi-document transactions require a MongoDB deployment with replica set support (such as a local replica set or MongoDB Atlas); standalone MongoDB instances do not support multi-document transactions.
