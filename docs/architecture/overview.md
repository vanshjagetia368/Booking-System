# Application architecture

## Client/server separation

The React application in `client/` is the presentation layer. It uses React Router for navigation and a centralized service in `client/src/services/` for HTTP communication. The client may provide immediate input feedback, but it is never authoritative for booking rules, permissions, or availability.

The Express application in `server/` exposes the versioned HTTP API. It owns validation, authentication and authorization, booking rules, and persistence through Mongoose and MongoDB. Client and server configuration is supplied through separate local environment files; example files contain non-secret defaults only.

## Planned backend layers

- **Routes** map HTTP paths and methods to middleware and controllers.
- **Middleware** handles cross-cutting concerns such as authentication and authorization.
- **Validators** verify request shapes and input constraints.
- **Controllers** translate HTTP requests and responses and delegate business work.
- **Services** implement application rules and coordinate persistence.
- **Models** define Mongoose schemas, indexes, and collection relationships.
- **Config** loads and validates environment-dependent settings and database connectivity.
- **Utilities and jobs** support shared, non-domain-specific work and scheduled tasks where needed.

Routes and feature-specific layers are scaffolding for later prompts; the booking and administration APIs are not implemented yet.

## Booking invariants

These rules are mandatory for future booking implementation:

1. Intervals use half-open semantics: `[start, end)`.
2. Existing and requested intervals overlap exactly when `existing.start < requested.end` and `existing.end > requested.start`.
3. Thus, a reservation ending at 11:00 and another beginning at 11:00 are adjacent, not overlapping.
4. The server enforces all booking validation and authorization even if the client also validates input.
5. The server rejects invalid time ranges and enforces each resource's bookable schedule.
6. Inactive resources and maintenance periods cannot be booked.
7. Booking statuses include `confirmed`, `cancelled`, and `completed`.
8. Cancellation preserves the booking's historical record and safely releases its allocated slots.
9. Rescheduling validates and allocates the replacement time without leaving partial allocations.
10. Checking availability and then inserting a booking is not sufficient protection against concurrent attempts.

## Concurrency and transaction requirements

The planned allocation model uses fixed-duration slots (for example, 30-minute increments) and a unique compound index on `(resourceId, slotStartAt)`. A booking operation must allocate all required slots and persist its booking atomically, using MongoDB transactions where supported. Cancellation and rescheduling must also preserve consistency across booking and slot records.

MongoDB transactions require a replica set or a sharded cluster; a standalone MongoDB server does not support multi-document transactions. Later implementation and setup documentation must state and verify this deployment requirement rather than silently relying on it.
