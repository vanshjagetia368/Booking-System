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
    app/                    Centralized configuration, route paths, router definitions, and 404 page
    assets/                 Media assets and brand graphics
    components/
      layout/               Navbar, Footer, AppLayout, FeaturePlaceholder
      ui/                   Reusable UI primitives (Button, Alert, Badge, Card, LoadingSpinner, EmptyState, PageHeader)
      forms/                Form components (reserved for upcoming prompts)
      calendar/             Calendar and slot schedule components (reserved for Prompt 6)
      resources/            Resource cards and filter components (reserved for Prompt 6)
    features/
      admin/                Administrator management views (Prompt 8)
      auth/                 Authentication and session views (Prompt 5)
      availability/         Schedule and availability views (Prompt 6)
      bookings/             Reservation workflows and history (Prompt 7)
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
      auth.controller.js    User registration, login, logout, and profile handlers
      health.controller.js  Service liveness and database readiness diagnostic handler
      resource.controller.js Public resource discovery and administrative management handlers
    middleware/             Cross-cutting HTTP middleware
      authenticate.js       JWT verification from HTTP-only cookie or Bearer header
      errorHandler.js       Centralized error handler (sanitizes Mongoose/Mongo errors, excludes production stacks)
      logger.js             Lightweight HTTP logger (redacts headers, tokens, and payloads)
      notFound.js           404 route not found handler
      requireRole.js        Role-based route authorization middleware (e.g. requireRole('admin'))
      validate.js           Request schema validation middleware generator
    models/                 Mongoose schemas and indexes
      Resource.js           Physical resource model (categories, capacity, slot duration, operating hours)
      User.js               User identity model with bcrypt hashing and safe serialization
    routes/                 Express route handlers
      adminResource.routes.js Administrative resource management routes (/admin/resources)
      auth.routes.js        Authentication routes (/register, /login, /logout, /me)
      health.routes.js      Health check route handler
      index.js              Master API v1 router mounting /health, /auth, /resources, /admin/resources
      resource.routes.js    Public and admin resource routes (/resources)
    services/               Business and domain services
      auth.service.js       Token issuance/verification, cookie management, credentials verification
      resource.service.js   Resource CRUD, regex-safe search, category/capacity filters, pagination
    utils/                  Shared backend utilities
      ApiError.js           Structured operational HTTP error class with status and error codes
      apiResponse.js        Standardized JSON response envelope helpers (sendSuccess, sendError)
      asyncHandler.js       Async controller error forwarder for Express
    validators/             Input validation primitives and schema helpers
      auth.validator.js     Registration and login validation with mass-assignment defense
      common.js             Reusable validation primitives (ObjectIds, emails, ISO dates, intervals, pagination)
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

### Implemented in Prompts 1–6 (Full-Stack Foundation, Auth & Resources Complete)
- **Frontend Foundation:** React 19 + Vite 6 client shell, centralized routing, semantic responsive layouts, UI primitives (`Button`, `Alert`, `Badge`, `Card`, `LoadingSpinner`, `EmptyState`, `PageHeader`), interval-compatible date formatters, and centralized API client configured with `credentials: 'include'`.
- **Backend Architecture:** Express 5 application setup (`createApp`) with security headers, cookie parsing (`cookie-parser`), body parsing, request logging, and configurable CORS origin policy.
- **Database Management:** Robust MongoDB connection management (`connectDatabase`, `disconnectDatabase`, `getDatabaseState`) with URI credential masking, connection lifecycle event logging, and concurrent connection memoization.
- **Process Lifecycle:** Process entry point (`src/server.js`) with startup verification and graceful shutdown handlers for `SIGINT` and `SIGTERM`.
- **Standardized API Conventions:** Master router mounting `/api/v1`, standardized JSON envelopes (`{ success, message, data, code }`), and structured operational errors via `ApiError`.
- **Error Handling & Sanitization:** Centralized error handler (`errorHandler.js`) with Mongoose validation, CastError, duplicate key (email conflict), and CORS error normalization.
- **Validation Infrastructure:** Extensible request validation middleware (`validate.js`) with reusable validation helpers (`validators/common.js`, `validators/auth.validator.js`, and `validators/resource.validator.js`).
- **Authentication & Security:** User model (`models/User.js`) with normalized lowercase email, bcrypt hashing, `comparePassword`, and `toSafeObject` sanitization. Public registration with automatic session creation, login with user-enumeration defense, logout with cookie expiration, and `GET /api/v1/auth/me`.
- **Authorization Infrastructure:** `authenticate` and `requireRole` middleware ensuring that client-provided roles are never trusted and server-side roles dictate access to privileged routes.
- **Resource Management & Discovery:** Resource model (`models/Resource.js`) supporting room and equipment categories, capacity constraints, validated slot durations, and weekly operating hours with closing-time validation. Public search/discovery with regex escaping and pagination metadata. Complete administrator inventory, creation, partial updates, and status activation/deactivation.
- **Diagnostic Health Endpoint:** Live `GET /api/v1/health` distinguishing process liveness from database readiness.

### Planned for Future Prompts
- **Prompt 7:** Concurrency-safe booking creation, fixed-duration slot allocations, availability schedule querying, rescheduling, and cancellations.
- **Prompt 8:** Administrator maintenance blackout periods, inventory analytics, and audit logs.
