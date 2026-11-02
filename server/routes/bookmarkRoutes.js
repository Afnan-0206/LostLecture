import express from 'express';
import {
  getMyBookmarks,
  addBookmark,
  removeBookmark,
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyBookmarks);
router.route('/:resourceId')
  .post(addBookmark)
  .delete(removeBookmark);

export default router;

