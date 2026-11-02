import Resource from '../models/Resource.js';
import Subject from '../models/Subject.js';
import Bookmark from '../models/Bookmark.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { processFileUpload } from '../middleware/uploadMiddleware.js';

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

  if (subject) {
    query.subject = subject;
  }

  if (semester) {
    query.semester = Number(semester);
  }

  if (unit) {
    query.unit = Number(unit);
  }

  if (isPYQ === 'true') {
    query.isPYQ = true;
  }

  if (type) {
    query.type = type;
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    query.tags = { $in: tagArray };
  }

  // Search logic (case-insensitive against title, description, tags)
  if (search && search.trim()) {
    const s = search.trim();

    // Check if search matches any subject code or name
    const matchingSubjects = await Subject.find({
      $or: [
        { code: { $regex: s, $options: 'i' } },
        { name: { $regex: s, $options: 'i' } },
      ],
    }).select('_id');

    const subjectIds = matchingSubjects.map((sub) => sub._id);

    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { tags: { $regex: s, $options: 'i' } },
      ...(subjectIds.length > 0 ? [{ subject: { $in: subjectIds } }] : []),
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'popular') {
    sortOption = { views: -1, createdAt: -1 };
  } else if (sort === 'upvotes') {
    sortOption = { upvoteCount: -1, createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
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
  const resource = await Resource.findById(req.params.id)
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

  // Validate subject exists
  const subjectDoc = await Subject.findById(subject);
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

  // Parse tags
  let tagArray = [];
  if (tags) {
    tagArray = Array.isArray(tags)
      ? tags
      : tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Security Rule: Admins publish directly; students require moderation
  const isDirectPublish = req.user.role === 'admin';
  const status = isDirectPublish ? 'approved' : 'pending';

  const resource = await Resource.create({
    title,
    description: description || '',
    subject,
    semester: Number(semester),
    unit: unit ? Number(unit) : null,
    isPYQ: isPYQ === 'true' || isPYQ === true,
    type,
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
  const resource = await Resource.findById(req.params.id);
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

  if (title) resource.title = title;
  if (description !== undefined) resource.description = description;
  if (subject) resource.subject = subject;
  if (semester) resource.semester = Number(semester);
  if (unit !== undefined) resource.unit = unit ? Number(unit) : null;
  if (isPYQ !== undefined) resource.isPYQ = Boolean(isPYQ);
  if (type) resource.type = type;
  if (resourceUrl) resource.resourceUrl = resourceUrl;

  if (tags) {
    resource.tags = Array.isArray(tags)
      ? tags
      : tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Only admin can change status and verificationStatus
  if (isAdmin) {
    if (status) resource.status = status;
    if (verificationStatus) resource.verificationStatus = verificationStatus;
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
  const resource = await Resource.findById(req.params.id);
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
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
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
  const resource = await Resource.findById(req.params.id);
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
