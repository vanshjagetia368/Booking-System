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

## Planned API Groups (Upcoming Prompts)

| Group | Namespace | Responsibilities | Target Prompt | Access |
|---|---|---|---|---|
| Health | `/api/v1/health` | Service liveness & database readiness | **Implemented (Prompt 3)** | Public |
| Authentication | `/api/v1/auth` | Registration, sign-in, session profile, sign-out | **Implemented (Prompt 5)** | Public (sign-in/reg) / Authenticated (profile) |
| Resources | `/api/v1/resources` & `/api/v1/admin/resources` | Resource discovery, catalog search, admin management | **Implemented (Prompt 6)** | Public reads / Admin writes & management |
| Availability | `/api/v1/resources/:resourceId/availability` | Query bookable slots on `[start, end)` intervals | **Implemented (Prompt 7)** | Public reads |
| Bookings | `/api/v1/bookings` | Create reservations, user booking history, cancel, reschedule | Prompt 8 | Authenticated (ownership enforced) |
| Administration | `/api/v1/admin/maintenance` | Maintenance blackouts, inventory analytics, and audit | Prompt 9 | Administrator |

---

## Concurrency and Transaction Requirements

Create and reschedule operations in Prompt 8 must validate the interval, resource status, operating schedule, maintenance blocks, and slot alignment on the server. Conflicts must be rejected atomically even under high concurrent load.

The booking implementation is planned around fixed-duration `ResourceSlots` protected by a unique compound index on `(resourceId, slotStartAt)` and MongoDB transactions. Multi-document transactions require a MongoDB deployment with replica set support (such as a local replica set or MongoDB Atlas); standalone MongoDB instances do not support multi-document transactions.



