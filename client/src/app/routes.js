/**
 * Application Route Constants
 *
 * Centralizes all route path patterns across the application.
 * Prevents hardcoded URLs and ensures consistent route linking.
 */

export const ROUTES = Object.freeze({
  HOME: '/',
  RESOURCES: '/resources',
  RESOURCE_DETAILS: (id = ':id') => `/resources/${id}`,
  LOGIN: '/login',
  REGISTER: '/register',
  MY_BOOKINGS: '/my-bookings',
  BOOKING_DETAILS: (id = ':id') => `/bookings/${id}`,
  ADMIN_DASHBOARD: '/admin',
  ADMIN_RESOURCES: '/admin/resources',
  ADMIN_BOOKINGS: '/admin/bookings',
});

export default ROUTES;
