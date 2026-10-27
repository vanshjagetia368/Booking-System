import apiClient from '../../../services/apiClient.js';

/**
 * Booking Service
 *
 * Communicates with the Express backend booking lifecycle endpoints:
 * - Create reservation (POST /api/v1/bookings)
 * - Get booking by ID (GET /api/v1/bookings/:bookingId)
 * - Get user bookings history (GET /api/v1/bookings/my)
 */
export const bookingService = {
  /**
   * Submits a reservation request for an authenticated user with atomic slot allocation.
   *
   * Mass assignment defense: Only submits permitted fields [resourceId, startAt, endAt, notes].
   * The authenticated user ownership is strictly derived by the server from JWT cookies.
   *
   * @param {object} params
   * @param {string} params.resourceId - 24-character hexadecimal MongoDB ObjectId
   * @param {string} params.startAt - ISO 8601 instant string with timezone (e.g. 2026-10-28T10:00:00.000Z)
   * @param {string} params.endAt - ISO 8601 instant string with timezone (e.g. 2026-10-28T10:30:00.000Z)
   * @param {string} [params.notes=''] - Optional reservation notes (max 1000 chars)
   * @returns {Promise<object>} Confirmed server booking record
   */
  async createBooking({ resourceId, startAt, endAt, notes = '' }) {
    if (!resourceId) {
      throw new Error('Resource identifier is required to create a booking.');
    }
    if (!startAt || !endAt) {
      throw new Error('Start and end timestamps are required to create a booking.');
    }

    const payload = {
      resourceId,
      startAt: typeof startAt === 'string' ? startAt : new Date(startAt).toISOString(),
      endAt: typeof endAt === 'string' ? endAt : new Date(endAt).toISOString(),
    };

    if (notes && typeof notes === 'string' && notes.trim().length > 0) {
      payload.notes = notes.trim();
    }

    const response = await apiClient.post('/bookings', payload);
    return response?.data?.booking || response?.data || response;
  },

  /**
   * Retrieves an authoritative booking record by its unique identifier.
   *
   * @param {string} bookingId - 24-character hexadecimal MongoDB ObjectId
   * @returns {Promise<object>} Populated booking entity
   */
  async getBookingById(bookingId) {
    if (!bookingId) {
      throw new Error('Booking identifier is required.');
    }

    const response = await apiClient.get(`/bookings/${encodeURIComponent(bookingId)}`);
    return response?.data?.booking || response?.data || response;
  },

  /**
   * Retrieves paginated booking history for the current user.
   *
   * @param {object} [params={}] - Optional query filters (status, resourceId, page, limit)
   * @returns {Promise<{ bookings: Array<object>, pagination: object }>}
   */
  async getUserBookings(params = {}) {
    const response = await apiClient.get('/bookings/my', { params });
    return {
      bookings: response?.data?.bookings || [],
      pagination: response?.meta || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },
};

export default bookingService;
