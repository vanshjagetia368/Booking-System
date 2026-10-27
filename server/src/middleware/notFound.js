import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Not Found middleware for unmatched route requests.
 */
export function notFoundHandler(req, res, next) {
  const message = `The requested route '${req.method} ${req.originalUrl}' does not exist on this server.`;
  next(new ApiError(404, message, 'ROUTE_NOT_FOUND'));
}

export default notFoundHandler;
