# Smart Resource Booking System

Smart Resource Booking System is a web application for discovering and booking shared facilities such as study rooms, meeting rooms, and laboratory equipment. It is intended to give users a clear booking experience while providing administrators with tools to manage resources and reservations.

This repository is structured as a decoupled full-stack application using npm workspaces.

---

## Technology Stack

- **Client:**
  - React 19
  - Vite 6
  - JavaScript / JSX (ES modules)
  - React Router 7
  - Vanilla CSS design system with custom properties and responsive layouts
  - Centralized API client with safe error handling and JSON parsing
- **Server:** Node.js, Express, JavaScript ES modules, and Mongoose.
- **Database:** MongoDB (replica set or sharded cluster required for multi-document transaction-safe slot reservations).
- **Configuration:** Environment variables; local secret-bearing environment files are excluded from Git.
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
      calendar/             Calendar and slot schedule components (reserved for Prompt 5)
      resources/            Resource cards and filter components (reserved for Prompt 4)
    features/
      admin/                Administrator management views (Prompt 7)
      auth/                 Authentication and session views (Prompt 3)
      availability/         Schedule and availability views (Prompt 5)
      bookings/             Reservation workflows and history (Prompt 6)
      resources/            Home overview and resource catalog views (Prompts 2 & 4)
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
docs/
  requirements/             Product scope, user roles, and invariants
  architecture/             Decoupled architecture and transaction-safe slot allocation design
  database-design/          Planned MongoDB collections and relationships
  api-specification/        Planned versioned HTTP API (/api/v1)
```

---

## Client Setup and Development

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

Or target the client workspace specifically:

```bash
npm install --workspace @smart-resource-booking/client
```

### 2. Environment Configuration

Create a local environment file in `client/`:

```bash
cp client/.env.example client/.env
```

The default variable is:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> **Security Notice:**
> Variables prefixed with `VITE_` are embedded directly into the compiled client-side JavaScript bundle and are publicly inspectable by any user in their browser. Never place private secrets, passwords, database credentials, or secret keys in client environment files.

### 3. Run the Development Server

Start the Vite development server from the repository root:

```bash
npm run dev:client
```

Or directly from the `client/` folder:

```bash
cd client
npm run dev
```

The application will be accessible at `http://localhost:5173/`.

### 4. Build and Preview for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview --workspace @smart-resource-booking/client
```

---

## Implementation Status

### Implemented in Prompt 2 (Frontend Foundation)
- **Application Shell & Centralized Routing:** Complete route hierarchy in `client/src/app/AppRoutes.jsx` mapping landing, resources, authentication, bookings, and administration views.
- **Responsive Layout:** Semantic `<header>`, `<nav>`, `<main>`, `<footer>` structure with accessible skip-to-content links, active link states, and responsive mobile navigation drawer.
- **Reusable UI Primitives (`client/src/components/ui/`):**
  - `Button`: Polymorphic element support (`as={Link}`), variants (`primary`, `secondary`, `outline`, `danger`, `ghost`), sizes, and loading state.
  - `LoadingSpinner`: Accessible SVG animation with screen-reader live status.
  - `Alert`: Semantic alert feedback with SVG iconography for `info`, `success`, `warning`, and `error`.
  - `Badge`: Status tags for resource categories and reservation statuses (`confirmed`, `cancelled`, `completed`).
  - `Card`: Structured container components (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
  - `PageHeader`: Consistent page titles, descriptions, and action button slots.
  - `EmptyState`: Clean fallback container for empty search results or bookings.
- **Centralized API Client (`client/src/services/apiClient.js`):** Unified HTTP wrapper supporting GET, POST, PUT, PATCH, DELETE, query parameter encoding, safe JSON/text parsing, and typed `ApiError` instances.
- **Shared Utilities (`client/src/utils/`):** Date and time formatters compatible with half-open intervals `[start, end)` (`formatDate`, `formatTime`, `formatTimeRange`, `formatDuration`) and an error normalizer (`normalizeErrorMessage`).
- **Interactive Home Overview:** Live UI primitive state explorer, navigation cards, and an honest backend connectivity verification tool.
- **Structured Feature Placeholders:** Honestly communicates status on unbuilt feature routes without fabricated mock data or fake transactions.

### Still Planned (Future Prompts)
- **Prompt 3:** User authentication, password hashing, JWT sessions, and role permissions.
- **Prompt 4:** Resource discovery, search, category filters, and capacity matching.
- **Prompt 5:** Resource availability calendar and bookable slot computation.
- **Prompt 6:** Transactional booking workflows, personal reservation history, cancellations, and rescheduling.
- **Prompt 7:** Administrator inventory controls, operating schedule configuration, and maintenance blackout intervals.
- **Backend & Database:** Express route handlers, Mongoose schemas, and atomic slot index enforcement.
