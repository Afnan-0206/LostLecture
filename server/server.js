import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Database & Seed
import connectDB from './config/db.js';
import Subject from './models/Subject.js';
import { seedDatabase } from './scripts/seed.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

// Error Middlewares
import ApiError from './utils/ApiError.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { csrfProtection, generateCsrfToken } from './middleware/csrfMiddleware.js';

dotenv.config();

const app = express();

// Initialize DB and auto-seed initial department records if empty
connectDB().then(async () => {
  try {
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) {
      console.log('[Startup] Empty database detected. Seeding initial academic catalog...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('[Startup Seed Check Error]', err.message);
  }
});

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production') {
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocal) {
          return callback(null, true);
        }
      }
      return callback(new ApiError(403, 'CORS: Request from unauthorized origin blocked.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-XSRF-Token',
    ],
  })
);

// Morgan logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global Application Rate Limiting across all endpoints (including /uploads and API routes)
// Mitigates CodeQL Alert #9 (js/missing-rate-limiting, CWE-770 / CWE-400)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [],
  },
});
app.use(globalLimiter);

// Dedicated Strict Rate Limiter for Authentication endpoints (CWE-307 brute-force mitigation)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    errors: [],
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(csrfProtection);

// Static Uploads Folder (protected by globalLimiter upstream)
app.use('/uploads', express.static(path.resolve('uploads')));

// General API Route Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [],
  },
});
app.use('/api', apiLimiter);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken();
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({
    success: true,
    message: 'CSRF token generated successfully',
    data: { csrfToken },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'lostLecture API is healthy and operational',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[lostLecture Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

export default app;
