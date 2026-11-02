import User from '../models/User.js';
import Resource from '../models/Resource.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get top academic contributors in the department
// @route   GET /api/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const contributors = await Resource.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$uploadedBy',
        resourceCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalUpvotes: { $sum: '$upvoteCount' },
        verifiedCount: {
          $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] },
        },
      },
    },
    { $sort: { totalUpvotes: -1, resourceCount: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        resourceCount: 1,
        totalViews: 1,
        totalUpvotes: 1,
        verifiedCount: 1,
        name: '$user.name',
        department: '$user.department',
        semester: '$user.semester',
        role: '$user.role',
      },
    },
  ]);

  // Assign academic badges
  const leaderboardWithBadges = contributors.map((c, index) => {
    const badges = [];
    if (index === 0) badges.push('Department MVP 🏆');
    if (c.verifiedCount > 0) badges.push('Faculty Verified ✍️');
    if (c.resourceCount >= 3) badges.push('Top Contributor 🚀');
    if (c.totalUpvotes >= 5) badges.push('Peer Favorite ⭐');

    return {
      ...c,
      rank: index + 1,
      badges,
    };
  });

  res.status(200).json(
    new ApiResponse(200, leaderboardWithBadges, 'Department contributor leaderboard')
  );
});

