import apiClient from '../../../services/apiClient.js';

/**
 * Availability Service
 *
 * Communicates with the backend availability calculation engine:
 * GET /api/v1/resources/:resourceId/availability?date=YYYY-MM-DD
 */
export const availabilityService = {
  /**
   * Retrieves bookable slot availability for an active resource on a given calendar date.
   *
   * @param {string} resourceId - 24-character hexadecimal MongoDB ObjectId
   * @param {string} dateString - Target calendar date formatted as YYYY-MM-DD
   * @returns {Promise<{
   *   resourceId: string,
   *   resourceName: string,
   *   date: string,
   *   timeZone: string,
   *   operatingHours: { isOpen: boolean, openTime: string | null, closeTime: string | null },
   *   slotDurationMinutes: number,
   *   slots: Array<{ startAt: string, endAt: string, available: boolean, reason: string | null }>,
   *   summary: { totalSlots: number, availableSlots: number, reservedSlots: number, maintenanceSlots: number, pastSlots: number }
   * }>}
   */
  async getAvailability(resourceId, dateString) {
    if (!resourceId) {
      throw new Error('Resource identifier is required to check availability.');
    }

    if (!dateString) {
      throw new Error('Calendar date (YYYY-MM-DD) is required to check availability.');
    }

    const response = await apiClient.get(
      `/resources/${encodeURIComponent(resourceId)}/availability`,
      {
        params: { date: dateString.trim() },
      },
    );

    return response?.data || response;
  },
};

export default availabilityService;
