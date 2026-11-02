import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/:resourceId', createReport);
router.get('/my-reports', getMyReports);

export default router;

