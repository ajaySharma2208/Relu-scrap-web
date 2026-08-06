import { isDbConnected } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller to handle GET /api/v1/health.
 * Checks the application and database connectivity.
 */
export const getHealthStatus = (req, res) => {
  const dbConnected = isDbConnected();

  if (dbConnected) {
    return successResponse(res, 200, {
      status: 'healthy',
      database: 'connected'
    });
  } else {
    // If database connection is down, return unhealthy with 503 Service Unavailable
    return errorResponse(res, 503, 'Service Unhealthy', {
      status: 'unhealthy',
      database: 'disconnected'
    });
  }
};
