import mongoose from 'mongoose';

/**
 * ResourceSlot Schema
 *
 * Represents a fixed-duration time slot allocated to a booking for a specific resource.
 * Protected by a compound unique index on (resourceId, slotStartAt) to provide
 * atomic concurrency control against double-booking attempts.
 */
const resourceSlotSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required.'],
      index: true,
    },
    slotStartAt: {
      type: Date,
      required: [true, 'Slot start instant is required.'],
      index: true,
    },
    slotEndAt: {
      type: Date,
      required: [true, 'Slot end instant is required.'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['allocated', 'released'],
      default: 'allocated',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Compound unique index preventing concurrent duplicate slot allocations.
 * An active (allocated) slot cannot exist twice for the same resource at the same start time.
 */
resourceSlotSchema.index({ resourceId: 1, slotStartAt: 1 }, { unique: true });

export const ResourceSlot = mongoose.model('ResourceSlot', resourceSlotSchema);

export default ResourceSlot;
