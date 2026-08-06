import { Router } from 'express';
import { enrichCompany, getResults, deleteCompany } from '../controllers/enrichController.js';

const router = Router();

// Routes definition
router.post('/enrich', enrichCompany);
router.get('/results', getResults);
router.delete('/results/:id', deleteCompany);

export default router;
