# Smart Resource Booking System

Smart Resource Booking System is a full-stack web application for discovering and booking shared facilities such as study rooms, meeting rooms, and laboratory equipment. It provides users with a clean reservation experience while giving administrators tools to manage resources, schedules, and maintenance periods.

The repository is structured as a decoupled full-stack monorepo using **npm workspaces**.

---

## Technology Stack

- **Backend (Server Workspace):**
  - Node.js (>= 20) with ES modules
  - Express.js (v5)
  - MongoDB with Mongoose (v8)
  - Centralized environment configuration via `dotenv` with safe fallbacks and startup validation
  - Structured error handling with `ApiError` and centralized error middleware
  - Standardized JSON API response convention (`{ success, message, data, code }`)
  - Lightweight request logging without leaking credentials, tokens, or sensitive payloads
  - Reusable input validation framework
- **Frontend (Client Workspace):**
  - React 19
  - Vite 6
  - JavaScript / JSX
  - React Router 7
  - Vanilla CSS design system with CSS custom property tokens and responsive mobile navigation
  - Centralized API client (`apiClient.js`)
- **Database:** MongoDB (multi-document transactions require a replica set or sharded cluster).
- **Package Manager:** npm workspaces.

---

## Repository Structure

```text
client/                     React frontend workspace
  public/                   Static public assets
  src/
    app/                    Centralized configuration, route paths, router definitions, providers, and 404 page
      providers/            Application provider wrappers (AppProviders.jsx)
    assets/                 Media assets and brand graphics
    components/
      layout/               Navbar, Footer, AppLayout, PageContainer, FeaturePlaceholder
      ui/                   Reusable UI primitives (Button, Alert, Badge, Card, LoadingSpinner, EmptyState, PageHeader)
      forms/                Accessible form primitives (FormField, Input, Select, Textarea)
      feedback/             Global feedback states (LoadingState, ErrorState, ErrorBoundary, Modal)
      calendar/             Calendar and slot schedule components (reserved for Prompt 16)
      resources/            Resource cards and filter components (reserved for Prompt 15)
    features/
      admin/                Administrator management views (Prompt 8)
      auth/                 Authentication and session views (Prompt 5)
      availability/         Schedule and availability views (Prompt 6)
      bookings/             Reservation workflows, history, filtering, pagination, and details (Prompt 17)
      resources/            Home overview and resource catalog views (Prompts 2 & 6)
    hooks/                  Custom React hooks
    lib/                    Shared library wrappers and re-exports
    services/               Centralized API communication client
    utils/                  Date/time interval formatters, error normalizers, and helpers
    App.jsx                 Root component rendering the router
    main.jsx                Vite entry point
    styles.css              Comprehensive design system and responsive styles
  .env.example              Template for client-side environment configuration
  package.json              Client workspace manifest and build scripts
  vite.config.js            Vite bundler configuration and dev proxy
server/                     Express backend workspace
  src/
    config/                 Database connection manager and validated environment configuration
      database.js           Mongoose connection pooling, lifecycle logging, state diagnostics, and memoization
      env.js                Centralized environment loader with schema validation
    controllers/            HTTP request/response controllers
      adminAnalytics.controller.js Administrative operational analytics and summary handlers
      adminBooking.controller.js Administrative booking query and cancellation handlers
      auth.controller.js    User registration, login, logout, and profile handlers
      booking.controller.js Authenticated reservation creation and user lifecycle handlers
      health.controller.js  Service liveness and database readiness diagnostic handler
      maintenance.controller.js Administrative resource maintenance blackout handlers
      resource.controller.js Public resource discovery and administrative management handlers
    middleware/             Cross-cutting HTTP middleware
      authenticate.js       JWT verification from HTTP-only cookie or Bearer header
      errorHandler.js       Centralized error handler (sanitizes Mongoose/Mongo errors, excludes production stacks)
      logger.js             Lightweight HTTP logger (redacts headers, tokens, and payloads)
      notFound.js           404 route not found handler
      requireRole.js        Role-based route authorization middleware (e.g. requireRole('admin'))
      validate.js           Request schema validation middleware generator
    models/                 Mongoose schemas and indexes
      Booking.js            Reservation model with half-open interval validation and status indexing
      MaintenanceBlock.js   Maintenance blackout model with range overlap indexing
      Resource.js           Physical resource model (categories, capacity, slot duration, operating hours)
      ResourceSlot.js       Atomic slot allocation model with compound unique index (resourceId, slotStartAt)
      User.js               User identity model with bcrypt hashing and safe serialization
    routes/                 Express route handlers
      adminAnalytics.routes.js Administrative analytics routes (/admin/analytics)
      adminBooking.routes.js Administrative booking inspection and cancellation routes (/admin/bookings)
      adminMaintenance.routes.js Administrative maintenance deletion routes (/admin/maintenance)
      adminResource.routes.js Administrative resource and maintenance routes (/admin/resources)
      auth.routes.js        Authentication routes (/register, /login, /logout, /me)
      booking.routes.js     Authenticated reservation creation routes (/bookings)
      health.routes.js      Health check route handler
      index.js              Master API v1 router mounting /health, /auth, /resources, /admin/resources, /admin/bookings, /admin/maintenance, /admin/analytics, /bookings
      resource.routes.js    Public and admin resource routes (/resources)
    services/               Business and domain services
      adminAnalytics.service.js Operational summary metrics service using memory-efficient MongoDB aggregations
      auth.service.js       Token issuance/verification, cookie management, credentials verification
      availability.service.js Availability engine (candidate slot generation, past time, maintenance & booking exclusions)
      booking.service.js    Reservation creation, lifecycle, and administrative management service
      bookingAllocation.service.js Slot-alignment validation, atomic multi-slot allocation primitives, and transaction management
      maintenance.service.js Administrative maintenance blackout CRUD and overlap conflict detection service
      resource.service.js   Resource CRUD, regex-safe search, category/capacity filters, pagination
    utils/                  Shared backend utilities
      ApiError.js           Structured operational HTTP error class with status and error codes
      apiResponse.js        Standardized JSON response envelope helpers (sendSuccess, sendError)
      asyncHandler.js       Async controller error forwarder for Express
    validators/             Input validation primitives and schema helpers
      adminBooking.validator.js Administrative booking query and cancellation validation
      auth.validator.js     Registration and login validation with mass-assignment defense
      booking.validator.js  Reservation creation validation with ISO 8601 instant parsing and mass-assignment defense
      common.js             Reusable validation primitives (ObjectIds, emails, ISO dates, intervals, pagination)
      maintenance.validator.js Maintenance blackout interval validation and query filtering
      resource.validator.js Resource creation, update, status, and query parameter validation
    app.js                  Express application setup (CORS, security headers, cookie parsing, middleware, routes)
    server.js               Process entry point (database connection, HTTP listening, graceful shutdown)
  .env.example              Template for backend environment variables
  package.json              Server workspace manifest and scripts
  server.js                 Root process entry wrapper delegating to src/server.js
docs/
  requirements/             Product scope, user roles, and invariants
  architecture/             Decoupled architecture and transaction-safe slot allocation design
  database-design/          Planned MongoDB collections and relationships
  api-specification/        API v1 specification, response convention, auth, and health endpoints
```

