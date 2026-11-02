import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { createSubjectSchema, updateSubjectSchema } from '../validators/subjectValidator.js';

const router = express.Router();

router.route('/')
  .get(getSubjects)
  .post(protect, adminOnly, validateRequest(createSubjectSchema), createSubject);

router.route('/:id')
  .get(getSubjectById)
  .patch(protect, adminOnly, validateRequest(updateSubjectSchema), updateSubject)
  .delete(protect, adminOnly, deleteSubject);

export default router;

