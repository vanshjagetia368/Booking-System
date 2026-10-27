import {
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
} from './bookingAllocation.service.js';

/**
 * Creates a new reservation for an authenticated user with atomic slot allocation.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {string} params.resourceId - Target resource ObjectId
 * @param {Date | string} params.startAt - Reservation start instant
 * @param {Date | string} params.endAt - Reservation end instant
 * @param {string} [params.notes=''] - Optional reservation notes
 * @param {import('mongoose').ClientSession} [params.session=null] - Optional external session
 * @returns {Promise<{ booking: object, slots: object[] }>}
 */
export async function createBooking({
  userId,
  resourceId,
  startAt,
  endAt,
  notes = '',
}, session = null) {
  return allocateBookingWithSlots(
    {
      userId,
      resourceId,
      startAt,
      endAt,
      notes,
    },
    session,
  );
}

export {
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
};

export default {
  createBooking,
  allocateBookingWithSlots,
  releaseBookingSlots,
  calculateRequiredSlots,
};
