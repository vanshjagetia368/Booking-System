import { Resource } from '../models/Resource.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Escapes regex special characters to prevent regex injection
 * when handling user-provided search text.
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Creates a new resource document from validated fields.
 *
 * @param {object} payload
 * @returns {Promise<object>} Sanitized created resource object
 */
export async function createResource(payload) {
  const allowedData = {
    name: payload.name.trim(),
    description: payload.description ? payload.description.trim() : '',
    category: payload.category,
    location: payload.location.trim(),
    capacity: Number(payload.capacity),
    ...(payload.slotDurationMinutes ? { slotDurationMinutes: Number(payload.slotDurationMinutes) } : {}),
    ...(payload.operatingHours ? { operatingHours: payload.operatingHours } : {}),
    ...(payload.status ? { status: payload.status } : {}),
  };

  const resource = new Resource(allowedData);
  await resource.save();

  return resource.toSafeObject();
}

/**
 * Retrieves a paginated list of active resources for public discovery.
 *
 * @param {object} queryOptions - Validated query parameters
 * @returns {Promise<{ resources: object[], pagination: object }>}
 */
export async function listPublicResources({
  page = 1,
  limit = 10,
  search = null,
  category = null,
  location = null,
  minCapacity = null,
  maxCapacity = null,
  sortBy = 'createdAt',
  sortOrder = -1,
} = {}) {
  // Public discovery strictly restricts results to active resources
  const query = { status: 'active' };

  if (category) {
    query.category = category;
  }

  if (location) {
    const locRegex = new RegExp(escapeRegex(location), 'i');
    query.location = locRegex;
  }

  if (minCapacity !== null || maxCapacity !== null) {
    query.capacity = {};
    if (minCapacity !== null) query.capacity.$gte = minCapacity;
    if (maxCapacity !== null) query.capacity.$lte = maxCapacity;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  const [resources, totalItems] = await Promise.all([
    Resource.find(query).sort(sort).skip(skip).limit(limit),
    Resource.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    resources: resources.map((r) => r.toSafeObject()),
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
 * Retrieves a single active resource by its ID for public callers.
 *
 * @param {string} resourceId
 * @returns {Promise<object>}
 */
export async function getPublicResourceById(resourceId) {
  const resource = await Resource.findOne({ _id: resourceId, status: 'active' });

  if (!resource) {
    throw ApiError.notFound(
      'Resource not found or is currently unavailable.',
      'RESOURCE_NOT_FOUND',
    );
  }

  return resource.toSafeObject();
}

/**
 * Retrieves a paginated list of resources for administrative management,
 * supporting inspection of both active and inactive resources.
 *
 * @param {object} queryOptions - Validated query parameters
 * @returns {Promise<{ resources: object[], pagination: object }>}
 */
export async function listAdminResources({
  page = 1,
  limit = 10,
  search = null,
  category = null,
  location = null,
  status = null,
  minCapacity = null,
  maxCapacity = null,
  sortBy = 'createdAt',
  sortOrder = -1,
} = {}) {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (location) {
    const locRegex = new RegExp(escapeRegex(location), 'i');
    query.location = locRegex;
  }

  if (minCapacity !== null || maxCapacity !== null) {
    query.capacity = {};
    if (minCapacity !== null) query.capacity.$gte = minCapacity;
    if (maxCapacity !== null) query.capacity.$lte = maxCapacity;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  const [resources, totalItems] = await Promise.all([
    Resource.find(query).sort(sort).skip(skip).limit(limit),
    Resource.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    resources: resources.map((r) => r.toSafeObject()),
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
 * Retrieves a single resource by ID for administrative inspection (including inactive).
 *
 * @param {string} resourceId
 * @returns {Promise<object>}
 */
export async function getAdminResourceById(resourceId) {
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  return resource.toSafeObject();
}

/**
 * Updates permitted resource fields.
 *
 * @param {string} resourceId
 * @param {object} updateData
 * @returns {Promise<object>}
 */
export async function updateResource(resourceId, updateData) {
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  if (updateData.name !== undefined) {
    resource.name = updateData.name.trim();
  }
  if (updateData.description !== undefined) {
    resource.description = updateData.description ? updateData.description.trim() : '';
  }
  if (updateData.category !== undefined) {
    resource.category = updateData.category;
  }
  if (updateData.location !== undefined) {
    resource.location = updateData.location.trim();
  }
  if (updateData.capacity !== undefined) {
    resource.capacity = Number(updateData.capacity);
  }
  if (updateData.slotDurationMinutes !== undefined) {
    resource.slotDurationMinutes = Number(updateData.slotDurationMinutes);
  }
  if (updateData.status !== undefined) {
    resource.status = updateData.status;
  }
  if (updateData.operatingHours !== undefined) {
    // Merge or replace operating hours
    const currentHours = resource.operatingHours ? resource.operatingHours.toObject() : {};
    resource.operatingHours = {
      ...currentHours,
      ...updateData.operatingHours,
    };
  }

  await resource.save();

  return resource.toSafeObject();
}

/**
 * Activates or deactivates a resource.
 *
 * @param {string} resourceId
 * @param {'active' | 'inactive'} status
 * @returns {Promise<object>}
 */
export async function updateResourceStatus(resourceId, status) {
  const resource = await Resource.findById(resourceId);

  if (!resource) {
    throw ApiError.notFound('Resource not found.', 'RESOURCE_NOT_FOUND');
  }

  resource.status = status;
  await resource.save();

  return resource.toSafeObject();
}

export default {
  escapeRegex,
  createResource,
  listPublicResources,
  getPublicResourceById,
  listAdminResources,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
};