---

## Server Architecture & Entry Points

- **`server/src/app.js` (Application Factory):**
  Instantiates the Express application. Configures baseline security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`), strict CORS origin checking derived from `CLIENT_URL`, JSON body parsing with limits, lightweight request logging, mounts `/api/v1` routes, and registers the 404 handler and centralized error handling middleware.
- **`server/src/server.js` (Process Entry Point):**
  Initializes the server process. Connects to MongoDB via `connectDatabase(env.mongodbUri)`, starts listening on the configured `PORT`, and registers graceful shutdown signal listeners (`SIGINT`, `SIGTERM`) to close HTTP listeners and database connection pools cleanly before exiting.

---

## Backend Setup and Development

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

Or target the server workspace specifically:

```bash
npm install --workspace @smart-resource-booking/server
```

### 2. Environment Configuration

Create a local environment file in `server/`:

```bash
cp server/.env.example server/.env
```

Key environment variables:

| Variable | Description | Default in Development |
|---|---|---|
| `PORT` | HTTP port for the Express backend | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection URI (replica set required for transactions) | `mongodb://127.0.0.1:27017/smart_resource_booking` |
| `CLIENT_URL` | Allowed CORS origin for client requests | `http://localhost:5173` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `dev_jwt_secret_change_in_production` (Required strong secret in production) |
| `JWT_EXPIRES_IN` | JWT expiration duration string | `7d` |
| `COOKIE_NAME` | Name of the authentication HTTP-only cookie | `auth_token` |

> **Security Note:**
> Never commit `.env` to Git or expose database connection strings, database credentials, or JWT secrets to the client frontend. In production, `NODE_ENV=production` strictly enforces that `JWT_SECRET` is defined and cannot use placeholder secrets.

### 3. Start the Backend Server

