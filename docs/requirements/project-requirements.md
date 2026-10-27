# Product requirements

## Purpose

Smart Resource Booking System helps people discover and reserve shared campus or organizational resources, including study rooms, meeting rooms, and laboratory equipment. Administrators manage the resources, schedules, maintenance periods, and reservations.

## Essential user capabilities

### Ordinary user

- Register and sign in.
- Browse and search active resources and inspect resource details.
- View available booking dates and time slots.
- Create reservations.
- View personal booking history and upcoming bookings.
- Cancel or reschedule an eligible reservation.
- Receive clear validation and booking-conflict messages.

### Administrator

- Sign in with an account that has administrator privileges.
- Create, update, activate, and deactivate resources.
- Configure operating hours and bookable time increments.
- Define maintenance and other unavailable periods.
- View and manage reservations, including authorized cancellation.
- View basic usage and booking statistics.

### Booking system

- Validate dates, times, availability, and authorization on the server.
- Prevent conflicting reservations, including concurrent attempts.
- Reject invalid, past, unavailable, and out-of-hours reservations as applicable.
- Preserve booking history when a reservation is cancelled.
- Enforce reservation ownership and administrator permissions.

## Core Data Concepts

The implemented MongoDB collections and relationships are specified in [the database design](../database-design/data-model.md). They include `Users`, `Resources`, `Bookings`, `ResourceSlots`, and `MaintenanceBlocks`. All schemas, validation rules, unique indexes, and audit fields are fully implemented and verified.

## Essential scope and exclusions

The capabilities above represent the core product scope. Out-of-scope enhancements such as payments, complex rate-limiting infrastructure, external calendar synchronization, real-time WebSockets, and AI recommendations are deliberately excluded to preserve architectural simplicity and reliability.

## Backend Implementation Status (Prompts 1–12)

The backend layer is fully integrated, operational, and prepared for frontend integration:
- **Authentication & Authorization:** Secure registration, login, logout, and profile endpoints with bcrypt hashing, HTTP-only JWT cookies, and role-based route guards (`user`, `admin`).
- **Resource Management & Discovery:** Full catalog search, category/capacity filtering, operating schedule configuration, and administrative status lifecycle controls.
- **Availability Engine:** Computes bookable candidate slots respecting half-open interval overlap rules, resource operating hours, past-time cutoffs, maintenance blackouts, and confirmed bookings.
- **Transactional Slot Allocation:** Atomic multi-slot allocation primitives utilizing Mongoose transaction sessions and compound unique indexes (`resourceId` + `slotStartAt`) to guarantee concurrency safety.
- **Booking Lifecycle:** Authenticated user reservation creation, personal booking history, detail inspection, cancellation, and rescheduling with strict ownership validation and atomic slot reallocation.
- **Administration & Maintenance:** Administrative booking overview with composable filters, controlled cancellation, maintenance blackout scheduling with conflict pre-checks, maintenance deletion, and operational analytics summary (`GET /api/v1/admin/analytics/summary`).
- **Operational Readiness:** Centralized error handling, standardized JSON envelopes, diagnostic health endpoint (`GET /api/v1/health`), and configurable CORS.
