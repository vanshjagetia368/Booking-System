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

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`[Config Error] PORT must be a valid integer between 1 and 65535. Received: "${process.env.PORT}"`);
}

const rawMongoUri = process.env.MONGODB_URI;
let mongodbUri = rawMongoUri ? rawMongoUri.trim() : null;

// Provide standard local MongoDB default only in development if not explicitly configured
if (!mongodbUri) {
  if (nodeEnv === 'production') {
    throw new Error('[Config Error] MONGODB_URI is strictly required in production.');
  }
  // Safe default for local development convenience
  mongodbUri = 'mongodb://127.0.0.1:27017/smart_resource_booking';
}

const clientUrl = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Reserved for future authentication modules (Prompt 4+)
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'development' ? 'dev_jwt_secret_placeholder_not_for_production' : null);
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Validated, centralized server environment configuration.
 */
export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  port,
  mongodbUri,
  clientUrl: clientUrl.trim(),
  clientOrigin: clientUrl.trim(), // Alias for backward compatibility
  jwt: Object.freeze({
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  }),
});

export default env;
