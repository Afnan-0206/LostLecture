import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, user, 'Profile details retrieved'));
});

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, department, semester, studentId } = req.body;

  if (name) user.name = name;
  if (department) user.department = department;
  if (semester) user.semester = Number(semester);
  if (studentId !== undefined) user.studentId = studentId;

  const updatedUser = await user.save();

  const sanitized = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    department: updatedUser.department,
    semester: updatedUser.semester,
    studentId: updatedUser.studentId,
    createdAt: updatedUser.createdAt,
  };

  res.status(200).json(new ApiResponse(200, sanitized, 'Profile updated successfully'));
});

