/**
 * Wrapper for async express route handlers to catch errors and forward them to the global error handler
 * @param {Function} fn Async middleware or route handler function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
