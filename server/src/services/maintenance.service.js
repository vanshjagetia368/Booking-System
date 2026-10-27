import mongoose from 'mongoose';
import { MaintenanceBlock } from '../models/MaintenanceBlock.js';
import { Resource } from '../models/Resource.js';
import { Booking } from '../models/Booking.js';
import { ResourceSlot } from '../models/ResourceSlot.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Formats a maintenance block document into a sanitized, safe plain object.
 *
 * @param {object} block - Mongoose MaintenanceBlock document
 * @returns {object}
 */
export function formatMaintenanceBlock(block) {
  const creatorDoc = block.createdBy && typeof block.createdBy === 'object' && block.createdBy._id
    ? block.createdBy
    : null;

  return {
    id: block._id.toString(),
    resourceId: block.resourceId?._id ? block.resourceId._id.toString() : block.resourceId.toString(),
    startAt: block.startAt,
    endAt: block.endAt,
    reason: block.reason,
    createdBy: creatorDoc
      ? {
          id: creatorDoc._id.toString(),
          name: creatorDoc.name,
          email: creatorDoc.email,
        }
      : block.createdBy
        ? block.createdBy.toString()
        : null,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

/**
 * Creates a new administrative maintenance blackout period for a resource.
 *
 * Enforces:
 * 1. Resource existence check.
 * 2. Overlap detection against existing maintenance blocks for the resource.
 * 3. Overlap detection against confirmed bookings (Prompt 11 Section 8).
 * 4. Transactional atomicity where supported by the MongoDB deployment.
 *
 * @param {object} params
 * @param {string} params.resourceId - Target resource ObjectId
 * @param {Date | string} params.startAt - Maintenance start instant
 * @param {Date | string} params.endAt - Maintenance end instant
 * @param {string} [params.reason='Scheduled maintenance'] - Administrative reason
 * @param {string} params.adminUserId - Authenticated administrator ObjectId
 * @returns {Promise<object>} Sanitized created maintenance block
 */
export async function createMaintenanceBlock({
  resourceId,
  startAt,
  endAt,
  reason = 'Scheduled maintenance',
  adminUserId,
}) {
  const startDate = startAt instanceof Date ? startAt : new Date(startAt);
  const endDate = endAt instanceof Date ? endAt : new Date(endAt);

  // 1. Verify that the target resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  // 2. Perform transactional conflict checks and persistence
  const session = await mongoose.startSession();

  try {
    let createdBlock = null;

    const executeWork = async (activeSession) => {
      const sessionOptions = activeSession ? { session: activeSession } : {};

      // 2a. Reject overlapping existing maintenance blocks for the same resource
      const existingMaintenance = await MaintenanceBlock.findOne({
        resourceId: resource._id,
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }, null, sessionOptions);

      if (existingMaintenance) {
        throw ApiError.conflict(
          'The requested maintenance interval overlaps with an existing maintenance blackout period for this resource.',
          'MAINTENANCE_OVERLAP_CONFLICT',
          {
            conflictingMaintenanceBlockId: existingMaintenance._id.toString(),
            startAt: existingMaintenance.startAt,
            endAt: existingMaintenance.endAt,
          },
        );
      }

      // 2b. Overlap check against confirmed bookings (Prompt 11 Section 8)
      // Uses half-open interval condition: existing.startAt < maintenance.endAt && existing.endAt > maintenance.startAt
      const conflictingBookings = await Booking.find({
        resourceId: resource._id,
        status: 'confirmed',
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }, null, sessionOptions).select('_id startAt endAt userId notes').lean();

      if (conflictingBookings.length > 0) {
        throw ApiError.conflict(
          `Cannot schedule maintenance: ${conflictingBookings.length} confirmed booking(s) overlap with the requested interval. The administrator must resolve or cancel conflicting bookings before scheduling maintenance.`,
          'MAINTENANCE_BOOKING_CONFLICT',
          {
            conflictingBookingsCount: conflictingBookings.length,
            conflictingBookings: conflictingBookings.map((b) => ({
              id: b._id.toString(),
              userId: b.userId.toString(),
              startAt: b.startAt,
              endAt: b.endAt,
            })),
          },
        );
      }

      // 2c. Concurrency guard: check for active slot allocations
      const conflictingSlot = await ResourceSlot.findOne({
        resourceId: resource._id,
        slotStartAt: { $lt: endDate },
        slotEndAt: { $gt: startDate },
      }, null, sessionOptions);

      if (conflictingSlot) {
        throw ApiError.conflict(
          'Cannot schedule maintenance: active slot allocations exist within the requested interval.',
          'MAINTENANCE_BOOKING_CONFLICT',
          { conflictingBookingId: conflictingSlot.bookingId?.toString() || null },
        );
      }

      // 2d. Persist new maintenance block
      const newBlock = new MaintenanceBlock({
        resourceId: resource._id,
        startAt: startDate,
        endAt: endDate,
        reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Scheduled maintenance',
        createdBy: adminUserId,
      });

      if (activeSession) {
        await newBlock.save({ session: activeSession });
      } else {
        await newBlock.save();
      }

      createdBlock = newBlock;
    };

    // Try transactional execution where supported by MongoDB replica set
    try {
      session.startTransaction();
      await executeWork(session);
      await session.commitTransaction();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      // If standalone MongoDB without replica set, fall back to non-transactional execution
      if (
        txError.code === 20 ||
        (txError.message && txError.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
      ) {
        await executeWork(null);
      } else {
        throw txError;
      }
    }

    return formatMaintenanceBlock(createdBlock);
  } finally {
    await session.endSession();
  }
}

/**
 * Retrieves a paginated list of maintenance blocks for a specific resource.
 *
 * @param {object} params
 * @param {string} params.resourceId - Target resource ObjectId
 * @param {object} params.queryOptions - Validated query parameters
 * @returns {Promise<{ maintenanceBlocks: object[], pagination: object }>}
 */
export async function listMaintenanceBlocks({ resourceId, queryOptions = {} }) {
  const {
    page = 1,
    limit = 20,
    fromDate = null,
    toDate = null,
  } = queryOptions;

  // 1. Verify resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  // 2. Build composable query
  const query = { resourceId: resource._id };

  if (fromDate || toDate) {
    query.startAt = {};
    if (fromDate) {
      query.startAt.$gte = fromDate;
    }
    if (toDate) {
      query.startAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;

  // Deterministic sorting: chronological order by start time
  const sort = { startAt: 1, createdAt: 1 };

  const [blocks, totalItems] = await Promise.all([
    MaintenanceBlock.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    MaintenanceBlock.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    maintenanceBlocks: blocks.map(formatMaintenanceBlock),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Deactivates/deletes a maintenance block by ID.
 *
 * Removing a maintenance block makes those periods eligible for availability
 * again in calculateResourceAvailability(), provided they are within operating
 * hours and not occupied by another booking.
 *
 * @param {object} params
 * @param {string} params.maintenanceId - MaintenanceBlock ObjectId
 * @param {string} [params.resourceId=null] - Optional resource scope verification
 * @returns {Promise<object>} Sanitized representation of deleted block
 */
export async function deleteMaintenanceBlock({ maintenanceId, resourceId = null }) {
  const block = await MaintenanceBlock.findById(maintenanceId);

  if (!block) {
    throw ApiError.notFound('Maintenance block not found.', 'MAINTENANCE_NOT_FOUND');
  }

  // Ensure scoped consistency if resourceId was provided in route
  if (resourceId && block.resourceId.toString() !== resourceId.toString()) {
    throw ApiError.notFound('Maintenance block not found for this resource.', 'MAINTENANCE_NOT_FOUND');
  }

  await MaintenanceBlock.findByIdAndDelete(maintenanceId);

  return formatMaintenanceBlock(block);
}

export default {
  formatMaintenanceBlock,
  createMaintenanceBlock,
  listMaintenanceBlocks,
  deleteMaintenanceBlock,
};
