/**
 * Wraps asynchronous route handlers to ensure rejected promises
 * are caught and passed to the Express error handling middleware.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
