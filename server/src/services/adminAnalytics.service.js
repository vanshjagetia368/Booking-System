import { Resource } from '../models/Resource.js';
import { Booking } from '../models/Booking.js';
import { MaintenanceBlock } from '../models/MaintenanceBlock.js';
import { User } from '../models/User.js';

/**
 * Retrieves aggregate operational statistics for the administrative dashboard.
 *
 * Utilizes native MongoDB aggregation and countDocuments queries to compute
 * metrics in constant memory without loading documents into Node.js heap memory.
 *
 * @returns {Promise<object>} Structured analytics summary
 */
export async function getAdminSummary() {
  const now = new Date();

  // Execute all summary aggregations concurrently
  const [
    totalResources,
    activeResources,
    inactiveResources,
    resourceCategoriesAgg,
    totalBookings,
    confirmedUpcomingBookings,
    confirmedActiveBookings,
    completedBookings,
    cancelledBookings,
    bookingStatusesAgg,
    totalMaintenanceBlocks,
    activeMaintenanceBlocks,
    upcomingMaintenanceBlocks,
    pastMaintenanceBlocks,
    totalUsers,
    activeUsers,
    disabledUsers,
    userRolesAgg,
  ] = await Promise.all([
    // Resource metrics
    Resource.countDocuments(),
    Resource.countDocuments({ status: 'active' }),
    Resource.countDocuments({ status: 'inactive' }),
    Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),

    // Booking metrics
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed', startAt: { $gte: now } }),
    Booking.countDocuments({ status: 'confirmed', startAt: { $lt: now }, endAt: { $gt: now } }),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Maintenance metrics
    MaintenanceBlock.countDocuments(),
    MaintenanceBlock.countDocuments({ startAt: { $lte: now }, endAt: { $gt: now } }),
    MaintenanceBlock.countDocuments({ startAt: { $gt: now } }),
    MaintenanceBlock.countDocuments({ endAt: { $lte: now } }),

    // User metrics
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'disabled' }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ]);

  // Transform aggregation array results into clean keyed maps
  const resourceCategories = resourceCategoriesAgg.reduce((acc, curr) => {
    if (curr._id) {
      acc[curr._id] = curr.count;
    }
    return acc;
  }, {});

  const bookingStatuses = bookingStatusesAgg.reduce((acc, curr) => {
    if (curr._id) {
      acc[curr._id] = curr.count;
    }
    return acc;
  }, {});

  const userRoles = userRolesAgg.reduce((acc, curr) => {
    if (curr._id) {
      acc[curr._id] = curr.count;
    }
    return acc;
  }, {});

  return {
    timestamp: now.toISOString(),
    resources: {
      total: totalResources,
      active: activeResources,
      inactive: inactiveResources,
      byCategory: resourceCategories,
    },
    bookings: {
      total: totalBookings,
      confirmedUpcoming: confirmedUpcomingBookings,
      confirmedActive: confirmedActiveBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      byStatus: bookingStatuses,
    },
    maintenance: {
      total: totalMaintenanceBlocks,
      active: activeMaintenanceBlocks,
      upcoming: upcomingMaintenanceBlocks,
      past: pastMaintenanceBlocks,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      disabled: disabledUsers,
      byRole: userRoles,
    },
  };
}

export default {
  getAdminSummary,
};
