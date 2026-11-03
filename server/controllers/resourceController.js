import mongoose from 'mongoose';
import Resource from '../models/Resource.js';
import Subject from '../models/Subject.js';
import Bookmark from '../models/Bookmark.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { processFileUpload } from '../middleware/uploadMiddleware.js';

// Helper to escape user-provided strings before constructing regular expressions
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ALLOWED_RESOURCE_TYPES = [
  'PDF',
  'PPT',
  'DOC',
  'DOCX',
  'Notes',
  'Assignment',
  'Reference Link',
  'Other',
];

// @desc    Get resources with search, filters & pagination
// @route   GET /api/resources
// @access  Public
export const getResources = asyncHandler(async (req, res) => {
  const {
    search,
    subject,
    semester,
    unit,
    isPYQ,
    type,
    tags,
    sort = 'newest',
    page = 1,
    limit = 9,
    allStatus,
  } = req.query;

  const query = {};

  // Status filtering: Public only sees approved. Admin can view all if requested
  if (allStatus === 'true' && req.user && req.user.role === 'admin') {
    // Admin can query any status or all
  } else {
    query.status = 'approved';
  }

  // Validate subject ID to prevent operator injection
  if (subject && typeof subject === 'string') {
    const trimmedSubject = subject.trim();
    if (mongoose.Types.ObjectId.isValid(trimmedSubject)) {
      query.subject = new mongoose.Types.ObjectId(trimmedSubject);
    } else {
      query.subject = null; // Unmatchable invalid format
    }
  }

  // Validate numeric semester strictly (reject strings like "2abc")
  if (semester !== undefined && semester !== '') {
    if (typeof semester === 'number' || (typeof semester === 'string' && /^\d+$/.test(semester.trim()))) {
      const semNum = Number(semester);
      if (semNum >= 1 && semNum <= 12) {
        query.semester = semNum;
      }
    }
  }

  // Validate numeric unit strictly (reject strings like "2abc")
  if (unit !== undefined && unit !== '') {
    if (typeof unit === 'number' || (typeof unit === 'string' && /^\d+$/.test(unit.trim()))) {
      const unitNum = Number(unit);
      if (unitNum >= 1 && unitNum <= 10) {
        query.unit = unitNum;
      }
    }
  }

  // Strict boolean validation for isPYQ
  if (isPYQ === 'true' || isPYQ === true) {
    query.isPYQ = true;
  } else if (isPYQ === 'false' || isPYQ === false) {
    query.isPYQ = false;
  }

  // Strict allowlist for resource type
  if (type && typeof type === 'string' && ALLOWED_RESOURCE_TYPES.includes(type.trim())) {
    query.type = type.trim();
  }

  // Tag validation (ensuring tags are strings only, rejecting operator objects)
  if (tags) {
    let rawTags = [];
    if (typeof tags === 'string') {
      rawTags = tags.split(',').map((t) => t.trim());
    } else if (Array.isArray(tags)) {
      rawTags = tags.filter((t) => typeof t === 'string').map((t) => t.trim());
    }
    const cleanTags = rawTags.filter((t) => typeof t === 'string' && t.length > 0);
    if (cleanTags.length > 0) {
      query.tags = { $in: cleanTags };
    }
  }

  // Search logic with escaped regex to prevent ReDoS and regex operator injection
  if (search && typeof search === 'string') {
    const s = search.trim();
    if (s.length > 0) {
      const escaped = escapeRegex(s);
      const searchRegex = { $regex: escaped, $options: 'i' };

      // Check if search matches any subject code or name
      const matchingSubjects = await Subject.find({
        $or: [{ code: searchRegex }, { name: searchRegex }],
      }).select('_id');

      const subjectIds = matchingSubjects.map((sub) => sub._id);

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        ...(subjectIds.length > 0 ? [{ subject: { $in: subjectIds } }] : []),
      ];
    }
  }

  // Sorting allowlist
  let sortOption = { createdAt: -1 };
  if (typeof sort === 'string') {
    if (sort === 'popular') {
      sortOption = { views: -1, createdAt: -1 };
    } else if (sort === 'upvotes') {
      sortOption = { upvoteCount: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 9));
  const skip = (pageNum - 1) * limitNum;

  const [totalResources, resources] = await Promise.all([
    Resource.countDocuments(query),
    Resource.find(query)
      .populate('subject', 'name code semester')
      .populate('uploadedBy', 'name email department semester role')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  // Check bookmarks and upvotes for logged in user
  let bookmarkedIds = new Set();
  let userIdStr = req.user ? req.user._id.toString() : null;

  if (req.user) {
    const userBookmarks = await Bookmark.find({ user: req.user._id }).select('resource');
    bookmarkedIds = new Set(userBookmarks.map((b) => b.resource.toString()));
  }

  const enhancedResources = resources.map((r) => {
    const upvotesArr = r.upvotes || [];
    return {
      ...r,
      isBookmarked: bookmarkedIds.has(r._id.toString()),
      hasUpvoted: userIdStr ? upvotesArr.some((uid) => uid.toString() === userIdStr) : false,
      upvoteCount: r.upvoteCount || upvotesArr.length || 0,
    };
  });

  const pages = Math.ceil(totalResources / limitNum) || 1;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        resources: enhancedResources,
        pagination: {
          total: totalResources,
          page: pageNum,
          pages,
          limit: limitNum,
        },
        totalResources,
      },
      'Resources retrieved successfully'
    )
  );
});

