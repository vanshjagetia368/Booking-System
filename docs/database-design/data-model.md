# MongoDB Data Model and Concurrency Architecture

This document specifies the MongoDB collections, Mongoose schemas, indexing strategies, and transactional allocation invariants for the Smart Resource Booking System.

---

## Collections and Schemas

### 1. Users (`server/src/models/User.js`)
Stores account identity and authorization data:
- `name`: String, 2–50 characters, trimmed.
- `email`: Normalized, trimmed, lowercase string with a unique index.
- `password`: Salted bcrypt hash (12 rounds); never stored or returned in plaintext.
- `role`: Enum `['user', 'admin']`, defaulting to `user`. Public registration cannot assign administrative roles.
- `status`: Enum `['active', 'disabled']`, defaulting to `active`.
- `createdAt` and `updatedAt`: Auto-managed timestamps.

### 2. Resources (`server/src/models/Resource.js`)
Stores bookable physical facilities and campus equipment:
- `name`: String, 2–100 characters, trimmed.
- `description`: String, max 1000 characters, trimmed.
- `category`: Enum `['study-room', 'meeting-room', 'lab-equipment', 'other']`.
- `location`: String, 2–100 characters, trimmed.
- `capacity`: Integer, 1–1000.
- `slotDurationMinutes`: Integer, 15–480, multiple of 15 (default `30`).
- `operatingHours`: Weekly schedule object (`monday` to `sunday`), each day specifying `isOpen` (boolean), `openTime` (HH:mm), and `closeTime` (HH:mm). Invariant: `openTime < closeTime` when open.
- `timeZone`: Facility time zone (default `'UTC'`).
- `status`: Enum `['active', 'inactive']`, defaulting to `active`.
- **Indexes:**
  - `{ status: 1, category: 1 }` (compound discovery index)
  - `{ name: 'text', description: 'text', location: 'text' }` (text search index)

### 3. Bookings (`server/src/models/Booking.js`)
Stores reservation lifecycles and permanent audit history:
- `userId`: ObjectId reference to `Users`, required.
- `resourceId`: ObjectId reference to `Resources`, required.
- `startAt`: Date (instant), required.
- `endAt`: Date (instant), required. Invariant: `startAt < endAt`.
- `status`: Enum `['confirmed', 'cancelled', 'completed']`, defaulting to `confirmed`.
- `notes`: Optional string, max 1000 characters.
- `cancellationReason`: Optional string, max 500 characters.
- `cancelledAt`: Optional timestamp.
- `cancelledBy`: ObjectId reference to `Users`, optional. Tracks administrative or user identity performing the cancellation.
- **Indexes:**
  - `{ resourceId: 1, status: 1, startAt: 1, endAt: 1 }` (interval overlap and active reservation checks)
  - `{ userId: 1, startAt: -1 }` (user reservation history queries)
  - `{ status: 1, startAt: 1 }` (lifecycle management queries)

*Audit Invariant:* Cancellation updates `status: 'cancelled'`, records `cancelledAt`, `cancellationReason`, and `cancelledBy`, and releases active slot records. It never deletes the historical `Booking` document.

### 4. ResourceSlots (`server/src/models/ResourceSlot.js`)
Stores fixed-duration slot allocations to enforce atomic concurrency safety:
- `resourceId`: ObjectId reference to `Resources`, required.
- `slotStartAt`: Date (instant), required.
- `slotEndAt`: Date (instant), required. Invariant: `slotStartAt < slotEndAt`.
- `bookingId`: ObjectId reference to `Bookings`, required, indexed.
- `createdAt` and `updatedAt`: Auto-managed timestamps.
- **Unique Compound Index:**
  ```javascript
  { resourceId: 1, slotStartAt: 1 } // unique: true
  ```
  Guarantees that two concurrent operations cannot allocate the same resource slot at the same instant.

### 5. MaintenanceBlocks (`server/src/models/MaintenanceBlock.js`)
Stores periods during which a resource is unavailable due to maintenance, repair, or inspection:
- `resourceId`: ObjectId reference to `Resources`, required.
- `startAt`: Date (instant), required.
- `endAt`: Date (instant), required. Invariant: `startAt < endAt`.
- `reason`: String, max 500 characters, default `'Scheduled maintenance'`.
- `createdBy`: ObjectId reference to `Users`.
- **Indexes:**
  - `{ resourceId: 1, startAt: 1, endAt: 1 }` (interval overlap checks)