Start the server in development mode (using Node's native file watcher):

```bash
npm run dev:server
```

Or directly from the `server/` directory:

```bash
cd server
npm run dev
```

### 4. Health Check Endpoint

Test the health endpoint:

```bash
curl http://localhost:5000/api/v1/health
```

Expected output when running with database:
```json
{
  "success": true,
  "message": "Smart Resource Booking API is operating normally.",
  "data": {
    "status": "healthy",
    "service": "smart-resource-booking-api",
    "environment": "development",
    "uptimeSeconds": 15,
    "timestamp": "2026-10-27T10:30:00.000Z",
    "database": {
      "ready": true,
      "state": "connected"
    }
  }
}
```

If the database is offline or connecting, the endpoint cleanly reports status `503 Service Unavailable` with `status: "degraded"` and `database.ready: false`, without crashing or throwing unhandled exceptions.

### 5. Authentication & Authorization (Prompt 5)

Authentication is implemented with bcrypt password hashing (12 rounds) and signed JWT tokens stored in `httpOnly` cookies with `sameSite: "lax"`.

Endpoints:
- `POST /api/v1/auth/register` — Registers a new user with role `user`. Mass assignment of privileged roles is strictly rejected.
- `POST /api/v1/auth/login` — Authenticates user, verifies password, and sets `auth_token` HTTP-only cookie.
- `POST /api/v1/auth/logout` — Clears the `auth_token` cookie from the client.
- `GET /api/v1/auth/me` — Retrieves current authenticated user's sanitized profile (requires authentication).

Middleware:
- `authenticate`: Extracts and validates JWT from HTTP-only cookie or `Authorization: Bearer <token>` header, verifies user active status in MongoDB, and attaches sanitized `req.user` (`id`, `name`, `email`, `role`, `status`) and `req.userId`.
- `requireRole(...roles)`: Enforces role permissions (e.g. `requireRole('admin')`), returning `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`) if the user lacks the role.

### 6. Resource Discovery & Administrative Management (Prompt 6)

The system supports public browsing of active campus facilities and equipment alongside administrative catalog lifecycle oversight:

Public Endpoints:
- `GET /api/v1/resources` — Paginated catalog discovery with search across name/description/location, category filters (`study-room`, `meeting-room`, `lab-equipment`, `other`), location filter, and capacity range filters (`minCapacity`, `maxCapacity`). Strictly excludes inactive resources.
- `GET /api/v1/resources/:resourceId` — Detailed view of an active resource. Returns `404 Not Found` for nonexistent or inactive resources.

Administrative Endpoints (require `authenticate` + `requireRole('admin')`):
- `POST /api/v1/resources` — Create a new resource with category, capacity, slot duration (multiple of 15 min), and daily operating hours.
- `PATCH /api/v1/resources/:resourceId` — Partial update of permitted resource fields with revalidation.
- `PATCH /api/v1/resources/:resourceId/status` — Activate or deactivate a resource. Deactivating hides it from public discovery while preserving historical records and past bookings.
- `GET /api/v1/admin/resources` — Administrative resource inventory listing both active and inactive resources with status filtering.
- `GET /api/v1/admin/resources/:resourceId` — Administrative resource inspection by ID regardless of status.

### 7. Resource Availability Engine (Prompt 7)

Computes bookable time slots for an active facility or equipment resource on a requested calendar date:

Endpoint:
- `GET /api/v1/resources/:resourceId/availability?date=YYYY-MM-DD` — Public availability discovery.

Key Engine Rules & Exclusions:
- **Half-Open Intervals:** All candidate slots, maintenance periods, and bookings use `[startAt, endAt)` with the overlap rule `existing.start < slot.end && existing.end > slot.start`.
- **Slot Alignment:** Candidate slots are anchored to the configured opening time, incremented by `resource.slotDurationMinutes`, and fit completely within `[openTime, closeTime)`.
- **Operating Hours:** Resolves daily schedule for the requested date. Closed days return `slots: []` with `isOpen: false`.
- **Past-Time Cutoff:** Slots with `startAt <= currentTime` are marked `available: false` with `reason: "PAST_TIME"`.
- **Maintenance Exclusions:** Overlapping `MaintenanceBlock` periods mark slots `available: false` with `reason: "MAINTENANCE"`.
- **Reservation Exclusions:** Confirmed/completed bookings and allocated `ResourceSlot` records mark slots `available: false` with `reason: "RESERVED"`. Cancelled bookings are ignored.
### 8. Booking Concurrency & Slot-Allocation Primitives (Prompt 8)

The system establishes the database and service foundation for reliable, concurrency-safe booking allocation:

- **Persistent Models:**
  - `Booking` (`models/Booking.js`): Tracks reservations with half-open intervals `[startAt, endAt)`, user/resource references, statuses (`confirmed`, `cancelled`, `completed`), cancellation metadata (`cancelledAt`, `cancellationReason`), and compound query indexes (`{ resourceId: 1, status: 1, startAt: 1, endAt: 1 }`, `{ userId: 1, startAt: -1 }`, and `{ status: 1, startAt: 1 }`).
  - `ResourceSlot` (`models/ResourceSlot.js`): Represents atomic fixed-duration slot allocations tied to a resource and specific instant (`slotStartAt`), with unique compound index `{ resourceId: 1, slotStartAt: 1 }` preventing concurrent double-booking.
