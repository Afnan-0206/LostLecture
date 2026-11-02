import Report from '../models/Report.js';
import Resource from '../models/Resource.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Submit a report for an outdated or broken resource
// @route   POST /api/reports/:resourceId
// @access  Private
export const createReport = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { reason, description } = req.body;

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  // Prevent duplicate active reports by same user
  const existingReport = await Report.findOne({
    resource: resourceId,
    reportedBy: req.user._id,
    status: { $in: ['Pending', 'Under Review'] },
  });

  if (existingReport) {
    throw new ApiError(
      409,
      'You already have an active report submitted for this resource. Our administrators are currently reviewing it.'
    );
  }

  const report = await Report.create({
    resource: resourceId,
    reportedBy: req.user._id,
    reason,
    description: description || '',
    status: 'Pending',
  });

  // Mark resource verificationStatus to 'reported' so community is alerted
  resource.verificationStatus = 'reported';
  await resource.save();

  res.status(201).json(
    new ApiResponse(
      201,
      report,
      'Report submitted successfully. Thank you for helping keep the library up to date!'
    )
  );
});

// @desc    Get reports submitted by current user
// @route   GET /api/reports/my-reports
// @access  Private
export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reportedBy: req.user._id })
    .populate('resource', 'title resourceUrl type subject')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, reports, 'My submitted reports'));
});

