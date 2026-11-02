import Comment from '../models/Comment.js';
import Resource from '../models/Resource.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all comments for a resource
// @route   GET /api/resources/:id/comments
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comments = await Comment.find({ resource: id })
    .populate('user', 'name role department semester')
    .sort({ createdAt: 1 });

  res.status(200).json(new ApiResponse(200, comments, 'Comments retrieved'));
});

// @desc    Post a comment or question on a resource
// @route   POST /api/resources/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, parentComment } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Comment content cannot be empty.');
  }

  const resource = await Resource.findById(id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  const comment = await Comment.create({
    resource: id,
    user: req.user._id,
    content: content.trim(),
    parentComment: parentComment || null,
  });

  const populated = await Comment.findById(comment._id).populate(
    'user',
    'name role department semester'
  );

  res.status(201).json(new ApiResponse(201, populated, 'Comment posted successfully'));
});

// @desc    Delete a comment
// @route   DELETE /api/resources/:id/comments/:commentId
// @access  Private (Owner or Admin)
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const isOwner = comment.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to delete this comment.');
  }

  await comment.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Comment deleted successfully'));
});