- **Slot Alignment Validation:**
  - `calculateRequiredSlots(resource, startAt, endAt)` anchors intervals strictly to operating hours and the resource's `slotDurationMinutes`. Rejects unaligned start times, fractional slot durations, closed-day requests, and bookings exceeding daily closing times without silently rounding.
- **Transaction-Safe Allocation Primitives:**
  - `allocateBookingWithSlots({ userId, resourceId, startAt, endAt, notes }, externalSession)`: Executes multi-document allocation inside a Mongoose transaction session. Creates the `Booking` and inserts all required `ResourceSlot` records atomically. Any failure (including duplicate-key conflict code `11000`) rolls back the transaction with zero orphan records.
  - Returns `409 Conflict` (`BOOKING_CONFLICT`) on concurrent slot collisions.
  - Fails safe with `503 Service Unavailable` (`TRANSACTIONS_UNAVAILABLE`) if the MongoDB deployment is standalone and does not support replica set transactions.
- **Clean Slot Release:**
  - `releaseBookingSlots(bookingId, session)` atomically deletes active `ResourceSlot` records associated with a booking, freeing capacity immediately while preserving historical `Booking` records marked `cancelled`.

### 9. Authenticated Booking Creation Workflow (Prompt 9)

Implements the end-to-end reservation-creation workflow connecting authentication, resource scheduling, maintenance conflict checking, and atomic multi-document slot allocation:

Endpoint:
- `POST /api/v1/bookings` — Authenticated reservation creation.

Workflow & Validation Rules:
1. **Authentication & Ownership:** Enforced via `authenticate` middleware; the booking owner is derived strictly from `req.userId`. Client-supplied `userId` or `status` values are strictly rejected.
2. **Payload Validation (`booking.validator.js`):** Requires unambiguous ISO 8601 instant timestamps (`startAt`, `endAt`) with explicit time zone indicator (`Z` or `+/-HH:mm`). Enforces positive duration on half-open interval `[startAt, endAt)`, future start time, 90-day maximum advance booking window, and mass-assignment protection.
3. **Resource Validation:** Confirms the resource exists and is in `active` status.
4. **Schedule & Alignment Rules:** Validates that the requested interval falls entirely within configured operating hours on that calendar day and aligns with the resource's `slotDurationMinutes` grid anchored at opening time.
5. **Conflict Pre-checks:** Verifies no overlapping active `MaintenanceBlock` (`MAINTENANCE_CONFLICT`) or active `Booking` records (`BOOKING_CONFLICT`).
6. **Atomic Allocation:** Executes inside a MongoDB transaction session, creating the `Booking` document and all required `ResourceSlot` records. The unique compound index on `ResourceSlot (resourceId, slotStartAt)` guarantees that concurrent race conditions are rejected at the database level (`BOOKING_CONFLICT`), rolling back the transaction with zero orphaned records.
7. **Sanitized Response:** Returns HTTP `201 Created` with sanitized booking details, resource summary, and allocated slot records.

### 10. Booking Management Workflows (Prompt 10)

Provides complete reservation lifecycle management for authenticated users:

Endpoints:
- `GET /api/v1/bookings/my` — Paginated user booking history with status, resource ID, and date range filters.
- `GET /api/v1/bookings/:bookingId` — Individual booking inspection with ownership enforcement (404 on unowned to prevent enumeration).
- `PATCH /api/v1/bookings/:bookingId/cancel` — Cancels a confirmed future reservation and atomically releases its active slot allocations.
- `PATCH /api/v1/bookings/:bookingId/reschedule` — Reschedules a confirmed future reservation to an aligned new interval with atomic reallocation.

Key Lifecycle Invariants:
1. **Ownership Enforcement:** All actions require authentication; booking ownership is verified against `req.userId`. Attempting to access or mutate another user's booking returns `404 Not Found` (`BOOKING_NOT_FOUND`).
2. **Cancellation Policy:** Only `confirmed` future bookings (`startAt > Date.now()`) can be cancelled. Completed bookings or bookings that have already started reject cancellation (`BOOKING_ALREADY_STARTED`, `INVALID_BOOKING_TRANSITION`). Already cancelled bookings reject duplicate cancellation (`BOOKING_ALREADY_CANCELLED`).
3. **Atomic Slot Release:** Cancelling updates the `Booking` status to `cancelled`, stamps `cancelledAt` and `cancellationReason`, and deletes active `ResourceSlot` records within a single transaction, immediately restoring calendar availability while preserving historical records.
4. **Rescheduling Reallocation:** Rechecks operating hours, slot alignment, maintenance blackouts, and concurrent booking conflicts while accounting for the booking's own allocations. Deletes old slots and inserts new slots atomically. If reallocation fails, the entire transaction is rolled back, leaving the original booking and original slots completely untouched.
5. **Same-Time Rescheduling:** Reschedule requests with start and end timestamps identical to the existing reservation return `200 OK` idempotently without releasing or reallocating slots.

