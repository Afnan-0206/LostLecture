import Collection from '../models/Collection.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all public study collections / survival packs
// @route   GET /api/collections
// @access  Public
export const getCollections = asyncHandler(async (req, res) => {
  const { subject, semester } = req.query;
  const query = { isPublic: true };

  if (subject) query.subject = subject;
  if (semester) query.semester = Number(semester);

  const collections = await Collection.find(query)
    .populate('subject', 'name code semester')
    .populate('createdBy', 'name role department')
    .populate('resources', 'title type semester resourceUrl views')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, collections, 'Collections retrieved'));
});

// @desc    Get single collection details
// @route   GET /api/collections/:id
// @access  Public
export const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id)
    .populate('subject', 'name code semester description')
    .populate('createdBy', 'name role department')
    .populate({
      path: 'resources',
      populate: [
        { path: 'subject', select: 'name code' },
        { path: 'uploadedBy', select: 'name' },
      ],
    });

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  res.status(200).json(new ApiResponse(200, collection, 'Collection details'));
});

// @desc    Create a new study collection / survival pack
// @route   POST /api/collections
// @access  Private
export const createCollection = asyncHandler(async (req, res) => {
  const { title, description, subject, semester, resources } = req.body;

  if (!title || !subject || !semester) {
    throw new ApiError(400, 'Title, subject, and semester are required.');
  }

  const collection = await Collection.create({
    title: title.trim(),
    description: description || '',
    subject,
    semester: Number(semester),
    resources: Array.isArray(resources) ? resources : [],
    createdBy: req.user._id,
    isPublic: true,
  });

  const populated = await Collection.findById(collection._id)
    .populate('subject', 'name code')
    .populate('createdBy', 'name department');

  res.status(201).json(new ApiResponse(201, populated, 'Study collection created'));
});

// @desc    Delete collection
// @route   DELETE /api/collections/:id
// @access  Private (Owner or Admin)
export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  const isOwner = collection.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Unauthorized to delete this collection');
  }

  await collection.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Collection deleted'));
});

