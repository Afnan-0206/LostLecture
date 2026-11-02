import express from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCollections)
  .post(protect, createCollection);

router.route('/:id')
  .get(getCollectionById)
  .delete(protect, deleteCollection);

export default router;