### 11. Admin Booking Management, Resource Maintenance, and Operational Controls (Prompt 11)

Implements protected administrative workflows for reviewing system-wide bookings, managing resource maintenance blackouts, and executing controlled administrative booking cancellations:

Endpoints:
- `GET /api/v1/admin/bookings` — Paginated booking list across all users with deterministic sorting (`startAt: -1, _id: -1`), composable filters (`status`, `resourceId`, `userId`, `category`, `fromDate`, `toDate`), safe populated user and resource profiles, and security field exclusion.
- `PATCH /api/v1/admin/bookings/:bookingId/cancel` — Controlled administrative cancellation of a confirmed booking. Enforces status transition policies, records audit metadata (`cancelledBy`, `cancelledAt`, `cancellationReason`), and executes atomic `ResourceSlot` release inside a MongoDB transaction.
- `POST /api/v1/admin/resources/:resourceId/maintenance` — Schedules a resource maintenance blackout period on half-open interval `[startAt, endAt)`. Enforces conflict detection against existing maintenance blocks (`MAINTENANCE_OVERLAP_CONFLICT`) and confirmed bookings (`MAINTENANCE_BOOKING_CONFLICT`), preventing silent cancellation of user reservations.
- `GET /api/v1/admin/resources/:resourceId/maintenance` — Paginated maintenance blocks for a resource sorted chronologically with date-range filters.
- `DELETE /api/v1/admin/maintenance/:maintenanceId` — Deletes a maintenance block, immediately re-enabling slot availability for the resource without affecting existing bookings.

Key Administrative Invariants:
1. **Strict Role Authorization:** All administrative endpoints require `authenticate` and `requireRole('admin')`. User input in request bodies or query parameters cannot grant administrative privileges.
2. **Maintenance Conflict Protection:** Before creating a maintenance block, the service verifies half-open interval overlap with confirmed bookings (`existing.startAt < maintenance.endAt && existing.endAt > maintenance.startAt`). Conflicting bookings reject maintenance creation with `409 Conflict` (`MAINTENANCE_BOOKING_CONFLICT`), requiring explicit administrative resolution.
3. **Availability Engine Integration:** Maintenance blocks are queried in `calculateResourceAvailability()`, excluding blocked intervals with `reason: "MAINTENANCE"`. Deleting a maintenance block restores bookable slots automatically when within operating hours and unreserved.
4. **Audit Traceability:** Preserves historical `Booking` records with administrative actor tracking (`cancelledBy` ref User, `cancelledAt`, `cancellationReason`) and maintenance attribution (`createdBy` ref User).

### 12. Administrative Operational Analytics & Summary (Prompt 12)

Provides an operational summary and key aggregate metrics across resources, bookings, maintenance blocks, and registered users for the administrative dashboard:

Endpoint:
- `GET /api/v1/admin/analytics/summary` — High-level operational metrics overview (requires `authenticate` + `requireRole('admin')`).

Key Features & Aggregation Invariants:
1. **Zero Full-Document Loading:** All metrics are calculated inside MongoDB via efficient aggregation pipelines (`$facet`, `$group`, `countDocuments`), ensuring constant memory usage regardless of collection size.
2. **Resource Metrics:** Total resources, active resources, inactive resources, and category distribution (`study-room`, `meeting-room`, `lab-equipment`, `other`).
3. **Booking Metrics:** Total reservations, confirmed upcoming (`startAt > now`), confirmed active (`startAt <= now < endAt`), completed, cancelled, and status breakdown.
4. **Maintenance Metrics:** Total recorded blocks, currently in effect (`startAt <= now < endAt`), upcoming, and past expired.
5. **User Metrics:** Total registered accounts, active accounts, disabled accounts, and role breakdown (`user`, `admin`).
6. **Concurrent Pipeline Execution:** Aggregations execute concurrently using `Promise.all()` to achieve minimal endpoint latency.

---

## Client Setup and Development

### 1. Configure Client Environment

```bash
cp client/.env.example client/.env
```

The frontend uses `VITE_API_BASE_URL=http://localhost:5000/api/v1` to communicate with the backend.

### 2. Run the Client

```bash
npm run dev:client
```

Open `http://localhost:5173/` in your browser. The Home page includes an interactive **Test API Connectivity** button that performs a live health check request against the Express backend.

---

## Implementation Status

