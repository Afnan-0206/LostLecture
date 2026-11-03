import mongoose from 'mongoose';
import Collection from '../models/Collection.js';
import Subject from '../models/Subject.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all public study collections / survival packs
// @route   GET /api/collections
// @access  Public
export const getCollections = asyncHandler(async (req, res) => {
  const { subject, semester } = req.query;
  const query = { isPublic: true };

  // Validate subject ID to prevent MongoDB operator injection
  if (subject && typeof subject === 'string') {
    const trimmedSubject = subject.trim();
    if (mongoose.Types.ObjectId.isValid(trimmedSubject)) {
      query.subject = new mongoose.Types.ObjectId(trimmedSubject);
    } else {
      query.subject = null; // Unmatchable invalid format
    }
  }

  // Validate numeric semester strictly between 1 and 12 (reject strings like "2abc")
  if (semester !== undefined && semester !== '') {
    if (typeof semester === 'number' || (typeof semester === 'string' && /^\d+$/.test(semester.trim()))) {
      const semNum = Number(semester);
      if (semNum >= 1 && semNum <= 12) {
        query.semester = semNum;
      }
    }
  }

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
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid collection identifier format');
  }

  const collection = await Collection.findById(id.trim())
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

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Title, subject, and semester are required.');
  }

  if (!subject || typeof subject !== 'string' || !mongoose.Types.ObjectId.isValid(subject.trim())) {
    throw new ApiError(400, 'Title, subject, and semester are required.');
  }

  const cleanSubjectId = subject.trim();
  const subjectExists = await Subject.findById(cleanSubjectId);
  if (!subjectExists) {
    throw new ApiError(404, 'Selected subject does not exist');
  }

  if (typeof semester !== 'number' && (typeof semester !== 'string' || !/^\d+$/.test(semester.trim()))) {
    throw new ApiError(400, 'Title, subject, and semester are required.');
  }
  const semNum = Number(semester);
  if (semNum < 1 || semNum > 12) {
    throw new ApiError(400, 'Title, subject, and semester are required.');
  }

  // Filter out any non-string / operator elements in resources array
  let cleanResources = [];
  if (Array.isArray(resources)) {
    cleanResources = resources
      .filter((r) => typeof r === 'string' && mongoose.Types.ObjectId.isValid(r.trim()))
      .map((r) => new mongoose.Types.ObjectId(r.trim()));
  }

  const collection = await Collection.create({
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    subject: new mongoose.Types.ObjectId(cleanSubjectId),
    semester: semNum,
    resources: cleanResources,
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
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid collection identifier format');
  }

  const collection = await Collection.findById(id.trim());
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
