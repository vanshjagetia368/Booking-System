# Planned MongoDB data model

The collections below are architectural design, not implemented Mongoose schemas. The `createdAt` and `updatedAt` concepts apply to records that need timestamps.

## Collections

### Users

Stores account identity and authorization data:

- Name and normalized email (unique).
- Password hash; never the plaintext password.
- Role, including ordinary user and administrator.
- Account status.
- Creation and update timestamps.

### Resources

Stores bookable facility or equipment information:

- Name, description, category, and location.
- Capacity where applicable.
- Operating schedule and bookable slot duration.
- Active/inactive status.
- Creation and update timestamps.

### Bookings

Stores reservation history:

- References to the user and resource.
- Start and end instants.
- Status: `confirmed`, `cancelled`, or `completed`.
- Cancellation information where appropriate.
- Creation and update timestamps.

Cancellation changes a booking's status; it does not erase the historical record.

### ResourceSlots

Stores allocation of fixed-duration resource slots to bookings:

- Resource reference and `slotStartAt`.
- Booking reference or equivalent allocation ownership.
- Slot state if needed by the eventual implementation.

A unique compound index on `(resourceId, slotStartAt)` is required to prevent two concurrent bookings from claiming the same resource slot.

### MaintenanceBlocks

Stores periods during which a resource is unavailable:

- Resource reference.
- Start and end instants.
- Reason or administrative metadata where appropriate.
- Creation and update timestamps.

## Relationships and consistency

- A user can have many bookings; each booking refers to one user.
- A resource can have many bookings, allocated slots, and maintenance blocks.
- A booking can own multiple resource slots, one for each fixed-duration increment in its interval.
- Maintenance blocks exclude overlapping requested slots for their resource.
- Slot allocation and booking persistence must be atomic. MongoDB transactions require a replica set or a sharded cluster; standalone MongoDB deployments cannot provide the required multi-document transaction behavior.

Detailed field validation, retention, and schema/index definitions will be finalized alongside implementation. In particular, all stored times should use a consistent instant representation and schedule interpretation.
