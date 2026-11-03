import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { generateCsrfToken } from '../middleware/csrfMiddleware.js';
import { encryptCookieToken } from '../utils/cookieCrypto.js';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, semester, studentId } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists.');
  }

  // Secure password hashing with bcrypt (12 rounds)
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Security: Always default role to student for public registration
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'student',
    department,
    semester: Number(semester),
    studentId: studentId ? studentId.trim() : '',
    isActive: true,
  });

  const token = generateToken(user._id, user.role);
  const csrfToken = generateCsrfToken();
  // Encrypt token before storing in client cookie (resolves CodeQL CWE-312 / CWE-315)
  const encryptedCookieToken = encryptCookieToken(token);

  res.cookie('lostlecture_token', encryptedCookieToken, cookieOptions);
  res.cookie('XSRF-TOKEN', csrfToken, csrfCookieOptions);

  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    semester: user.semester,
    studentId: user.studentId,
    createdAt: user.createdAt,
  };

  res.status(201).json(
    new ApiResponse(
      201,
      { user: sanitizedUser, token, csrfToken },
      'Account created successfully! Welcome to lostLecture.'
    )
  );
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Please contact an administrator.');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = generateToken(user._id, user.role);
  const csrfToken = generateCsrfToken();
  // Encrypt token before storing in client cookie (resolves CodeQL CWE-312 / CWE-315)
  const encryptedCookieToken = encryptCookieToken(token);

  res.cookie('lostlecture_token', encryptedCookieToken, cookieOptions);
  res.cookie('XSRF-TOKEN', csrfToken, csrfCookieOptions);

  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    semester: user.semester,
    studentId: user.studentId,
    createdAt: user.createdAt,
  };

  res.status(200).json(
    new ApiResponse(
      200,
      { user: sanitizedUser, token, csrfToken },
      'Logged in successfully'
    )
  );
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('lostlecture_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.clearCookie('XSRF-TOKEN', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json(new ApiResponse(200, user, 'Current user profile'));
});