### Implemented in Prompts 1–17 (Complete Backend Integration, React Frontend Foundation, Application Routing, Shared Layout, API Client, Global UI States, Frontend Authentication, Session Management, Protected Routes, Role-Aware Navigation, Resource Discovery, Resource Details, Availability Calendar, Slot Selection, Booking Creation Workflow, Personal Booking History, and Booking Details)
- **Personal Booking History, Details, Status Indicators, Filtering, and Pagination (Prompt 17):**
  - **Authenticated Booking History (`MyBookingsPage.jsx`, `bookingService.js`):** Connects to `GET /api/v1/bookings/my` using strict query parameter sanitization whitelisting (`page`, `limit`, `status`, `resourceId`, `fromDate`, `toDate`) and full URL search param synchronization (`useSearchParams`).
  - **Status & Date Range Filtering (`BookingFilters.jsx`):** Segmented status tabs (`confirmed`, `completed`, `cancelled`), date pickers (`fromDate`, `toDate`), filter chips with one-click dismiss, and reset button that automatically resets pagination to page 1.
  - **Responsive Booking Cards & List (`BookingCard.jsx`, `BookingList.jsx`):** Adaptive grid/card layout displaying facility name, reference code, status badge, formatted date, time interval with duration, capacity, location, user notes snippet, cancellation banners, and multi-page pagination with page pills and prev/next controls.
  - **Accessible Status Badges (`BookingStatusBadge.jsx`):** Visual indicators combining iconography, semantic variants, and text labels for `confirmed`, `completed`, and `cancelled` statuses.
  - **Authoritative Booking Details View (`BookingDetailsPage.jsx`, `BookingDetailsPanel.jsx`):** Dedicated route `/bookings/:bookingId` fetching verified booking record from `GET /api/v1/bookings/:bookingId`, with 24-character hexadecimal ObjectId pre-validation, comprehensive schedule and resource specifications, cancellation audit record, and defense against data enumeration via consistent 404 handling.
  - **Policy-Aware Booking Actions (`BookingActions.jsx`):** Enforces backend cancellation and rescheduling eligibility (confirmed status + future start time `startAt > Date.now()`), displaying clear non-interactive policy explanations for completed, elapsed, or cancelled reservations while preparing integration hooks for Prompt 18 workflows.
- **Booking Creation Workflow, Submission, Conflict Handling, and Confirmation (Prompt 16):**
  - **Booking API Service (`bookingService.js`):** Centralized communication with Express backend booking endpoints (`POST /api/v1/bookings`, `GET /api/v1/bookings/:bookingId`, `GET /api/v1/bookings/my`). Submits exact payload `{ resourceId, startAt, endAt, notes }` with ISO 8601 timestamps and rejects client-side mass assignment.
  - **Booking Creation Workflow & Pre-validation (`BookingCreatePage.jsx`):** Coordinates selection state passed via router navigation or URL query parameters (`resourceId`, `startAt`, `endAt`). Performs client pre-validation (valid timestamps, positive duration, future start, notes length <= 1000). Includes missing selection empty state with navigation back to discovery.
  - **Booking Summary & Form Presentation (`BookingSummary.jsx`, `BookingForm.jsx`, `BookingSubmitButton.jsx`):** Displays facility specifications (name, category, location, capacity, time zone, formatted calendar date and interval) and optional reservation notes field with character counter.
  - **Duplicate Submission Defense & Concurrency Guard:** Employs synchronous `useRef` submission lock combined with React disabled button state, preventing double-clicks or rapid keyboard submission from dispatching duplicate server requests before state re-renders.
  - **Robust Error & Conflict Handling (`BookingConflictMessage.jsx`):** Parses backend operational error codes (`BOOKING_CONFLICT`, `MAINTENANCE_CONFLICT`, `OUTSIDE_OPERATING_HOURS`, `RESOURCE_INACTIVE`, `UNAUTHENTICATED`). Explains slot contention clearly without automatic blind retries, providing a single-click action to refresh calendar availability and re-select an interval.
  - **Authoritative Booking Confirmation (`BookingConfirmationPage.jsx`, `BookingConfirmation.jsx`):** Displays server-confirmed reservation receipt (unique reference ID, resource details, confirmed time interval, status badge, timestamp, reservation notes). Supports direct navigation and browser refreshes by fetching verified booking data from `GET /api/v1/bookings/:bookingId`.
  - **Availability Cache Invalidation & Workflow Transitions:** Invalidates stale browser availability state upon successful reservation creation, guiding users seamlessly from slot selection to booking creation and authoritative confirmation.
