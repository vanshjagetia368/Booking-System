import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve directory of current module to reliably load .env across npm workspaces
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in server root, then process working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isDevelopment = nodeEnv === 'development';
const isTest = nodeEnv === 'test';

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`[Config Error] PORT must be a valid integer between 1 and 65535. Received: "${process.env.PORT}"`);
}

const rawMongoUri = process.env.MONGODB_URI;
let mongodbUri = rawMongoUri ? rawMongoUri.trim() : null;

// Provide standard local MongoDB default only in development if not explicitly configured
if (!mongodbUri) {
  if (isProduction) {
    throw new Error('[Config Error] MONGODB_URI is strictly required in production.');
  }
  mongodbUri = 'mongodb://127.0.0.1:27017/smart_resource_booking';
}

const rawClientUrl = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientUrl = rawClientUrl.trim().replace(/\/+$/, '');

// JWT Authentication Configuration
const rawJwtSecret = process.env.JWT_SECRET;
let jwtSecret = rawJwtSecret ? rawJwtSecret.trim() : null;

if (!jwtSecret) {
  if (isProduction) {
    throw new Error('[Config Error] JWT_SECRET must be set in production to a secure random string.');
  }
  // Safe default strictly for local development
  jwtSecret = 'dev_jwt_secret_minimum_32_characters_for_auth_tokens';
} else if (isProduction && jwtSecret.length < 32) {
  throw new Error('[Config Error] JWT_SECRET must be at least 32 characters in production.');
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

// Cookie settings
const cookieName = process.env.COOKIE_NAME || 'auth_token';
const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

/**
 * Validated, centralized server environment configuration.
 */
export const env = Object.freeze({
  nodeEnv,
  isProduction,
  isDevelopment,
  isTest,
  port,
  mongodbUri,
  clientUrl,
  clientOrigin: clientUrl, // Alias for backward compatibility
  jwt: Object.freeze({
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  }),
  cookie: Object.freeze({
    name: cookieName,
    sameSite: cookieSameSite,
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  }),
});

export default env;
