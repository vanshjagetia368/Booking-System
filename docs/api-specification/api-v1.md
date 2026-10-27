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

## Authentication & Authorization Endpoints (Prompt 5)

Authentication is implemented using bcrypt (12 salt rounds) for password hashing and signed JSON Web Tokens (JWT). Sessions are maintained via secure, `httpOnly` cookies (`auth_token`) with optional support for `Authorization: Bearer <token>` headers for non-browser or programmatic API consumers.

### Roles & Access Levels
- `user`: Standard registered user. Can create bookings and view/manage their own profile and reservations.
- `admin`: Elevated administrator. Can manage resource inventories, schedule maintenance blocks, and inspect system audits. Public registration strictly creates `user` accounts; role escalation via public APIs is rejected.

---

### 1. Register User

`POST /api/v1/auth/register`

Registers a new user account, creates a password hash using bcrypt, assigns the `user` role, sets the HTTP-only authentication cookie, and returns sanitized profile data.

- **Access:** Public
- **Mass-Assignment Defense:** Only `name`, `email`, and `password` are accepted. Explicitly rejects privileged fields such as `role` with `400 Bad Request`.
- **Email Normalization:** Trims and converts email to lowercase before unique index checking.
- **Success Status:** `201 Created`

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "Password123"
}
```

#### Validation Invariants
- `name`: String, 2 to 50 characters, trimmed.
- `email`: Valid RFC 5322 email, 5 to 100 characters, trimmed, lowercased.
- `password`: String, 8 to 128 characters.
- Unexpected fields (e.g. `role`, `status`, `id`) trigger `VALIDATION_ERROR`.

#### Example 201 Created Response
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "671e3b2e597c4193d5a49721",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2026-10-27T10:45:00.000Z",
      "updatedAt": "2026-10-27T10:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
*Response Header:* `Set-Cookie: auth_token=eyJhbGci...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`

#### Example 409 Conflict Response (Duplicate Email)
```json
{
  "success": false,
  "message": "An account with this email address already exists.",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

---

### 2. Login User

`POST /api/v1/auth/login`

Authenticates credentials against the stored bcrypt hash, verifies account active status, issues a signed JWT, sets the HTTP-only cookie, and returns sanitized user data.

- **Access:** Public
- **Success Status:** `200 OK`
- **Security:** Returns generic `INVALID_CREDENTIALS` on non-existent email or wrong password to prevent user enumeration.

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "Password123"
}
```

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "user": {
      "id": "671e3b2e597c4193d5a49721",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2026-10-27T10:45:00.000Z",
      "updatedAt": "2026-10-27T10:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Example 401 Unauthorized Response
```json
{
  "success": false,
  "message": "Invalid email or password.",
  "code": "INVALID_CREDENTIALS"
}
```

#### Example 403 Forbidden Response (Disabled Account)
```json
{
  "success": false,
  "message": "Account has been disabled. Please contact an administrator.",
  "code": "ACCOUNT_DISABLED"
}
```

---

### 3. Current Authenticated User Profile

`GET /api/v1/auth/me`

Retrieves the currently authenticated user's profile using the session established via `auth_token` cookie or `Authorization: Bearer <token>` header. Used by the React frontend to restore session state on page refresh.

- **Access:** Authenticated (`authenticate` middleware)
- **Success Status:** `200 OK`

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Authenticated user profile retrieved successfully.",
  "data": {
    "user": {
      "id": "671e3b2e597c4193d5a49721",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2026-10-27T10:45:00.000Z",
      "updatedAt": "2026-10-27T10:45:00.000Z"
    }
  }
}
```

#### Example 401 Unauthorized Response (Missing or Expired Token)
```json
{
  "success": false,
  "message": "Authentication is required to access this resource.",
  "code": "AUTHENTICATION_REQUIRED"
}
```

---

### 4. Logout User

`POST /api/v1/auth/logout`

Clears the `auth_token` cookie from the client with identical path and security flags.

- **Access:** Public / Authenticated
- **Success Status:** `200 OK`
- **Behavior Note:** Stateless JWTs cannot be cryptographically invalidated server-side without a persistent blocklist. Clearing the cookie terminates the browser session. Short token expiry (`JWT_EXPIRES_IN=7d` or shorter in production) bounds the token validity window.

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```
*Response Header:* `Set-Cookie: auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`

---

## Authorization Middleware (`requireRole`)

Protected endpoints can enforce role restrictions using `requireRole(...roles)`:
- If unauthenticated: returns `401 Unauthorized` (`AUTHENTICATION_REQUIRED`).
- If authenticated role does not match: returns `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

---

## Planned API Groups (Upcoming Prompts)

| Group | Namespace | Responsibilities | Target Prompt | Access |
|---|---|---|---|---|
| Health | `/api/v1/health` | Service liveness & database readiness | **Implemented (Prompt 3)** | Public |
| Authentication | `/api/v1/auth` | Registration, sign-in, session profile, sign-out | **Implemented (Prompt 5)** | Public (sign-in/reg) / Authenticated (profile) |
| Resources | `/api/v1/resources` | Resource discovery, catalog search, details | Prompt 6 | Public reads / Admin writes |
| Availability | `/api/v1/resources/:id/availability` | Query bookable slots on `[start, end)` intervals | Prompt 6 | Public / Authenticated reads |
| Bookings | `/api/v1/bookings` | Create reservations, user booking history, cancel, reschedule | Prompt 7 | Authenticated (ownership enforced) |
| Administration | `/api/v1/admin` | Resource inventory, maintenance blackouts, audit | Prompt 8 | Administrator |

---

## Concurrency and Transaction Requirements

Create and reschedule operations in Prompt 7 must validate the interval, resource status, operating schedule, maintenance blocks, and slot alignment on the server. Conflicts must be rejected atomically even under high concurrent load.

The booking implementation is planned around fixed-duration `ResourceSlots` protected by a unique compound index on `(resourceId, slotStartAt)` and MongoDB transactions. Multi-document transactions require a MongoDB deployment with replica set support (such as a local replica set or MongoDB Atlas); standalone MongoDB instances do not support multi-document transactions.

