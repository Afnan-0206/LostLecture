import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.lostlecture_token) {
    token = req.cookies.lostlecture_token;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required. No access token provided.');
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'lostlecture_secret_dev_key_fallback_123456789'
    );

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      throw new ApiError(401, 'User account associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact an administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired authentication token. Please log in again.');
  }
});