- **Resource Discovery, Details, Availability Calendar, and Slot Selection (Prompt 15):**
  - **Resource Discovery & Catalog (`ResourceDiscoveryPage.jsx`, `ResourceCard.jsx`, `ResourceFilters.jsx`, `ResourceSearch.jsx`, `ResourceGrid.jsx`, `ResourceSummary.jsx`, `resourceService.js`):** Full-featured public resource search with debounced text matching, category filtering (`study-room`, `meeting-room`, `lab-equipment`, `other`), location filtering, min/max capacity boundaries, multi-field sorting, and pagination controls. Includes URL query string synchronization, active filter chips with one-click removal, loading skeletons, and empty state handling.
  - **Resource Specifications & Operating Hours (`ResourceDetailPage.jsx`):** Detailed facility overview displaying capacity, slot duration, time zone, and weekly operating hours schedule table (Monday–Sunday) with open/closed indicators. Communicates inactive resource states clearly to prevent invalid reservation attempts.
  - **Availability Engine Integration (`availabilityService.js`, `availabilityUtils.js`):** Queries `GET /api/v1/resources/:resourceId/availability?date=YYYY-MM-DD` using safe calendar date parsing that avoids time-zone date shifting.
  - **Interactive Date & Slot Selection (`AvailabilityCalendar.jsx`, `AvailabilityStatus.jsx`, `AvailabilitySlotList.jsx`, `SlotSelectionSummary.jsx`):** Date picker enforcing past-date prevention and 90-day advance booking boundaries, quick day steppers ("Today", "Tomorrow"), availability metrics summary, real candidate slot list with status badges (`PAST_TIME`, `MAINTENANCE`, `RESERVED`, `available`), and interactive half-open interval selection `[startAt, endAt)`.
  - **Authentication-Aware Booking Transition (`SlotSelectionSummary.jsx`):** Preserves chosen resource, date, time range, and slot duration in router navigation state; prompts unauthenticated visitors to sign in before continuing while preserving their booking intent across the login redirect.
- **Frontend Authentication & Session Management (Prompt 14):**
  - **Authentication Service (`authService.js`):** Communicates with `/api/v1/auth/register`, `/login`, `/logout`, and `/me` using the centralized API client with `credentials: 'include'` for secure HTTP-only cookie session persistence.
  - **Authentication Context & Hook (`AuthContext.jsx`, `useAuth.js`):** Manages global session state (`user`, `isAuthenticated`, `isAdmin`, `isLoading`, `isInitialized`), handles initial session resolution on app mount, cleanly distinguishes expected 401 unauthenticated responses from network failures, and provides unified `login`, `register`, `logout`, and `refreshUser` actions.
  - **Accessible Auth Forms (`LoginForm.jsx`, `RegisterForm.jsx`):** Input validation, password confirmation matching without submitting extraneous fields, mass-assignment defense, clear error banners with field-level error mapping, and keyboard accessibility.
  - **Authentication Pages (`LoginPage.jsx`, `RegisterPage.jsx`):** Polished user sign-in and account registration pages with automatic redirection of authenticated users and return-path redirection (`location.state.from`) post-login.
  - **Protected Route Guards (`ProtectedRoute.jsx`, `AdminRoute.jsx`):** Restricts access to user booking routes (`/bookings`, `/bookings/:bookingId`) and administrator routes (`/admin`, `/admin/resources`, `/admin/bookings`, `/admin/maintenance`) during and after startup resolution, displaying a dedicated accessible 403 Forbidden Access Denied screen for non-admin authenticated users.
  - **Role-Aware Navigation (`Navbar.jsx`):** Dynamically updates desktop header and mobile drawer navigation based on authentication status and user role, showing user display name chip, admin badge, and functional logout action while preventing layout shifts during initial session resolution.
