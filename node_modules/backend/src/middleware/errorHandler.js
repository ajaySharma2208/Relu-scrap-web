import { errorResponse } from '../utils/response.js';
import config from '../config/env.js';

/**
 * Centralized global error handling middleware for Express.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the complete error stack locally
  console.error(`[Error Handler] Code: ${statusCode} - Msg: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Hide detailed stack trace in production environments
  const details = config.nodeEnv === 'development' ? { stack: err.stack } : null;

  return errorResponse(res, statusCode, message, details);
};

export default errorHandler;
