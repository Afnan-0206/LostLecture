import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Resource from '../models/Resource.js';
import Report from '../models/Report.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Admin dashboard metrics and overview
// @route   GET /api/admin/dashboard
// @access  Private / Admin
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalSubjects,
    totalResources,
    pendingSubmissions,
    totalReports,
    pendingResources,
    recentReports,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Subject.countDocuments({ isActive: true }),
    Resource.countDocuments({ status: 'approved' }),
    Resource.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: { $in: ['Pending', 'Under Review'] } }),
    Resource.find({ status: 'pending' })
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email department')
      .sort({ createdAt: -1 })
      .limit(5),
    Report.find()
      .populate('resource', 'title resourceUrl')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          totalStudents,
          totalSubjects,
          totalResources,
          pendingSubmissions,
          totalReports,
        },
        pendingResources,
        recentReports,
      },
      'Admin statistics loaded'
    )
  );
});

// @desc    Get all pending resource submissions
// @route   GET /api/admin/resources/pending
// @access  Private / Admin
export const getPendingResources = asyncHandler(async (req, res) => {
  const pending = await Resource.find({ status: 'pending' })
    .populate('subject', 'name code semester')
    .populate('uploadedBy', 'name email department semester studentId')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, pending, 'Pending submissions'));
});

// @desc    Approve a pending resource
// @route   PATCH /api/admin/resources/:id/approve
// @access  Private / Admin
export const approveResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  resource.status = 'approved';
  resource.verificationStatus = 'verified';
  await resource.save();

  const populated = await Resource.findById(resource._id)
    .populate('subject', 'name code')
    .populate('uploadedBy', 'name email');

  res.status(200).json(new ApiResponse(200, populated, 'Resource approved and published'));
});

// @desc    Reject a pending resource
// @route   PATCH /api/admin/resources/:id/reject
// @access  Private / Admin
export const rejectResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  resource.status = 'rejected';
  await resource.save();

  res.status(200).json(new ApiResponse(200, resource, 'Resource rejected'));
});

// @desc    Get all issue reports
// @route   GET /api/admin/reports
// @access  Private / Admin
export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('resource', 'title resourceUrl type subject')
    .populate('reportedBy', 'name email department')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, reports, 'Reports retrieved'));
});

// @desc    Update report status and resolution notes
// @route   PATCH /api/admin/reports/:id
// @access  Private / Admin
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (status) report.status = status;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  await report.save();

  // If resolved, update resource verification back to verified
  if (status === 'Resolved' && report.resource) {
    await Resource.findByIdAndUpdate(report.resource, {
      verificationStatus: 'verified',
    });
  }

  const updatedReport = await Report.findById(report._id)
    .populate('resource', 'title resourceUrl')
    .populate('reportedBy', 'name email');

  res.status(200).json(new ApiResponse(200, updatedReport, 'Report status updated successfully'));
});

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private / Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, users, 'User roster retrieved'));
});

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/status
// @access  Private / Admin
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Administrators cannot deactivate their own account.');
  }

  const { isActive } = req.body;
  user.isActive = isActive !== undefined ? isActive : !user.isActive;
  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      { _id: user._id, isActive: user.isActive },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    )
  );
});

