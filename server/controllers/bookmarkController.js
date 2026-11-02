import Bookmark from '../models/Bookmark.js';
import Resource from '../models/Resource.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all bookmarks for the logged in user
// @route   GET /api/bookmarks
// @access  Private
export const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate({
      path: 'resource',
      populate: [
        { path: 'subject', select: 'name code semester' },
        { path: 'uploadedBy', select: 'name department' },
      ],
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, bookmarks, 'User bookmarks'));
});

// @desc    Bookmark a resource
// @route   POST /api/bookmarks/:resourceId
// @access  Private
export const addBookmark = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  // Check if already bookmarked
  const existing = await Bookmark.findOne({
    user: req.user._id,
    resource: resourceId,
  });

  if (existing) {
    return res.status(200).json(new ApiResponse(200, existing, 'Resource is already bookmarked'));
  }

  const bookmark = await Bookmark.create({
    user: req.user._id,
    resource: resourceId,
  });

  res.status(201).json(new ApiResponse(201, bookmark, 'Bookmark added successfully'));
});

// @desc    Remove a bookmark
// @route   DELETE /api/bookmarks/:resourceId
// @access  Private
export const removeBookmark = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  const bookmark = await Bookmark.findOneAndDelete({
    user: req.user._id,
    resource: resourceId,
  });

  if (!bookmark) {
    throw new ApiError(404, 'Bookmark not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'Bookmark removed successfully'));
});

