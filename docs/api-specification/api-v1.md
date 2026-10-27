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

## Resource Discovery & Management Endpoints (Prompt 6)

The Resource module manages physical bookable shared campus facilities and equipment (study rooms, meeting rooms, laboratories, and specialized gear).

### Resource Model & Semantics

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | MongoDB ObjectId | Unique resource identifier. |
| `name` | String | Required, 2–100 chars, trimmed | Name of the facility or resource. |
| `description` | String | Max 1000 chars, trimmed | Optional description or usage instructions. |
| `category` | String | Enum: `study-room`, `meeting-room`, `lab-equipment`, `other` | Standardized category taxonomy. |
| `location` | String | Required, 2–100 chars, trimmed | Facility location (building, floor, room number). |
| `capacity` | Integer | Required, 1–1000 | Max seated occupants (rooms) or concurrent operator limit (equipment). |
| `slotDurationMinutes` | Integer | Required, 15–480, multiple of 15, default `30` | Minimum bookable time-block duration. |
| `operatingHours` | Object | 7 days (`monday` to `sunday`) | Daily schedule specifying `isOpen`, `openTime` (HH:mm), `closeTime` (HH:mm). |
| `status` | String | Enum: `active`, `inactive`, default `active` | Lifecycle status. Public discovery only exposes `active` resources. |
| `createdAt` | ISO 8601 | Auto-managed timestamp | Creation date/time. |
| `updatedAt` | ISO 8601 | Auto-managed timestamp | Last modification date/time. |

#### Operating Hours Format
Operating hours are configured on a per-day basis using 24-hour time strings (`HH:mm`) evaluated in local facility time:
```json
{
  "monday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
  "tuesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
  "wednesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
  "thursday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
  "friday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
  "saturday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "sunday": { "isOpen": false, "openTime": "09:00", "closeTime": "17:00" }
}
```
*Invariants:* When `isOpen: true`, both `openTime` and `closeTime` must be in valid `HH:mm` format and `openTime < closeTime`. When `isOpen: false`, the resource is closed without creating bookable intervals.

---

### 1. List Active Resources (Public Discovery)

`GET /api/v1/resources`

Returns a paginated list of active resources matching optional query filters. Inactive resources are strictly excluded.

