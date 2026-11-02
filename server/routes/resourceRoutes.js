import express from 'express';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  incrementViewCount,
  toggleUpvote,
  getMyContributions,
} from '../controllers/resourceController.js';
import { getComments, addComment, deleteComment } from '../controllers/commentController.js';
import { getAiSummary, getAiQuiz } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Optional auth middleware for getResources to attach req.user if token is present
const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.lostlecture_token) {
    token = req.cookies.lostlecture_token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'lostlecture_secret_dev_key_fallback_123456789'
    );
    User.findById(decoded.id)
      .select('-passwordHash')
      .then((user) => {
        if (user && user.isActive) {
          req.user = user;
        }
        next();
      })
      .catch(() => next());
  } catch (err) {
    next();
  }
};

router.route('/')
  .get(optionalAuth, getResources)
  .post(protect, upload.single('file'), createResource);

router.get('/my-contributions', protect, getMyContributions);

router.route('/:id')
  .get(optionalAuth, getResourceById)
  .patch(protect, updateResource)
  .delete(protect, deleteResource);

router.post('/:id/view', incrementViewCount);
router.post('/:id/vote', protect, toggleUpvote);

// Discussion & Doubt comments
router.route('/:id/comments')
  .get(getComments)
  .post(protect, addComment);

router.delete('/:id/comments/:commentId', protect, deleteComment);

// AI Study Assistant
router.get('/:id/ai-summary', getAiSummary);
router.get('/:id/ai-quiz', getAiQuiz);

export default router;
