/**
 * Wrapper utility to catch async errors in Express routes and pass them to the next middleware.
 * @param {Function} fn - Async controller function.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
