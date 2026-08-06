import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.js';
import { enrichCompany, getResults, deleteCompany } from '../controllers/enrichController.js';
import { successResponse } from '../utils/response.js';

const router = Router();

/**
 * GET /
 * Base application check.
 */
router.get('/', (req, res) => {
  return successResponse(res, 200, {
    message: 'Relu Consultancy AI Enricher Backend Running'
  });
});

/**
 * GET /api/v1/health
 * Versioned health check API.
 */
router.get('/api/v1/health', getHealthStatus);

/**
 * Business logic endpoints
 */
router.post('/enrich', enrichCompany);
router.get('/results', getResults);
router.delete('/results/:id', deleteCompany);

export default router;
