import apiClient from '../../../services/apiClient.js';

/**
 * Resource Service
 *
 * Communicates with backend endpoints for public resource discovery
 * and detailed specifications.
 */
export const resourceService = {
  /**
   * Retrieves a paginated list of active resources filtered by search criteria.
   *
   * Supported query filters:
   * - search: Text matching name, description, or location (max 100 chars)
   * - category: 'study-room' | 'meeting-room' | 'lab-equipment' | 'other'
   * - location: Location substring match
   * - minCapacity: Minimum seating/equipment capacity (int >= 1)
   * - maxCapacity: Maximum seating/equipment capacity (int >= 1)
   * - sortBy: 'createdAt' | 'name' | 'capacity' | 'slotDurationMinutes' | 'category'
   * - sortOrder: 'asc' | 'desc'
   * - page: Page number (default: 1)
   * - limit: Page size limit (default: 10, max: 50)
   *
   * @param {object} [params={}]
   * @returns {Promise<{ resources: Array<object>, pagination: object }>}
   */
  async listResources(params = {}) {
    // Only pass non-empty, supported filter keys to avoid validation errors
    const query = {};

    if (params.search?.trim()) query.search = params.search.trim();
    if (params.category?.trim()) query.category = params.category.trim();
    if (params.location?.trim()) query.location = params.location.trim();

    if (params.minCapacity !== undefined && params.minCapacity !== '' && params.minCapacity !== null) {
      const min = Number(params.minCapacity);
      if (!Number.isNaN(min) && min >= 1) query.minCapacity = min;
    }

    if (params.maxCapacity !== undefined && params.maxCapacity !== '' && params.maxCapacity !== null) {
      const max = Number(params.maxCapacity);
      if (!Number.isNaN(max) && max >= 1) query.maxCapacity = max;
    }

    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    if (params.page) query.page = Number(params.page);
    if (params.limit) query.limit = Number(params.limit);

    const response = await apiClient.get('/resources', { params: query });
    return {
      resources: response?.data?.resources || [],
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

  /**
   * Retrieves full details of a specific active resource by its MongoDB ObjectId.
   *
   * @param {string} resourceId
   * @returns {Promise<object>} Resource entity
   */
  async getResourceById(resourceId) {
    if (!resourceId) {
      throw new Error('Resource identifier is required.');
    }

    const response = await apiClient.get(`/resources/${encodeURIComponent(resourceId)}`);
    return response?.data?.resource || response;
  },
};

export default resourceService;
