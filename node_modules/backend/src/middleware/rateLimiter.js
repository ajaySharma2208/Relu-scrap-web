import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

/**
 * Configure rate limiter to guard API endpoints against abuse.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Max 100 requests per 15 mins per IP
  standardHeaders: true, // Return standard headers
  legacyHeaders: false, // Disable legacy headers
  handler: (req, res) => {
    return errorResponse(res, 429, 'Too many requests from this IP. Please try again after 15 minutes.');
  }
});

export default apiLimiter;
