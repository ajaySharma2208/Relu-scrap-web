/**
 * Send a success response.
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {object} data - Payload data to include.
 */
export const successResponse = (res, statusCode, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
};

/**
 * Send an error response.
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - User-friendly error message.
 * @param {any} [details=null] - Optional error details (e.g. validation errors).
 */
export const errorResponse = (res, statusCode, message, details = null) => {
  const body = {
    success: false,
    message
  };
  if (details !== null) {
    body.details = details;
  }
  return res.status(statusCode).json(body);
};