- **Access:** Public
- **Query Parameters:**
  - `page` (Integer, default `1`): Current page number.
  - `limit` (Integer, default `10`, max `100`): Results per page.
  - `search` (String, max 100 chars): Case-insensitive search on `name`, `description`, and `location` (regex characters are safely escaped).
  - `category` (String): Must match one of `study-room`, `meeting-room`, `lab-equipment`, `other`.
  - `location` (String, max 100 chars): Substring match on location.
  - `minCapacity` (Integer >= 1): Minimum capacity filter.
  - `maxCapacity` (Integer >= 1): Maximum capacity filter (`minCapacity <= maxCapacity`).
  - `sortBy` (String, default `createdAt`): `createdAt`, `name`, `capacity`, `slotDurationMinutes`, `category`.
  - `sortOrder` (String, default `desc`): `asc` or `desc`.

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Active resources retrieved successfully.",
  "data": {
    "resources": [
      {
        "id": "671e482bf66895768659d9f1",
        "name": "Collaborative Study Suite A",
        "description": "Equipped with whiteboard and dual monitors.",
        "category": "study-room",
        "location": "Main Library, 2nd Floor, Room 204",
        "capacity": 6,
        "slotDurationMinutes": 30,
        "operatingHours": {
          "monday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
          "tuesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
          "wednesday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
          "thursday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
          "friday": { "isOpen": true, "openTime": "08:00", "closeTime": "20:00" },
          "saturday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
          "sunday": { "isOpen": false, "openTime": "09:00", "closeTime": "17:00" }
        },
        "status": "active",
        "createdAt": "2026-10-27T11:00:00.000Z",
        "updatedAt": "2026-10-27T11:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Public Resource Details

`GET /api/v1/resources/:resourceId`

Retrieves details for a single active resource. Inactive resources return `404 Not Found`.

- **Access:** Public
- **Success Status:** `200 OK`
- **Error Status:** `404 Not Found` (`RESOURCE_NOT_FOUND`) if nonexistent or inactive.

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": {
    "resource": {
      "id": "671e482bf66895768659d9f1",
      "name": "Collaborative Study Suite A",
      "description": "Equipped with whiteboard and dual monitors.",
      "category": "study-room",
      "location": "Main Library, 2nd Floor, Room 204",
      "capacity": 6,
      "slotDurationMinutes": 30,
      "operatingHours": { ... },
      "status": "active",
      "createdAt": "2026-10-27T11:00:00.000Z",
      "updatedAt": "2026-10-27T11:00:00.000Z"
    }
  }
}
```

---

### 3. Create Resource (Admin Only)

`POST /api/v1/resources`

Creates a new facility or equipment resource.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Success Status:** `201 Created`
- **Mass-Assignment Defense:** Strictly rejects non-whitelisted fields (e.g. `_id`, `createdAt`).

#### Request Body
```json
{
  "name": "Advanced Optics Laboratory Microscope A",
  "description": "High-magnification confocal fluorescence microscope.",
  "category": "lab-equipment",
  "location": "Science Complex, Basement Lab B-12",
  "capacity": 2,
  "slotDurationMinutes": 60,
  "operatingHours": {
    "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
    "tuesday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
    "wednesday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
    "thursday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
    "friday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
    "saturday": { "isOpen": false, "openTime": "09:00", "closeTime": "17:00" },
    "sunday": { "isOpen": false, "openTime": "09:00", "closeTime": "17:00" }
  },
  "status": "active"
}
```

---

### 4. Update Resource (Admin Only)

`PATCH /api/v1/resources/:resourceId`

Performs a partial update on permitted resource fields. Revalidates final configuration against all schema and business rules.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Success Status:** `200 OK`

#### Request Body (Example Partial Update)
```json
{
  "capacity": 8,
  "description": "Updated room description with added audiovisual equipment."
}
```

---

### 5. Change Resource Status (Admin Only)

`PATCH /api/v1/resources/:resourceId/status`

Activates or deactivates a resource. Deactivation hides the resource from public discovery without deleting historical records or past booking relationships.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Success Status:** `200 OK`

#### Request Body
```json
{
  "status": "inactive"
}
```

---

### 6. Administrative Resource Inventory

`GET /api/v1/admin/resources`

Lists all resources (including inactive resources) with management filtering options.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Query Parameters:** All public discovery parameters plus `status` (`active`, `inactive`, `all`).

---

### 7. Administrative Resource Details

`GET /api/v1/admin/resources/:resourceId`

Retrieves full resource details for administration regardless of whether the resource is active or inactive.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Success Status:** `200 OK`

---

## Resource Availability Engine (Prompt 7)

The availability engine dynamically computes bookable time slots for an active resource on a requested calendar date. It models operating schedules, fixed slot durations, past-time cutoffs, maintenance blackouts, and existing reservation records.

### Scheduling Invariants & Time Model

1. **Half-Open Intervals:** All candidate slots, maintenance periods, and reservations use half-open intervals `[startAt, endAt)`.
2. **Interval Overlap Condition:** An interval `[startA, endA)` overlaps `[startB, endB)` if and only if:
   ```text
   startA < endB && endA > startB
   ```
   Adjacent intervals (e.g. `endA === startB`) do not overlap.
3. **Slot Alignment:** Candidate slots are anchored to the configured opening time of the day's operating hours and incremented by `resource.slotDurationMinutes`. All candidate slots must fit entirely within `[openTime, closeTime)`. No slot starts before opening or extends beyond closing.
4. **Time Zone Policy:** The facility's local operating hours (e.g. `08:00` to `20:00`) on a calendar date `YYYY-MM-DD` are evaluated in standard UTC instants (`2026-10-28T08:00:00.000Z` to `2026-10-28T20:00:00.000Z`).
5. **Past-Time Cutoff:** The server evaluates the current instant (`new Date()`). Any slot whose `startAt` is less than or equal to the current instant is marked `available: false` with `reason: "PAST_TIME"`.
6. **Maintenance Exclusions:** Any slot overlapping an active `MaintenanceBlock` record for the resource is marked `available: false` with `reason: "MAINTENANCE"`.
7. **Reservation Exclusions:** Any slot overlapping a `confirmed` or `completed` booking, or matching an `allocated` `ResourceSlot` is marked `available: false` with `reason: "RESERVED"`. Cancelled bookings are ignored and release their time.
8. **Privacy Guarantee:** Availability responses expose only start/end timestamps and availability status. Private user identities, emails, booking notes, and maintenance descriptions are strictly excluded.

---

### Retrieve Resource Availability

`GET /api/v1/resources/:resourceId/availability?date=YYYY-MM-DD`

- **Access:** Public (for active resources)
- **Path Parameter:** `resourceId` (valid 24-character hexadecimal MongoDB ObjectId).
- **Query Parameter:** `date` (Required string formatted as `YYYY-MM-DD`; strictly validates calendar rules, rejecting impossible dates such as `2026-02-30`).
- **Success Status:** `200 OK`
- **Error Statuses:**
  - `400 Bad Request` (`INVALID_RESOURCE_ID` or `INVALID_DATE` or `VALIDATION_ERROR`)
  - `404 Not Found` (`RESOURCE_NOT_FOUND` if resource does not exist or is inactive)

#### Example 200 OK Response (Open Day with Exclusions)
```json
{
  "success": true,
  "message": "Resource availability retrieved successfully.",
  "data": {
    "resourceId": "671e482bf66895768659d9f1",
    "resourceName": "Collaborative Study Suite A",
    "date": "2026-10-28",
    "timeZone": "UTC",
    "operatingHours": {
      "isOpen": true,
      "openTime": "08:00",
      "closeTime": "12:00"
    },
    "slotDurationMinutes": 30,
    "slots": [
      {
        "startAt": "2026-10-28T08:00:00.000Z",
        "endAt": "2026-10-28T08:30:00.000Z",
        "available": true,
        "reason": null
      },
      {
        "startAt": "2026-10-28T08:30:00.000Z",
        "endAt": "2026-10-28T09:00:00.000Z",
        "available": true,
        "reason": null
      },
      {
        "startAt": "2026-10-28T09:00:00.000Z",
        "endAt": "2026-10-28T09:30:00.000Z",
        "available": false,
        "reason": "MAINTENANCE"
      },
      {
        "startAt": "2026-10-28T09:30:00.000Z",
        "endAt": "2026-10-28T10:00:00.000Z",
        "available": false,
        "reason": "MAINTENANCE"
      },
      {
        "startAt": "2026-10-28T10:00:00.000Z",
        "endAt": "2026-10-28T10:30:00.000Z",
        "available": false,
        "reason": "RESERVED"
      },
      {
        "startAt": "2026-10-28T10:30:00.000Z",
        "endAt": "2026-10-28T11:00:00.000Z",
        "available": false,
        "reason": "RESERVED"
      },
      {
        "startAt": "2026-10-28T11:00:00.000Z",
        "endAt": "2026-10-28T11:30:00.000Z",
        "available": true,
        "reason": null
      },
      {
        "startAt": "2026-10-28T11:30:00.000Z",
        "endAt": "2026-10-28T12:00:00.000Z",
        "available": false,
        "reason": "RESERVED"
      }
    ],
    "summary": {
      "totalSlots": 8,
      "availableSlots": 3,
      "reservedSlots": 3,
      "maintenanceSlots": 2,
      "pastSlots": 0
    }
  }
}
```

#### Example 200 OK Response (Closed Day)
```json
{
  "success": true,
  "message": "Resource availability retrieved successfully.",
  "data": {
    "resourceId": "671e482bf66895768659d9f1",
    "resourceName": "Collaborative Study Suite A",
    "date": "2026-11-01",
    "timeZone": "UTC",
    "operatingHours": {
      "isOpen": false,
      "openTime": null,
      "closeTime": null
    },
    "slotDurationMinutes": 30,
    "slots": [],
    "summary": {
      "totalSlots": 0,
      "availableSlots": 0,
      "reservedSlots": 0,
      "maintenanceSlots": 0,
      "pastSlots": 0
    }
  }
}
```

---

---

## Booking Models & Concurrency-Safe Allocation Primitives (Prompt 8)

Prompt 8 implements the database schemas and internal service primitives (`server/src/services/bookingAllocation.service.js`) required for concurrency-safe booking allocation. Public HTTP endpoints for creating and managing bookings will be implemented in Prompt 9.

### 1. Concurrency Safety Model
- **Fixed-Duration Slot Grid:** All bookings must align with the resource's `slotDurationMinutes`.
- **Compound Unique Index:** `ResourceSlot` enforces `{ resourceId: 1, slotStartAt: 1 }` with `{ unique: true }`.
- **Atomic Multi-Document Transactions:** Booking creation and slot insertion run inside a single MongoDB transaction session where supported. If a concurrent request attempts to allocate the same slot, the unique index triggers a duplicate-key error (`E11000`) and the service returns `409 Conflict` (`BOOKING_CONFLICT`).

### 2. Standard Allocation Error Codes

| Error Code | HTTP Status | Description |
|---|---|---|
| `BOOKING_CONFLICT` | `409 Conflict` | The requested time slot is already reserved or overlaps with scheduled maintenance. |
| `INVALID_BOOKING_INTERVAL` | `400 Bad Request` | Unaligned slot duration, start/end times outside operating hours, or past-time attempt. |
| `RESOURCE_NOT_FOUND` | `404 Not Found` | Target resource does not exist. |
| `RESOURCE_INACTIVE` | `400 Bad Request` | Target resource is deactivated and cannot accept new reservations. |
| `TRANSACTIONS_UNAVAILABLE` | `503 Service Unavailable` | The MongoDB deployment does not support transactions (e.g. standalone instance without replica set). |
| `BOOKING_ALLOCATION_FAILED` | `500 Internal Error` | Unexpected database error during atomic allocation. |

---

## Booking Creation & Reservation Workflow (Prompt 9)

### Create Reservation

`POST /api/v1/bookings`

Creates a new reservation for an active resource with transaction-safe, atomic fixed-duration slot allocation.

- **Access:** Authenticated (`authenticate` middleware required).
- **Ownership Enforcement:** The authenticated user's ID (`req.userId`) is derived exclusively from the verified JWT cookie or Bearer token. Client-provided `userId` values in the request body are rejected with `400 Bad Request`.
- **Initial Status:** Server-managed; strictly assigned as `confirmed`. Clients cannot supply arbitrary statuses (`cancelled`, `completed`, etc.).
- **Slot Alignment:** The requested interval must be an exact integer multiple of the resource's `slotDurationMinutes` and aligned to the slot grid anchored at resource opening time.
- **Operating Hours:** The reservation must fall completely within the resource's operating hours for the given day of the week.
- **Half-Open Intervals:** Evaluates intervals on `[startAt, endAt)` boundaries.
- **Concurrency Protection:** Allocation executes within a MongoDB transaction. Concurrently competing requests colliding on the same slot are rejected at the database level by the unique compound index on `ResourceSlot (resourceId, slotStartAt)`, raising `409 Conflict` (`BOOKING_CONFLICT`).
- **Advisory Availability:** The `GET /resources/:id/availability` endpoint is advisory. A slot displayed as available may be reserved by another client before allocation commits. The booking endpoint performs authoritative transactional validation and slot reservation.
- **Success Status:** `201 Created`

#### Request Body
```json
{
  "resourceId": "671e482bf66895768659d9f1",
  "startAt": "2026-10-28T10:00:00Z",
  "endAt": "2026-10-28T11:00:00Z",
  "notes": "Collaborative machine learning project review"
}
```

#### Validation Invariants
- `resourceId`: Required string matching a 24-character hexadecimal MongoDB ObjectId.
- `startAt`: Required ISO 8601 timestamp with explicit time zone context (`Z` or `+/-HH:mm`). Must be in the future and within the 90-day advance booking window.
- `endAt`: Required ISO 8601 timestamp with explicit time zone context. Must be strictly later than `startAt` (`[startAt, endAt)`).
- `notes`: Optional string, maximum 1000 characters.
- **Mass-Assignment Defense:** Strictly rejects unexpected fields (e.g. `userId`, `status`, `cancellationReason`, `createdAt`, `updatedAt`, `slots`).

#### Example 201 Created Response
```json
{
  "success": true,
  "message": "Booking created successfully.",
  "data": {
    "booking": {
      "id": "671e621bf66895768659da05",
      "userId": "671e3b62f66895768659d9a0",
      "resourceId": "671e482bf66895768659d9f1",
      "resource": {
        "id": "671e482bf66895768659d9f1",
        "name": "Collaborative Study Suite A",
        "category": "study-room",
        "location": "Library Building 2, Room 204",
        "capacity": 6,
        "slotDurationMinutes": 30
      },
      "startAt": "2026-10-28T10:00:00.000Z",
      "endAt": "2026-10-28T11:00:00.000Z",
      "status": "confirmed",
      "notes": "Collaborative machine learning project review",
      "slotCount": 2,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T12:00:00.000Z"
    },
    "slots": [
      {
        "id": "671e621bf66895768659da06",
        "resourceId": "671e482bf66895768659d9f1",
        "slotStartAt": "2026-10-28T10:00:00.000Z",
        "slotEndAt": "2026-10-28T10:30:00.000Z",
        "bookingId": "671e621bf66895768659da05",
        "createdAt": "2026-10-27T12:00:00.000Z",
        "updatedAt": "2026-10-27T12:00:00.000Z"
      },
      {
        "id": "671e621bf66895768659da07",
        "resourceId": "671e482bf66895768659d9f1",
        "slotStartAt": "2026-10-28T10:30:00.000Z",
        "slotEndAt": "2026-10-28T11:00:00.000Z",
        "bookingId": "671e621bf66895768659da05",
        "createdAt": "2026-10-27T12:00:00.000Z",
        "updatedAt": "2026-10-27T12:00:00.000Z"
      }
    ]
  }
}
```

#### Example Error Responses

- **Concurrent Slot Double-Booking Attempt (`409 Conflict`):**
```json
{
  "success": false,
  "message": "One or more requested time slots have already been reserved by a concurrent booking.",
  "code": "BOOKING_CONFLICT"
}
```

- **Maintenance Overlap (`409 Conflict`):**
```json
{
  "success": false,
  "message": "The requested time slot overlaps with a scheduled maintenance blackout period.",
  "code": "MAINTENANCE_CONFLICT"
}
```

- **Unaligned Slot Duration (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "Reservation duration must be an integer multiple of the resource slot duration (30 minutes).",
  "code": "INVALID_BOOKING_INTERVAL"
}
```

- **Outside Operating Hours (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "Requested start time (2026-10-28T07:30:00.000Z) is before resource opening time (2026-10-28T08:00:00.000Z).",
  "code": "OUTSIDE_OPERATING_HOURS"
}
```

- **Standalone MongoDB Without Transaction Support (`503 Service Unavailable`):**
```json
{
  "success": false,
  "message": "Database transactions are unavailable. Multi-document booking allocation requires a MongoDB replica set deployment.",
  "code": "TRANSACTIONS_UNAVAILABLE"
}
```

---

## Booking Management Workflows (Prompt 10)

### 1. Retrieve User Booking History

`GET /api/v1/bookings/my`

Retrieves a paginated list of reservations owned by the currently authenticated user.

- **Access:** Authenticated (`authenticate` middleware required).
- **Ownership Enforcement:** Derived strictly from `req.userId`. Users cannot query other users' bookings.
- **Sorting:** Deterministic newest-first sort on `{ startAt: -1, createdAt: -1 }`.
- **Query Parameters:**
  - `page` (optional integer >= 1, default `1`)
  - `limit` (optional integer 1..100, default `10`)
  - `status` (optional string enum: `confirmed`, `cancelled`, `completed`)
  - `resourceId` (optional 24-character hexadecimal ObjectId)
  - `fromDate` (optional ISO 8601 date/timestamp string filter on `startAt >= fromDate`)
  - `toDate` (optional ISO 8601 date/timestamp string filter on `startAt <= toDate`)
- **Success Status:** `200 OK`

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "User bookings retrieved successfully.",
  "data": {
    "bookings": [
      {
        "id": "671e621bf66895768659da05",
        "userId": "671e3b62f66895768659d9a0",
        "resourceId": "671e482bf66895768659d9f1",
        "resource": {
          "id": "671e482bf66895768659d9f1",
          "name": "Collaborative Study Suite A",
          "category": "study-room",
          "location": "Library Building 2, Room 204",
          "capacity": 6,
          "slotDurationMinutes": 30
        },
        "startAt": "2026-10-28T10:00:00.000Z",
        "endAt": "2026-10-28T11:00:00.000Z",
        "status": "confirmed",
        "notes": "Machine learning study session",
        "cancellationReason": null,
        "cancelledAt": null,
        "createdAt": "2026-10-27T12:00:00.000Z",
        "updatedAt": "2026-10-27T12:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 2. Retrieve Booking Details

`GET /api/v1/bookings/:bookingId`

Retrieves full reservation details for a specific booking owned by the caller.

- **Access:** Authenticated (`authenticate` middleware required).
- **Path Parameter:** `bookingId` (valid 24-character hexadecimal MongoDB ObjectId).
- **Ownership Enforcement:** Returns `404 Not Found` (`BOOKING_NOT_FOUND`) if the booking does not exist OR if it is owned by another user, preventing booking existence enumeration.
- **Success Status:** `200 OK`

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Booking details retrieved successfully.",
  "data": {
    "booking": {
      "id": "671e621bf66895768659da05",
      "userId": "671e3b62f66895768659d9a0",
      "resourceId": "671e482bf66895768659d9f1",
      "resource": {
        "id": "671e482bf66895768659d9f1",
        "name": "Collaborative Study Suite A",
        "category": "study-room",
        "location": "Library Building 2, Room 204",
        "capacity": 6,
        "slotDurationMinutes": 30,
        "description": "Quiet collaborative room equipped with whiteboard and HDMI display."
      },
      "startAt": "2026-10-28T10:00:00.000Z",
      "endAt": "2026-10-28T11:00:00.000Z",
      "status": "confirmed",
      "notes": "Machine learning study session",
      "cancellationReason": null,
      "cancelledAt": null,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T12:00:00.000Z"
    }
  }
}
```

---

### 3. Cancel Booking

`PATCH /api/v1/bookings/:bookingId/cancel`

Cancels an active confirmed reservation and atomically releases its occupied fixed-duration slots back to available inventory.

- **Access:** Authenticated (`authenticate` middleware required).
- **Path Parameter:** `bookingId` (valid 24-character hexadecimal MongoDB ObjectId).
- **Request Body (optional):**
```json
{
  "reason": "Class schedule conflict"
}
```
- **Cancellation Policy:**
  - Only the booking owner can cancel.
  - Only bookings in `confirmed` status can be cancelled.
  - Bookings that have already started or passed (`startAt <= Date.now()`) cannot be cancelled (`409 Conflict`, `BOOKING_ALREADY_STARTED`).
  - Already cancelled bookings reject repeated cancellation (`409 Conflict`, `BOOKING_ALREADY_CANCELLED`).
  - Completed bookings reject cancellation (`409 Conflict`, `INVALID_BOOKING_TRANSITION`).
- **Atomic Deallocation:** The `Booking` record status transition to `cancelled` and the deletion of `ResourceSlot` records occur within a single MongoDB transaction.
- **Audit Preservation:** The `Booking` document is never deleted; `cancelledAt` and `cancellationReason` are recorded.
- **Success Status:** `200 OK`

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully.",
  "data": {
    "booking": {
      "id": "671e621bf66895768659da05",
      "userId": "671e3b62f66895768659d9a0",
      "resourceId": "671e482bf66895768659d9f1",
      "resource": {
        "id": "671e482bf66895768659d9f1",
        "name": "Collaborative Study Suite A",
        "category": "study-room",
        "location": "Library Building 2, Room 204",
        "capacity": 6,
        "slotDurationMinutes": 30
      },
      "startAt": "2026-10-28T10:00:00.000Z",
      "endAt": "2026-10-28T11:00:00.000Z",
      "status": "cancelled",
      "notes": "Machine learning study session",
      "cancellationReason": "Class schedule conflict",
      "cancelledAt": "2026-10-27T14:30:00.000Z",
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T14:30:00.000Z"
    }
  }
}
```

---

### 4. Reschedule Booking

`PATCH /api/v1/bookings/:bookingId/reschedule`

Reschedules an active confirmed reservation to a new time interval with atomic reallocation of resource slots.

- **Access:** Authenticated (`authenticate` middleware required).
- **Path Parameter:** `bookingId` (valid 24-character hexadecimal MongoDB ObjectId).
- **Request Body:**
```json
{
  "startAt": "2026-10-28T14:00:00Z",
  "endAt": "2026-10-28T15:00:00Z"
}
```
- **Rescheduling Policy & Invariants:**
  - Only the booking owner can reschedule.
  - Only `confirmed` bookings can be rescheduled.
  - Bookings that have already started cannot be rescheduled (`BOOKING_ALREADY_STARTED`).
  - Target resource must remain `active`.
  - New interval must be valid ISO 8601 instants, positive duration (`[startAt, endAt)`), strictly in the future, within the 90-day booking window, aligned to the resource's slot duration grid, and within operating hours.
  - Same-Time Rescheduling: If the requested start and end timestamps match the current interval exactly, returns `200 OK` (`Booking schedule is unchanged.`) idempotently without releasing or reallocating slots.
- **Atomic Reallocation Transaction:**
  - Evaluates maintenance overlaps (`MAINTENANCE_CONFLICT`).
  - Evaluates active booking overlaps, strictly excluding the current booking (`BOOKING_CONFLICT`).
  - Releases old slots and inserts new slots atomically. If any concurrent conflict or failure occurs, the transaction is rolled back, leaving the original booking and original slot allocations completely intact.
- **Success Status:** `200 OK`

#### Example 200 OK Response
```json
{
  "success": true,
  "message": "Booking rescheduled successfully.",
  "data": {
    "booking": {
      "id": "671e621bf66895768659da05",
      "userId": "671e3b62f66895768659d9a0",
      "resourceId": "671e482bf66895768659d9f1",
      "resource": {
        "id": "671e482bf66895768659d9f1",
        "name": "Collaborative Study Suite A",
        "category": "study-room",
        "location": "Library Building 2, Room 204",
        "capacity": 6,
        "slotDurationMinutes": 30
      },
      "startAt": "2026-10-28T14:00:00.000Z",
      "endAt": "2026-10-28T15:00:00.000Z",
      "status": "confirmed",
      "notes": "Machine learning study session",
      "cancellationReason": null,
      "cancelledAt": null,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T15:00:00.000Z"
    },
    "slots": [
      {
        "id": "671e621bf66895768659da10",
        "resourceId": "671e482bf66895768659d9f1",
        "slotStartAt": "2026-10-28T14:00:00.000Z",
        "slotEndAt": "2026-10-28T14:30:00.000Z",
        "bookingId": "671e621bf66895768659da05",
        "createdAt": "2026-10-27T15:00:00.000Z",
        "updatedAt": "2026-10-27T15:00:00.000Z"
      },
      {
        "id": "671e621bf66895768659da11",
        "resourceId": "671e482bf66895768659d9f1",
        "slotStartAt": "2026-10-28T14:30:00.000Z",
        "slotEndAt": "2026-10-28T15:00:00.000Z",
        "bookingId": "671e621bf66895768659da05",
        "createdAt": "2026-10-27T15:00:00.000Z",
        "updatedAt": "2026-10-27T15:00:00.000Z"
      }
    ]
  }
}
```

---

## Implemented Endpoints (Prompt 11)

### Administrative Booking Management

#### 1. List Administrative Bookings

`GET /api/v1/admin/bookings`

Retrieves a paginated list of bookings across all users with administrative filters, deterministic sorting, and safe resource/user details.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Query Parameters:**
  - `page` (optional integer >= 1, default: 1)
  - `limit` (optional integer 1-100, default: 20)
  - `status` (optional enum: `confirmed`, `cancelled`, `completed`)
  - `resourceId` (optional 24-character hexadecimal ObjectId)
  - `userId` (optional 24-character hexadecimal ObjectId)
  - `category` (optional enum: `study-room`, `meeting-room`, `lab-equipment`, `other`)
  - `fromDate` (optional ISO 8601 date string)
  - `toDate` (optional ISO 8601 date string)
  - `sortBy` (optional enum: `startAt`, `createdAt`, `endAt`, `status`, default: `startAt`)
  - `sortOrder` (optional enum: `asc`, `desc`, default: `desc`)
- **Success Status:** `200 OK`

##### Example 200 OK Response
```json
{
  "success": true,
  "message": "Administrative bookings retrieved successfully.",
  "data": {
    "bookings": [
      {
        "id": "671e621bf66895768659da05",
        "userId": "671e482bf66895768659d9ee",
        "user": {
          "id": "671e482bf66895768659d9ee",
          "name": "Jane Doe",
          "email": "jane.doe@university.edu"
        },
        "resourceId": "671e482bf66895768659d9f1",
        "resource": {
          "id": "671e482bf66895768659d9f1",
          "name": "Study Room A",
          "category": "study-room",
          "location": "Library Floor 2, Room 204",
          "capacity": 4,
          "slotDurationMinutes": 30
        },
        "startAt": "2026-10-28T14:00:00.000Z",
        "endAt": "2026-10-28T15:00:00.000Z",
        "status": "confirmed",
        "notes": "Group study session",
        "cancellationReason": null,
        "cancelledAt": null,
        "cancelledBy": null,
        "createdAt": "2026-10-27T12:00:00.000Z",
        "updatedAt": "2026-10-27T12:00:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

##### Common Error Responses
- `401 Unauthorized` (`AUTHENTICATION_REQUIRED`, `TOKEN_INVALID`, `TOKEN_EXPIRED`)
- `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`) — When accessed by non-admin accounts.
- `400 Bad Request` (`VALIDATION_ERROR`) — Invalid pagination, unpermitted filter keys, or malformed ObjectIds.

---

#### 2. Administrative Booking Cancellation

`PATCH /api/v1/admin/bookings/:bookingId/cancel`

Controlled administrative cancellation of a confirmed booking with atomic slot release in a MongoDB transaction.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Path Parameters:**
  - `bookingId` (required 24-character hexadecimal ObjectId)
- **Request Body (JSON):**
  - `reason` (optional string, max 500 characters, default: `'Cancelled by administrator'`)
- **Status Transition Policy:**
  - Only `confirmed` bookings can be cancelled.
  - Already cancelled bookings reject mutation (`409 Conflict`, `BOOKING_ALREADY_CANCELLED`).
  - Completed or past bookings reject cancellation (`409 Conflict`, `INVALID_BOOKING_TRANSITION`).
  - Arbitrary status modifications from client payloads are strictly prohibited.
  - Records administrative audit metadata: `cancelledBy` (admin user ID), `cancelledAt` (timestamp), and `cancellationReason`.
  - Atomically deletes active `ResourceSlot` records associated with the booking, restoring calendar availability while preserving the historical `Booking` document.
- **Success Status:** `200 OK`

##### Example 200 OK Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully by administrator.",
  "data": {
    "booking": {
      "id": "671e621bf66895768659da05",
      "userId": "671e482bf66895768659d9ee",
      "user": {
        "id": "671e482bf66895768659d9ee",
        "name": "Jane Doe",
        "email": "jane.doe@university.edu"
      },
      "resourceId": "671e482bf66895768659d9f1",
      "resource": {
        "id": "671e482bf66895768659d9f1",
        "name": "Study Room A",
        "category": "study-room",
        "location": "Library Floor 2, Room 204",
        "capacity": 4,
        "slotDurationMinutes": 30
      },
      "startAt": "2026-10-28T14:00:00.000Z",
      "endAt": "2026-10-28T15:00:00.000Z",
      "status": "cancelled",
      "notes": "Group study session",
      "cancellationReason": "Facility maintenance emergency",
      "cancelledAt": "2026-10-27T16:00:00.000Z",
      "cancelledBy": {
        "id": "671e482bf66895768659d9a1",
        "name": "Admin User",
        "email": "admin@university.edu"
      },
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T16:00:00.000Z"
    }
  }
}
```

##### Common Error Responses
- `401 Unauthorized` (`AUTHENTICATION_REQUIRED`, `TOKEN_EXPIRED`)
- `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`)
- `404 Not Found` (`BOOKING_NOT_FOUND`) — If the target booking does not exist.
- `409 Conflict` (`BOOKING_ALREADY_CANCELLED`, `INVALID_BOOKING_TRANSITION`) — When booking is already cancelled or completed.

---

### Administrative Maintenance Management

#### 3. Create Maintenance Blackout Period

`POST /api/v1/admin/resources/:resourceId/maintenance`

Schedules a maintenance blackout period during which a resource is marked unavailable.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Path Parameters:**
  - `resourceId` (required 24-character hexadecimal ObjectId)
- **Request Body (JSON):**
  - `startAt` (required ISO 8601 instant with timezone, e.g. `"2026-10-29T08:00:00Z"`)
  - `endAt` (required ISO 8601 instant with timezone, e.g. `"2026-10-29T12:00:00Z"`)
  - `reason` (optional string, max 500 characters, default: `"Scheduled maintenance"`)
- **Validation & Overlap Policy:**
  - Enforces `startAt < endAt` strictly on half-open interval `[startAt, endAt)`.
  - Rejects maintenance intervals occurring completely in the past (`endAt <= Date.now()`).
  - Rejects unpermitted fields (mass assignment protection).
  - Rejects overlapping existing maintenance blocks for the same resource (`409 Conflict`, `MAINTENANCE_OVERLAP_CONFLICT`).
  - **Confirmed Booking Conflict Protection (Section 8):** Checks for overlapping confirmed bookings (`existing.startAt < maintenance.endAt && existing.endAt > maintenance.startAt`). If confirmed bookings exist, returns `409 Conflict` (`MAINTENANCE_BOOKING_CONFLICT`) with structured conflict details. Does **not** silently cancel bookings. The administrator must explicitly resolve or cancel conflicting bookings prior to scheduling maintenance.
  - Records `createdBy` with the authenticated administrator's ID.
- **Success Status:** `201 Created`

##### Example 201 Created Response
```json
{
  "success": true,
  "message": "Maintenance block created successfully.",
  "data": {
    "maintenanceBlock": {
      "id": "671e7a5bf66895768659db01",
      "resourceId": "671e482bf66895768659d9f1",
      "startAt": "2026-10-29T08:00:00.000Z",
      "endAt": "2026-10-29T12:00:00.000Z",
      "reason": "HVAC system filter replacement",
      "createdBy": "671e482bf66895768659d9a1",
      "createdAt": "2026-10-27T16:30:00.000Z",
      "updatedAt": "2026-10-27T16:30:00.000Z"
    }
  }
}
```

##### Example 409 Conflict (Confirmed Booking Overlap) Response
```json
{
  "success": false,
  "message": "Cannot schedule maintenance: 1 confirmed booking(s) overlap with the requested interval. The administrator must resolve or cancel conflicting bookings before scheduling maintenance.",
  "code": "MAINTENANCE_BOOKING_CONFLICT",
  "details": {
    "conflictingBookingsCount": 1,
    "conflictingBookings": [
      {
        "id": "671e621bf66895768659da05",
        "userId": "671e482bf66895768659d9ee",
        "startAt": "2026-10-29T09:00:00.000Z",
        "endAt": "2026-10-29T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### 4. List Maintenance Blackout Periods

`GET /api/v1/admin/resources/:resourceId/maintenance`

Retrieves a paginated list of maintenance blackout periods for a specific resource.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Path Parameters:**
  - `resourceId` (required 24-character hexadecimal ObjectId)
- **Query Parameters:**
  - `page` (optional integer >= 1, default: 1)
  - `limit` (optional integer 1-100, default: 20)
  - `fromDate` (optional ISO 8601 date string)
  - `toDate` (optional ISO 8601 date string)
- **Deterministic Ordering:** Chronological by `startAt: 1, createdAt: 1`.
- **Empty Resource Handling:** Returns empty array `[]` with valid pagination when no maintenance blocks exist.
- **Success Status:** `200 OK`

##### Example 200 OK Response
```json
{
  "success": true,
  "message": "Maintenance blocks retrieved successfully.",
  "data": {
    "maintenanceBlocks": [
      {
        "id": "671e7a5bf66895768659db01",
        "resourceId": "671e482bf66895768659d9f1",
        "startAt": "2026-10-29T08:00:00.000Z",
        "endAt": "2026-10-29T12:00:00.000Z",
        "reason": "HVAC system filter replacement",
        "createdBy": {
          "id": "671e482bf66895768659d9a1",
          "name": "Admin User",
          "email": "admin@university.edu"
        },
        "createdAt": "2026-10-27T16:30:00.000Z",
        "updatedAt": "2026-10-27T16:30:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### 5. Delete Maintenance Blackout Period

`DELETE /api/v1/admin/maintenance/:maintenanceId`
*(Also accessible via scoped route `DELETE /api/v1/admin/resources/:resourceId/maintenance/:maintenanceId`)*

Deletes a maintenance blackout period.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Path Parameters:**
  - `maintenanceId` (required 24-character hexadecimal ObjectId)
- **Availability Re-eligibility:**
  - Once removed, the blocked intervals immediately become eligible for reservation calculations in `calculateResourceAvailability()`, provided they fall within operating hours and are not booked by another reservation.
- **Success Status:** `200 OK`

##### Example 200 OK Response
```json
{
  "success": true,
  "message": "Maintenance block deleted successfully.",
  "data": {
    "maintenanceBlock": {
      "id": "671e7a5bf66895768659db01",
      "resourceId": "671e482bf66895768659d9f1",
      "startAt": "2026-10-29T08:00:00.000Z",
      "endAt": "2026-10-29T12:00:00.000Z",
      "reason": "HVAC system filter replacement",
      "createdBy": "671e482bf66895768659d9a1",
      "createdAt": "2026-10-27T16:30:00.000Z",
      "updatedAt": "2026-10-27T16:30:00.000Z"
    }
  }
}
```

---

#### 6. Administrative Analytics & Operational Summary (Prompt 12)

`GET /api/v1/admin/analytics/summary`

Retrieves an operational summary and key aggregate metrics across resources, bookings, maintenance blocks, and users for the administrative dashboard.

- **Access:** Administrator (`authenticate` + `requireRole('admin')`)
- **Query Parameters:** None.
- **Computation Performance:** Computed using MongoDB `$facet` aggregation pipelines and `countDocuments()` for constant memory usage and zero full-document memory loading.
- **Success Status:** `200 OK`

##### Response Fields Specification
- `summary.generatedAt`: UTC ISO 8601 timestamp representing the calculation instant.
- `summary.resources`:
  - `total`: Total count of resources.
  - `active`: Count of active resources available for booking.
  - `inactive`: Count of deactivated resources.
  - `byCategory`: Map of counts grouped by category (`study-room`, `meeting-room`, `lab-equipment`, `other`).
- `summary.bookings`:
  - `total`: Total historical and current bookings count.
  - `confirmedUpcoming`: Confirmed bookings scheduled in the future (`startAt > now`).
  - `confirmedActive`: Confirmed bookings currently in progress (`startAt <= now < endAt`).
  - `completed`: Completed bookings (`status: 'completed'`).
  - `cancelled`: Cancelled bookings (`status: 'cancelled'`).
  - `byStatus`: Map of counts grouped by status (`confirmed`, `cancelled`, `completed`).
- `summary.maintenance`:
  - `total`: Total maintenance blackout blocks recorded.
  - `inEffectNow`: Maintenance blocks currently in effect (`startAt <= now < endAt`).
  - `upcoming`: Maintenance blocks scheduled for the future (`startAt > now`).
  - `past`: Expired maintenance blocks (`endAt <= now`).
- `summary.users`:
  - `total`: Total registered accounts.
  - `active`: Active accounts.
  - `disabled`: Disabled accounts.
  - `byRole`: Map of counts grouped by role (`user`, `admin`).

##### Example 200 OK Response
```json
{
  "success": true,
  "message": "Administrative operational analytics retrieved successfully.",
  "data": {
    "summary": {
      "generatedAt": "2026-10-27T18:00:00.000Z",
      "resources": {
        "total": 12,
        "active": 10,
        "inactive": 2,
        "byCategory": {
          "study-room": 5,
          "meeting-room": 4,
          "lab-equipment": 2,
          "other": 1
        }
      },
      "bookings": {
        "total": 154,
        "confirmedUpcoming": 38,
        "confirmedActive": 4,
        "completed": 98,
        "cancelled": 14,
        "byStatus": {
          "confirmed": 42,
          "cancelled": 14,
          "completed": 98
        }
      },
      "maintenance": {
        "total": 6,
        "inEffectNow": 1,
        "upcoming": 2,
        "past": 3
      },
      "users": {
        "total": 85,
        "active": 83,
        "disabled": 2,
        "byRole": {
          "user": 81,
          "admin": 4
        }
      }
    }
  }
}
```

##### Error Responses
- `401 Unauthorized` (`AUTHENTICATION_REQUIRED`): Request lacks a valid JWT session or header.
- `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_PERMISSIONS`): Authenticated user does not possess the `admin` role.

---

## Backend API Implementation Status

All backend endpoints planned in Prompts 1–12 are fully implemented, verified, and operational:

| Group | Namespace | Responsibilities | Status | Access |
|---|---|---|---|---|
| Health | `/api/v1/health` | Service liveness & database readiness | **Implemented (Prompt 3)** | Public |
| Authentication | `/api/v1/auth` | Registration, sign-in, session profile, sign-out | **Implemented (Prompt 5)** | Public (sign-in/reg) / Authenticated (profile) |
| Resources | `/api/v1/resources` & `/api/v1/admin/resources` | Resource discovery, catalog search, admin management | **Implemented (Prompt 6)** | Public reads / Admin writes & management |
| Availability | `/api/v1/resources/:resourceId/availability` | Query bookable slots on `[start, end)` intervals | **Implemented (Prompt 7)** | Public reads |
| Allocation Primitives | *Internal Service* | Atomic slot allocation, unique index concurrency, transaction safety | **Implemented (Prompt 8)** | Server-side internal primitives |
| Booking Creation | `/api/v1/bookings` | Authenticated reservation creation with atomic slot allocation | **Implemented (Prompt 9)** | Authenticated (ownership enforced) |
| Booking Lifecycle | `/api/v1/bookings` | User booking history, detail inspection, cancellation, reschedule | **Implemented (Prompt 10)** | Authenticated (ownership enforced) |
| Administration | `/api/v1/admin/bookings`, `/api/v1/admin/resources/:id/maintenance`, `/api/v1/admin/maintenance/:id` | Admin booking list/cancellation & maintenance block management | **Implemented (Prompt 11)** | Administrator |
| Admin Analytics | `/api/v1/admin/analytics/summary` | High-level operational overview & aggregate metrics | **Implemented (Prompt 12)** | Administrator |

---

## Concurrency and Transaction Requirements

Reservation creation, cancellation, rescheduling, and maintenance block creation require multi-document consistency across `Bookings`, `ResourceSlots`, and `MaintenanceBlocks`. The application uses MongoDB transactions with Mongoose sessions.

Multi-document transactions require a MongoDB deployment with replica set support (such as a local replica set or MongoDB Atlas); standalone MongoDB instances do not support multi-document transactions and will fall back safely where appropriate or return `503 Service Unavailable` (`TRANSACTIONS_UNAVAILABLE`).
