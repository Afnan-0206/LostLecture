import express from 'express';
import {
  getAdminDashboardStats,
  getPendingResources,
  approveResource,
  rejectResource,
  getAllReports,
  updateReportStatus,
  getAllUsers,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getAdminDashboardStats);
router.get('/resources/pending', getPendingResources);
router.patch('/resources/:id/approve', approveResource);
router.patch('/resources/:id/reject', rejectResource);
router.get('/reports', getAllReports);
router.patch('/reports/:id', updateReportStatus);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);

export default router;

