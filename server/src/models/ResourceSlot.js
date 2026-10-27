import mongoose from 'mongoose';

/**
 * ResourceSlot Schema
 *
 * Represents an active, allocated fixed-duration time slot for a resource.
 * Protected by a compound unique index on (resourceId, slotStartAt) to provide
 * database-level concurrency protection against simultaneous double-booking attempts.
 */
const resourceSlotSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required.'],
    },
    slotStartAt: {
      type: Date,
      required: [true, 'Slot start instant is required.'],
    },
    slotEndAt: {
      type: Date,
      required: [true, 'Slot end instant is required.'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required.'],
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
 * Validates that slotStartAt precedes slotEndAt
 */
resourceSlotSchema.pre('validate', function () {
  if (this.slotStartAt && this.slotEndAt) {
    if (this.slotStartAt >= this.slotEndAt) {
      this.invalidate(
        'slotEndAt',
        'Slot end time must be strictly later than slot start time.',
      );
    }
  }
});

/**
 * Compound unique index preventing concurrent duplicate slot allocations.
 * Guarantees that two concurrent transactions cannot allocate the same resource
 * at the same start time.
 */
resourceSlotSchema.index({ resourceId: 1, slotStartAt: 1 }, { unique: true });

/**
 * Safe plain-object serialization.
 */
resourceSlotSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    resourceId: this.resourceId.toString(),
    slotStartAt: this.slotStartAt,
    slotEndAt: this.slotEndAt,
    bookingId: this.bookingId ? this.bookingId.toString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const ResourceSlot = mongoose.model('ResourceSlot', resourceSlotSchema);

export default ResourceSlot;
