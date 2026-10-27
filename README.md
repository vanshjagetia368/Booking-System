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
      health.controller.js  Service liveness and database readiness diagnostic handler
    middleware/             Cross-cutting HTTP middleware
      errorHandler.js       Centralized error handler (sanitizes Mongoose/Mongo errors, excludes production stacks)
      logger.js             Lightweight HTTP logger (redacts headers, tokens, and payloads)
      notFound.js           404 route not found handler
      validate.js           Request schema validation middleware generator
    models/                 Mongoose schemas and indexes (reserved for Prompts 5-8)
    routes/                 Express route handlers
      health.routes.js      Health check route handler
      index.js              Master API v1 router mounting /health and reserving future namespaces
    services/               Business and domain services (reserved for Prompts 5-8)
    utils/                  Shared backend utilities
      ApiError.js           Structured operational HTTP error class with status and error codes
      apiResponse.js        Standardized JSON response envelope helpers (sendSuccess, sendError)
      asyncHandler.js       Async controller error forwarder for Express
    validators/             Input validation primitives and schema helpers
      common.js             Reusable validation primitives (ObjectIds, emails, ISO dates, intervals, pagination)
    app.js                  Express application setup (CORS, security headers, middleware, routes)
    server.js               Process entry point (database connection, HTTP listening, graceful shutdown)
  .env.example              Template for backend environment variables
  package.json              Server workspace manifest and scripts
  server.js                 Root process entry wrapper delegating to src/server.js
docs/
  requirements/             Product scope, user roles, and invariants
  architecture/             Decoupled architecture and transaction-safe slot allocation design
  database-design/          Planned MongoDB collections and relationships
  api-specification/        API v1 specification, response convention, and health endpoint
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
| `JWT_SECRET` | Reserved for future authentication modules (Prompt 5) | `dev_jwt_secret_placeholder` |
| `JWT_EXPIRES_IN` | Reserved token expiration window | `7d` |

> **Security Note:**
> Never commit `.env` to Git or expose database connection strings, database credentials, or JWT secrets to the client frontend.

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

### Implemented in Prompts 1–4 (Full-Stack Foundation Complete)
- **Frontend Foundation:** React 19 + Vite 6 client shell, centralized routing, semantic responsive layouts, UI primitives (`Button`, `Alert`, `Badge`, `Card`, `LoadingSpinner`, `EmptyState`, `PageHeader`), interval-compatible date formatters, and centralized API client.
- **Backend Architecture:** Express 5 application setup (`createApp`) with security headers, body parsing, request logging, and configurable CORS origin policy.
- **Database Management:** Robust MongoDB connection management (`connectDatabase`, `disconnectDatabase`, `getDatabaseState`) with URI credential masking, connection lifecycle event logging, and concurrent connection memoization.
- **Process Lifecycle:** Process entry point (`src/server.js`) with startup verification and graceful shutdown handlers for `SIGINT` and `SIGTERM`.
- **Standardized API Conventions:** Master router mounting `/api/v1`, standardized JSON envelopes (`{ success, message, data, code }`), and structured operational errors via `ApiError`.
- **Error Handling & Sanitization:** Centralized error handler (`errorHandler.js`) with Mongoose validation, CastError, duplicate key, and CORS error normalization.
- **Validation Infrastructure:** Extensible request validation middleware (`validate.js`) with reusable validation helpers (`validators/common.js`) for ObjectIds, emails, ISO dates, half-open intervals, pagination, and enums.
- **Diagnostic Health Endpoint:** Live `GET /api/v1/health` distinguishing process liveness from database readiness.
- **Frontend/Backend Integration:** Seamless alignment between frontend `apiClient.js` and backend `/api/v1` namespace, verified via end-to-end connectivity test.

### Planned for Future Prompts
- **Prompt 5:** User authentication, password hashing (bcrypt), JWT sessions, and role permissions.
- **Prompt 6:** Resource catalog, category filtering, operating hours, and availability calendars.
- **Prompt 7:** Concurrency-safe booking creation, fixed-duration slot allocations, rescheduling, and cancellations.
- **Prompt 8:** Administrator inventory oversight, maintenance blackouts, and audit logs.
