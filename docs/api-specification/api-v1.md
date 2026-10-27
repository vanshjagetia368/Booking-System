# Planned API specification

## Namespace and status

The planned JSON API namespace is `/api/v1`. The groups below describe intended routes and responsibilities; they are design specifications, not a claim that those endpoints are implemented. The current server scaffold does not yet expose these feature routes.

All booking, availability, ownership, and permission checks must be enforced by the server. API errors should communicate validation failures and booking conflicts clearly without exposing sensitive implementation details.

## Planned groups

| Group | Planned responsibilities | Access |
|---|---|---|
| Authentication | Registration, sign-in, sign-out, and current-account details | Public for registration/sign-in; authenticated for account details and sign-out |
| Resources | Browse/search active resources and inspect details; administrator create/update/activate/deactivate | Public or authenticated reads according to final policy; administrator writes |
| Availability | Query bookable dates and time slots for a resource | Public or authenticated reads according to final policy |
| Bookings | Create reservations, list the current user's bookings, cancel or reschedule eligible bookings | Authenticated; ownership enforced, with authorized administrator actions |
| Maintenance | Define, inspect, update, and remove unavailable periods | Administrator |
| Administration | View/manage reservations and basic usage statistics | Administrator |

## Booking request behavior

Create and reschedule operations must validate the interval, resource status and schedule, maintenance blocks, slot alignment, and authorization on the server. Conflicts must be rejected even when simultaneous requests race. The implementation is planned around fixed-duration `ResourceSlots` protected by a unique `(resourceId, slotStartAt)` index and MongoDB transactions where supported.

Cancellation preserves booking history and releases allocated slots consistently. Rescheduling must atomically validate and allocate its replacement time without leaving partial state. Transaction support requires a replica set or sharded MongoDB deployment; a standalone deployment is insufficient.

Exact endpoint paths, request/response schemas, pagination, and authentication transport will be specified as the corresponding features are implemented.
