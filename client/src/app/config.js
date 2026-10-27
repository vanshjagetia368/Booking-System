/**
 * Application Configuration Module
 *
 * Centralizes client-side settings and reads Vite environment variables.
 *
 * SECURITY NOTE:
 * In Vite, variables prefixed with `VITE_` are embedded into the client-side
 * bundle at build time and are publicly visible in browser network and source tabs.
 * Never define database credentials, JWT secrets, private keys, or passwords here.
 */

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const config = Object.freeze({
  /**
   * Base URL for the Express backend REST API.
   * Defaults to local development URL if not explicitly provided in the environment.
   */
  apiBaseUrl: rawApiBaseUrl?.trim() || 'http://localhost:5000/api/v1',

  /**
   * Public application title.
   */
  appName: 'Smart Resource Booking System',

  /**
   * Application version indicator.
   */
  version: '0.1.0',

  /**
   * Environment flags.
   */
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD),
});

export default config;
