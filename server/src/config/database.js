import mongoose from 'mongoose';

/**
 * Sanitizes a MongoDB connection URI to mask credentials for safe logging.
 *
 * @param {string} uri
 * @returns {string} Sanitized URI with passwords redacted.
 */
function maskDatabaseUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    // If not a standard URL format, perform regex redaction
    return uri.replace(/(:\/\/)([^:@\s]+):([^@\s]+)@/, '$1$2:***@');
  }
}

let isLifecycleConfigured = false;
let connectionPromise = null;

function configureConnectionLifecycle() {
  if (isLifecycleConfigured) return;

  mongoose.connection.on('connected', () => {
    const host = mongoose.connection.host || 'unknown-host';
    const name = mongoose.connection.name || 'unknown-db';
    console.log(`[Database] Mongoose connected successfully to ${host}/${name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose reconnected to MongoDB.');
  });

  isLifecycleConfigured = true;
}

/**
 * Connects to MongoDB using Mongoose.
 *
 * Reuses existing connections or in-flight connection promises to prevent
 * duplicate connection attempts caused by multiple module imports.
 *
 * Note on Transaction Requirements:
 * The future booking allocation engine relies on MongoDB transactions and unique
 * compound indexes on (resourceId, slotStartAt) to guarantee concurrency safety.
 * Multi-document transactions require a MongoDB deployment with replica set support
 * (such as a local single-node replica set or MongoDB Atlas). A standalone MongoDB
 * node does not support multi-document transactions.
 *
 * @param {string} uri - The MongoDB connection URI.
 * @param {mongoose.ConnectOptions} [options]
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDatabase(uri, options = {}) {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    throw new Error('[Database] Missing or invalid MongoDB connection URI.');
  }

  // 1. If already connected, return existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If a connection attempt is already in flight, reuse the active promise
  if (connectionPromise) {
    return connectionPromise;
  }

  configureConnectionLifecycle();

  const sanitizedUri = maskDatabaseUri(uri);
  console.log(`[Database] Connecting to MongoDB at ${sanitizedUri}...`);

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        ...options,
      });
      return mongoose;
    } catch (error) {
      console.error(`[Database] Failed to connect to MongoDB (${sanitizedUri}): ${error.message}`);
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Disconnects from MongoDB gracefully.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed.');
  }
}

/**
 * Returns diagnostic connection state.
 *
 * @returns {{ state: string, ready: boolean, host: string | null, name: string | null }}
 */
export function getDatabaseState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  const state = states[readyState] || 'unknown';

  return {
    state,
    ready: readyState === 1,
    host: readyState === 1 ? mongoose.connection.host : null,
    name: readyState === 1 ? mongoose.connection.name : null,
  };
}

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseState,
};
