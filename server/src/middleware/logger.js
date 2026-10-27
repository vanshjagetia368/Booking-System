/**
 * Lightweight request logging middleware.
 *
 * Logs method, path, HTTP status, and response duration.
 * Strictly avoids logging headers, tokens, passwords, credentials, or sensitive bodies.
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Use standard color or status prefix
    const statusCategory = Math.floor(status / 100);
    const prefix = statusCategory >= 5 ? 'ERR' : statusCategory >= 4 ? 'WARN' : 'INFO';

    console.log(`[HTTP ${prefix}] ${req.method} ${req.originalUrl} ${status} - ${duration}ms`);
  });

  next();
}

export default requestLogger;