// @desc    Get single resource by ID
// @route   GET /api/resources/:id
// @access  Public
export const getResourceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid resource identifier format');
  }

  const resource = await Resource.findById(id.trim())
    .populate('subject', 'name code semester description')
    .populate('uploadedBy', 'name email department semester role');

  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  let isBookmarked = false;
  let hasUpvoted = false;

  if (req.user) {
    const [bookmark, userUpvote] = await Promise.all([
      Bookmark.findOne({ user: req.user._id, resource: resource._id }),
      Resource.findOne({ _id: resource._id, upvotes: req.user._id }),
    ]);
    isBookmarked = !!bookmark;
    hasUpvoted = !!userUpvote;
  }

  const data = resource.toObject();
  data.isBookmarked = isBookmarked;
  data.hasUpvoted = hasUpvoted;
  data.upvoteCount = resource.upvoteCount || resource.upvotes?.length || 0;

  res.status(200).json(new ApiResponse(200, data, 'Resource details'));
});

// @desc    Create new academic resource
// @route   POST /api/resources
// @access  Private
export const createResource = asyncHandler(async (req, res) => {
  const { title, description, subject, semester, unit, isPYQ, type, tags, resourceUrl } = req.body;

  // Validate subject ID is a valid string ObjectId to prevent operator injection
  if (!subject || typeof subject !== 'string' || !mongoose.Types.ObjectId.isValid(subject.trim())) {
    throw new ApiError(400, 'Invalid or missing Subject ID format.');
  }

  const cleanSubjectId = subject.trim();
  const subjectDoc = await Subject.findById(cleanSubjectId);
  if (!subjectDoc) {
    throw new ApiError(404, 'Selected subject does not exist');
  }

  let finalUrl = resourceUrl;
  let filePublicId = null;
  let fileName = null;

  // Handle file upload if present
  if (req.file) {
    const uploadResult = await processFileUpload(req.file);
    finalUrl = uploadResult.url;
    filePublicId = uploadResult.publicId;
    fileName = uploadResult.fileName;
  }

  if (!finalUrl) {
    throw new ApiError(400, 'Please provide an external resource URL or upload a file.');
  }

  // Parse and sanitize tags
  let tagArray = [];
  if (tags) {
    if (typeof tags === 'string') {
      tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagArray = tags.filter((t) => typeof t === 'string').map((t) => t.trim()).filter(Boolean);
    }
  }

  // Validate resource type against allowlist
  const cleanType =
    typeof type === 'string' && ALLOWED_RESOURCE_TYPES.includes(type.trim())
      ? type.trim()
      : 'Other';

  // Security Rule: Admins publish directly; students require moderation
  const isDirectPublish = req.user.role === 'admin';
  const status = isDirectPublish ? 'approved' : 'pending';

  const resource = await Resource.create({
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    subject: new mongoose.Types.ObjectId(cleanSubjectId),
    semester: Number(semester) || 1,
    unit: unit ? Number(unit) : null,
    isPYQ: isPYQ === 'true' || isPYQ === true,
    type: cleanType,
    tags: tagArray,
    resourceUrl: finalUrl,
    filePublicId,
    fileName,
    uploadedBy: req.user._id,
    status,
    verificationStatus: isDirectPublish ? 'verified' : 'unverified',
    views: 0,
    upvotes: [],
    upvoteCount: 0,
  });

  const populated = await Resource.findById(resource._id)
    .populate('subject', 'name code semester')
    .populate('uploadedBy', 'name email department');

  res.status(201).json(
    new ApiResponse(
      201,
      populated,
      isDirectPublish
        ? 'Resource uploaded and published directly!'
        : 'Resource submitted successfully! Awaiting administrator review.'
    )
  );
});