---

## Scheduling and Concurrency Invariants

### 1. Half-Open Intervals
All intervals use half-open semantics: `[startAt, endAt)`. Two intervals `A` and `B` overlap if and only if:
```text
A.start < B.end && A.end > B.start
```
Adjacent intervals (e.g. `A.end === B.start`) are compatible and do not conflict.

### 2. Slot-Grid Alignment
A requested reservation `[startAt, endAt)` must align with the resource's `slotDurationMinutes` grid anchored to the day's configured opening time:
- `(startAt - openInstant) % slotDurationMs === 0`
- `(endAt - startAt) % slotDurationMs === 0`
- `startAt >= openInstant` and `endAt <= closeInstant`
- Single bookings spanning multiple contiguous increments allocate one `ResourceSlot` per fixed duration. Partial or unaligned intervals are rejected.

### 3. Transaction-Safe Allocation Primitives
Multi-document allocation (`server/src/services/bookingAllocation.service.js`) coordinates `Bookings` and `ResourceSlots` inside a MongoDB transaction session:
1. Verify operating schedule, interval alignment, and future start time.
2. Verify that no overlapping `MaintenanceBlock` exists.
3. Verify that no overlapping active `Booking` exists.
4. Insert `Booking` document.
5. Insert required `ResourceSlot` documents with `{ session }`.
6. Commit transaction.

If a concurrent request attempts to reserve an identical slot, the unique index `{ resourceId: 1, slotStartAt: 1 }` triggers a duplicate key error (`E11000`), the transaction aborts, and the service translates the error to `ApiError.conflict('One or more requested time slots have already been reserved by a concurrent booking.', 'BOOKING_CONFLICT')`.

### 4. Cancellation and Slot Release
When a reservation is cancelled:
1. The `Booking` record status transitions to `'cancelled'`.
2. Associated `ResourceSlot` records are deleted via `releaseBookingSlots(bookingId)`.
3. Releasing the slots frees the unique index claim on `(resourceId, slotStartAt)`, making those time blocks available for new reservations while preserving the historical booking audit record.

### 5. Rescheduling Compatibility
Rescheduling validates the new interval against schedule and maintenance rules, allocates replacement `ResourceSlots`, and updates the booking's `startAt` and `endAt` inside a single atomic transaction.

---

## MongoDB Deployment Prerequisites for Transactions

Multi-document transactions require a MongoDB deployment running as a **replica set** or a **sharded cluster** (`mongos`):
- **Local Development:** If running a local `mongod`, initialize it as a single-node replica set (`mongod --replSet rs0` and run `rs.initiate()`).
- **Cloud / Production:** MongoDB Atlas clusters and managed replica sets natively support multi-document transactions.
- **Standalone Instance Handling:** On standalone MongoDB instances without replica set support, attempting multi-document transactions yields error code `20` (`Transaction numbers are only allowed on a replica set member or mongos`). The service detects this and fails safe with status `503 Service Unavailable` (`TRANSACTIONS_UNAVAILABLE`), preventing partial or uncoordinated writes.

---

## Administrative Operational Analytics Aggregation Design

To support administrative summary reporting (`GET /api/v1/admin/analytics/summary`) without loading full documents into application memory, the system uses targeted MongoDB aggregation pipelines:

1. **Resource Distribution:** `$group` on `category` with `$sum: 1`, combined with indexed status counts via `countDocuments({ status })`.
2. **Booking Lifecycle Breakdown:** Uses a `$facet` pipeline on `Bookings` with `$match` conditions:
   - `confirmedUpcoming`: `{ status: 'confirmed', startAt: { $gt: now } }`
   - `confirmedActive`: `{ status: 'confirmed', startAt: { $lte: now }, endAt: { $gt: now } }`
   - `completed`: `{ status: 'completed' }`
   - `cancelled`: `{ status: 'cancelled' }`
   - `byStatus`: `$group` by status with count.
3. **Maintenance Breakdown:** `$facet` pipeline on `MaintenanceBlocks`:
   - `inEffectNow`: `{ startAt: { $lte: now }, endAt: { $gt: now } }`
   - `upcoming`: `{ startAt: { $gt: now } }`
   - `past`: `{ endAt: { $lte: now } }`
4. **User Distribution:** Grouped by `role` and counts by account `status` (`active`, `disabled`).

All aggregation facets run concurrently via `Promise.all()` to achieve minimal latency and zero memory overhead.