- **Frontend Architecture & Routing (Prompt 13):** React 19 + Vite 6 client shell, centralized routing hierarchy (`AppRoutes.jsx`, `routes.js`), provider composition (`AppProviders.jsx`), persistent layout shell (`AppLayout`, `Navbar`, `Footer`, `PageContainer`), and custom 404 page (`NotFoundPage`).
- **Centralized API Client:** Robust HTTP client (`apiClient.js`, `lib/apiClient.js`) with configured `VITE_API_BASE_URL`, automatic JSON body serialization, defensive response parsing (guarding against HTML error pages), query string builder, `credentials: 'include'` for cookie-based authentication, and structured `ApiError` with machine-readable error codes and status getters.
- **Accessible Form Primitives:** Semantic form controls (`FormField`, `Input`, `Select`, `Textarea`) with linked `<label>`, helper text, error text, and ARIA attributes (`aria-invalid`, `aria-describedby`).
- **Global Feedback Components:** Reusable states for data loading (`LoadingState`, `LoadingSpinner`), recoverable errors (`ErrorState` with retry callbacks and error code badges), unhandled rendering crashes (`ErrorBoundary`), and accessible confirmation dialogs (`Modal`).
- **Design System Styling:** Comprehensive CSS custom property tokens and responsive styles in `styles.css` covering typography, layout bounding, navigation, cards, alerts, forms, modal backdrops, and feedback states.
- **Backend Architecture:** Express 5 application setup (`createApp`) with security headers, cookie parsing (`cookie-parser`), body parsing, request logging, and configurable CORS origin policy.
- **Database Management:** Robust MongoDB connection management (`connectDatabase`, `disconnectDatabase`, `getDatabaseState`) with URI credential masking, connection lifecycle event logging, and concurrent connection memoization.
- **Process Lifecycle:** Process entry point (`src/server.js`) with startup verification and graceful shutdown handlers for `SIGINT` and `SIGTERM`.
- **Standardized API Conventions:** Master router mounting `/api/v1`, standardized JSON envelopes (`{ success, message, data, code }`), and structured operational errors via `ApiError`.
- **Error Handling & Sanitization:** Centralized error handler (`errorHandler.js`) with Mongoose validation, CastError, duplicate key (email & slot conflict), JWT verification failures (`TokenExpiredError`, `JsonWebTokenError`), and CORS error normalization.
- **Validation Infrastructure:** Extensible request validation middleware (`validate.js`) with reusable validation helpers (`validators/common.js`, `validators/auth.validator.js`, `validators/resource.validator.js`, `validators/booking.validator.js`, `validators/adminBooking.validator.js`, and `validators/maintenance.validator.js`).
- **Authentication & Security:** User model (`models/User.js`) with normalized lowercase email, bcrypt hashing, `comparePassword`, and `toSafeObject` sanitization. Public registration with automatic session creation, login with user-enumeration defense, logout with cookie expiration, and `GET /api/v1/auth/me`.
- **Authorization Infrastructure:** `authenticate` and `requireRole` middleware ensuring that client-provided roles are never trusted and server-side roles dictate access to privileged routes.
- **Resource Management & Discovery:** Resource model (`models/Resource.js`) supporting room and equipment categories, capacity constraints, validated slot durations, and weekly operating hours with closing-time validation. Public search/discovery with regex escaping and pagination metadata. Complete administrator inventory, creation, partial updates, and status activation/deactivation (accessible via `/api/v1/resources` and route aliases on `/api/v1/admin/resources`).
- **Availability Engine:** `GET /api/v1/resources/:resourceId/availability` computing aligned candidate slots from operating hours, applying half-open interval overlap rules, excluding past slots, maintenance blackouts (`MaintenanceBlock.js`), and existing reservations (`Booking.js`, `ResourceSlot.js`).
- **Concurrency-Safe Slot Allocation Primitives:** `Booking` & `ResourceSlot` models with unique compound index `{ resourceId: 1, slotStartAt: 1 }`. Service primitives for slot alignment validation, atomic multi-slot allocation transactions, safe conflict translation (`BOOKING_CONFLICT`), and deployment prerequisite validation (`TRANSACTIONS_UNAVAILABLE`).
- **Authenticated Booking Creation Workflow:** `POST /api/v1/bookings` protected by `authenticate` middleware. Rigorous validation of ISO 8601 instant timestamps, future time, 90-day booking window, and mass assignment rejection. Multi-document transactional allocation creating `Booking` and `ResourceSlot` records atomically, with database-level uniqueness enforcement `{ resourceId: 1, slotStartAt: 1 }` raising `409 Conflict` (`BOOKING_CONFLICT`), and safe failure on standalone topologies (`TRANSACTIONS_UNAVAILABLE`).
- **Booking Management Lifecycle:** User booking history (`GET /api/v1/bookings/my`), detail view (`GET /api/v1/bookings/:bookingId`), atomic cancellation (`PATCH /api/v1/bookings/:bookingId/cancel`), and atomic rescheduling (`PATCH /api/v1/bookings/:bookingId/reschedule`). Enforces ownership, policy checks (future confirmed only), slot release/reallocation atomicity, and idempotent same-time rescheduling.
- **Administrative Booking & Maintenance Operations:** System-wide booking review with multi-field composable filtering (`GET /api/v1/admin/bookings`), transactional administrative booking cancellation (`PATCH /api/v1/admin/bookings/:bookingId/cancel`), resource maintenance blackout creation with confirmed-booking overlap protection (`POST /api/v1/admin/resources/:resourceId/maintenance`), maintenance listing (`GET /api/v1/admin/resources/:resourceId/maintenance`), and maintenance deletion (`DELETE /api/v1/admin/maintenance/:maintenanceId`).
- **Administrative Operational Analytics:** `GET /api/v1/admin/analytics/summary` providing high-level operational statistics and aggregate metrics across resources, bookings, maintenance blocks, and users using memory-efficient MongoDB aggregation pipelines.
- **Diagnostic Health Endpoint:** Live `GET /api/v1/health` distinguishing process liveness from database readiness.
- **API Specification & Architecture Documentation:** Comprehensive and synchronized documentation in `docs/` (`api-specification/api-v1.md`, `architecture/overview.md`, `database-design/data-model.md`, `requirements/project-requirements.md`).

### Planned for Future Prompts
- **Prompt 18+:** React frontend feature implementation (Personal user booking self-service cancellation modal with atomic slot release, interactive rescheduling workflow, and Administrative operational dashboards).
