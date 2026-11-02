import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { updateProfileSchema } from '../validators/authValidator.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .patch(protect, validateRequest(updateProfileSchema), updateUserProfile);

export default router;