// @desc    Update resource details
// @route   PATCH /api/resources/:id
// @access  Private (Owner or Admin)
export const updateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid resource identifier format');
  }

  const resource = await Resource.findById(id.trim());
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to update this resource.');
  }

  const {
    title,
    description,
    subject,
    semester,
    unit,
    isPYQ,
    type,
    tags,
    resourceUrl,
    verificationStatus,
    status,
  } = req.body;

  if (title && typeof title === 'string') resource.title = title.trim();
  if (description !== undefined && typeof description === 'string') resource.description = description.trim();
  if (subject) {
    if (typeof subject !== 'string' || !mongoose.Types.ObjectId.isValid(subject.trim())) {
      throw new ApiError(400, 'Invalid Subject ID format');
    }
    const cleanSubId = subject.trim();
    const subjectExists = await Subject.findById(cleanSubId);
    if (!subjectExists) {
      throw new ApiError(404, 'Selected subject does not exist');
    }
    resource.subject = new mongoose.Types.ObjectId(cleanSubId);
  }
  if (semester) resource.semester = Number(semester);
  if (unit !== undefined) resource.unit = unit ? Number(unit) : null;
  if (isPYQ !== undefined) resource.isPYQ = Boolean(isPYQ);
  if (type && typeof type === 'string' && ALLOWED_RESOURCE_TYPES.includes(type.trim())) {
    resource.type = type.trim();
  }
  if (resourceUrl && typeof resourceUrl === 'string') resource.resourceUrl = resourceUrl.trim();

  if (tags) {
    if (typeof tags === 'string') {
      resource.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      resource.tags = tags.filter((t) => typeof t === 'string').map((t) => t.trim()).filter(Boolean);
    }
  }

  // Only admin can change status and verificationStatus
  if (isAdmin) {
    if (status && typeof status === 'string') resource.status = status;
    if (verificationStatus && typeof verificationStatus === 'string') resource.verificationStatus = verificationStatus;
  }

  const updated = await resource.save();
  const populated = await Resource.findById(updated._id)
    .populate('subject', 'name code semester')
    .populate('uploadedBy', 'name email department');

  res.status(200).json(new ApiResponse(200, populated, 'Resource updated successfully'));
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Owner or Admin)
export const deleteResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid resource identifier format');
  }

  const resource = await Resource.findById(id.trim());
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to delete this resource.');
  }

  await Promise.all([
    Bookmark.deleteMany({ resource: resource._id }),
    resource.deleteOne(),
  ]);

  res.status(200).json(new ApiResponse(200, null, 'Resource deleted successfully'));
});

// @desc    Increment resource view count
// @route   POST /api/resources/:id/view
// @access  Public
export const incrementViewCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid resource identifier format');
  }

  const resource = await Resource.findByIdAndUpdate(
    id.trim(),
    { $inc: { views: 1 } },
    { new: true }
  ).select('views');

  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  res.status(200).json(new ApiResponse(200, { views: resource.views }, 'View count updated'));
});

// @desc    Toggle helpfulness upvote on a resource
// @route   POST /api/resources/:id/vote
// @access  Private
export const toggleUpvote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    throw new ApiError(400, 'Invalid resource identifier format');
  }

  const resource = await Resource.findById(id.trim());
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  const userId = req.user._id;
  const alreadyUpvoted = resource.upvotes.some((uid) => uid.toString() === userId.toString());

  if (alreadyUpvoted) {
    // Remove upvote
    resource.upvotes = resource.upvotes.filter((uid) => uid.toString() !== userId.toString());
    resource.upvoteCount = Math.max(0, resource.upvotes.length);
  } else {
    // Add upvote
    resource.upvotes.push(userId);
    resource.upvoteCount = resource.upvotes.length;
  }

  await resource.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        hasUpvoted: !alreadyUpvoted,
        upvoteCount: resource.upvoteCount,
      },
      !alreadyUpvoted ? 'Marked as helpful' : 'Upvote removed'
    )
  );
});

// @desc    Get contributions submitted by current user
// @route   GET /api/resources/my-contributions
// @access  Private
export const getMyContributions = asyncHandler(async (req, res) => {
  const contributions = await Resource.find({ uploadedBy: req.user._id })
    .populate('subject', 'name code semester')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, contributions, 'My contributions'));
});
