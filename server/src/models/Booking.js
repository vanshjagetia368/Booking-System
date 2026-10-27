import mongoose from 'mongoose';

/**
 * Supported booking statuses.
 */
export const BOOKING_STATUSES = [
  'confirmed',
  'cancelled',
  'completed',
];

/**
 * Booking Schema
 *
 * Represents a reservation for a facility or equipment resource.
 * Confirmed bookings block slot availability across their [startAt, endAt) interval.
 * Cancelled bookings do not block availability.
 */
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.'],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required.'],
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, 'Booking start time is required.'],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, 'Booking end time is required.'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: 'Booking status must be one of: {VALUES}.',
      },
      default: 'confirmed',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters.'],
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters.'],
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
 * Validates that startAt precedes endAt: [startAt, endAt)
 */
bookingSchema.pre('validate', function () {
  if (this.startAt && this.endAt) {
    if (this.startAt >= this.endAt) {
      this.invalidate(
        'endAt',
        'Booking end time must be strictly later than start time [startAt, endAt).',
      );
    }
  }
});

/**
 * Compound index for querying active bookings by resource and time range:
 * booking.startAt < slot.endAt && booking.endAt > slot.startAt
 */
bookingSchema.index({ resourceId: 1, status: 1, startAt: 1, endAt: 1 });

/**
 * Compound index for retrieving a user's booking history sorted by start time:
 */
bookingSchema.index({ userId: 1, startAt: -1 });

/**
 * Compound index for status-based lifecycle queries and completion jobs:
 */
bookingSchema.index({ status: 1, startAt: 1 });

/**
 * Safe plain-object serialization.
 */
bookingSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    resourceId: this.resourceId.toString(),
    startAt: this.startAt,
    endAt: this.endAt,
    status: this.status,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
