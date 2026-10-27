/**
 * Application Route Constants
 *
 * Centralizes all route path patterns across the application.
 * Prevents hardcoded URLs and ensures consistent route linking.
 */

export const ROUTES = Object.freeze({
  HOME: '/',
  RESOURCES: '/resources',
  RESOURCE_DETAILS: (resourceId = ':resourceId') => `/resources/${resourceId}`,
  LOGIN: '/login',
  REGISTER: '/register',
  BOOKINGS: '/bookings',
  MY_BOOKINGS: '/bookings', // Backward-compatibility alias
  BOOKING_CREATE: '/bookings/new',
  BOOKING_CONFIRMATION: (bookingId = ':bookingId') => `/bookings/${bookingId}/confirmation`,
  BOOKING_DETAILS: (bookingId = ':bookingId') => `/bookings/${bookingId}`,
  ADMIN_DASHBOARD: '/admin',
  ADMIN_RESOURCES: '/admin/resources',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_MAINTENANCE: '/admin/maintenance',
  NOT_FOUND: '*',
});

export default ROUTES;
