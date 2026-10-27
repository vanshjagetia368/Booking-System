import mongoose from 'mongoose';

/**
 * Supported resource categories.
 */
export const RESOURCE_CATEGORIES = [
  'study-room',
  'meeting-room',
  'lab-equipment',
  'other',
];

/**
 * Supported resource lifecycle statuses.
 */
export const RESOURCE_STATUSES = [
  'active',
  'inactive',
];

/**
 * Canonical days of the week in Monday-first order.
 */
export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/**
 * Default operating hours schedule:
 * Mon-Fri: 08:00 - 20:00
 * Sat: 09:00 - 17:00
 * Sun: Closed
 */
export const DEFAULT_OPERATING_HOURS = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
};

/**
 * 24-hour time string regex: "HH:mm" from 00:00 to 23:59.
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Single day operating hours schema definition.
 */
const dayScheduleSchema = new mongoose.Schema(
  {
    isOpen: {
      type: Boolean,
      required: true,
      default: true,
    },
    openTime: {
      type: String,
      default: '08:00',
      validate: {
        validator(v) {
          if (!this.isOpen) return true;
          return typeof v === 'string' && TIME_REGEX.test(v);
        },
        message: 'openTime must be in 24-hour HH:mm format (00:00 - 23:59).',
      },
    },
    closeTime: {
      type: String,
      default: '20:00',
      validate: {
        validator(v) {
          if (!this.isOpen) return true;
          return typeof v === 'string' && TIME_REGEX.test(v);
        },
        message: 'closeTime must be in 24-hour HH:mm format (00:00 - 23:59).',
      },
    },
  },
  { _id: false },
);

/**
 * Validates that closeTime is strictly later than openTime when open.
 */
dayScheduleSchema.pre('validate', function () {
  if (this.isOpen && this.openTime && this.closeTime) {
    if (this.openTime >= this.closeTime) {
      this.invalidate(
        'closeTime',
        `Closing time (${this.closeTime}) must be later than opening time (${this.openTime}).`,
      );
    }
  }
});

/**
 * Weekly operating hours schedule schema containing all 7 days.
 */
const weeklyScheduleSchema = new mongoose.Schema(
  {
    monday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.monday }) },
    tuesday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.tuesday }) },
    wednesday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.wednesday }) },
    thursday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.thursday }) },
    friday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.friday }) },
    saturday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.saturday }) },
    sunday: { type: dayScheduleSchema, default: () => ({ ...DEFAULT_OPERATING_HOURS.sunday }) },
  },
  { _id: false },
);

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required.'],
      trim: true,
      minlength: [2, 'Resource name must be at least 2 characters.'],
      maxlength: [100, 'Resource name cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Resource category is required.'],
      enum: {
        values: RESOURCE_CATEGORIES,
        message: 'Category must be one of: {VALUES}.',
      },
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Resource location is required.'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters.'],
      maxlength: [100, 'Location cannot exceed 100 characters.'],
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Resource capacity is required.'],
      min: [1, 'Capacity must be at least 1.'],
      max: [1000, 'Capacity cannot exceed 1000.'],
      validate: {
        validator: Number.isInteger,
        message: 'Capacity must be an integer.',
      },
      index: true,
    },
    slotDurationMinutes: {
      type: Number,
      required: [true, 'Slot duration in minutes is required.'],
      default: 30,
      min: [15, 'Slot duration must be at least 15 minutes.'],
      max: [480, 'Slot duration cannot exceed 480 minutes (8 hours).'],
      validate: {
        validator(v) {
          return Number.isInteger(v) && v % 15 === 0;
        },
        message: 'Slot duration must be an integer multiple of 15 minutes (e.g. 15, 30, 45, 60).',
      },
    },
    operatingHours: {
      type: weeklyScheduleSchema,
      default: () => ({ ...DEFAULT_OPERATING_HOURS }),
    },
    timeZone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: RESOURCE_STATUSES,
        message: 'Status must be one of: {VALUES}.',
      },
      default: 'active',
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
    toObject: {
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
 * Compound index for the primary public discovery query (active resources by category).
 */
resourceSchema.index({ status: 1, category: 1 });

/**
 * Compound text index for text search across name, description, and location.
 */
resourceSchema.index({
  name: 'text',
  description: 'text',
  location: 'text',
});

/**
 * Returns a sanitized plain object representation of the resource.
 *
 * @returns {object}
 */
resourceSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    category: this.category,
    location: this.location,
    capacity: this.capacity,
    slotDurationMinutes: this.slotDurationMinutes,
    operatingHours: this.operatingHours,
    timeZone: this.timeZone || 'UTC',
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
