import mongoose from 'mongoose';

/**
 * MaintenanceBlock Schema
 *
 * Represents an administrative period during which a facility or equipment
 * resource is unavailable for booking due to maintenance, repair, inspection,
 * or scheduled campus blackout.
 */
const maintenanceBlockSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required.'],
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, 'Maintenance start time is required.'],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, 'Maintenance end time is required.'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Maintenance reason is required.'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters.'],
      default: 'Scheduled maintenance',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
maintenanceBlockSchema.pre('validate', function () {
  if (this.startAt && this.endAt) {
    if (this.startAt >= this.endAt) {
      this.invalidate(
        'endAt',
        'Maintenance end time must be strictly later than start time [startAt, endAt).',
      );
    }
  }
});

/**
 * Compound index to optimize range queries for resource maintenance overlap checks:
 * maintenance.startAt < slot.endAt && maintenance.endAt > slot.startAt
 */
maintenanceBlockSchema.index({ resourceId: 1, startAt: 1, endAt: 1 });

/**
 * Safe plain-object serialization.
 */
maintenanceBlockSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    resourceId: this.resourceId.toString(),
    startAt: this.startAt,
    endAt: this.endAt,
    reason: this.reason,
    createdBy: this.createdBy ? this.createdBy.toString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const MaintenanceBlock = mongoose.model('MaintenanceBlock', maintenanceBlockSchema);

export default MaintenanceBlock;
