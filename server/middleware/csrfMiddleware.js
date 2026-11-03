import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// A secure fallback secret generated once per process lifecycle if no environment variable is provided,
// ensuring runtime stability while preventing offline forgery with static hardcoded keys.
const PROCESS_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

const getCsrfSecret = () => {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: CSRF_SECRET or JWT_SECRET must be configured in production environment.');
  }
  return PROCESS_FALLBACK_SECRET;
};

/**
 * Generate a cryptographically secure, HMAC-signed CSRF token.
 * Format: <random_32_bytes_hex>.<hmac_sha256_signature>
 */
export const generateCsrfToken = () => {
  const secret = getCsrfSecret();
  const token = crypto.randomBytes(32).toString('hex');
  const hmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${hmac}`;
};

/**
 * Verify a cryptographically signed CSRF token using timing-safe comparison.
 */
export const verifyCsrfToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return false;
  const parts = rawToken.split('.');
  if (parts.length !== 2) return false;
  const [token, signature] = parts;
  if (!token || !signature) return false;

  try {
    const secret = getCsrfSecret();
    const expectedHmac = crypto.createHmac('sha256', secret).update(token).digest('hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedHmac, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Validates request Origin / Referer against explicitly allowed origins.
 * Note: Never trusts arbitrary Host headers as origins.
 */
export const isAllowedOrigin = (origin, req, allowedOriginsList = []) => {
  if (!origin || typeof origin !== 'string') return false;

  try {
    const originUrl = new URL(origin);

    // Only allow http: and https: protocols (reject javascript:, data:, etc.)
    if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') {
      return false;
    }

    // Check against configured allowed origins
    for (const allowed of allowedOriginsList) {
      if (!allowed) continue;
      try {
        const allowedUrl = new URL(allowed);
        if (allowedUrl.origin === originUrl.origin) return true;
      } catch {
        if (allowed === origin) return true;
      }
    }

    // In development / test environments, permit localhost / 127.0.0.1 on any port
    if (process.env.NODE_ENV !== 'production') {
      if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
        return true;
      }
    }

    return false;
  } catch {
    return false; // Malformed origin rejected
  }
};

/**
 * Express CSRF Protection Middleware
 * - Bypasses safe HTTP methods (GET, HEAD, OPTIONS)
 * - Enforces Origin / Referer validation for state-changing requests
 * - Prevents origin stripping bypass on cookie-authenticated requests
 * - Enforces Double Submit Cookie & HMAC-signed CSRF tokens on cookie-authenticated requests
 * - Preserves existing pure Bearer-token API workflows
 */
export const csrfProtection = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  // 1. Safe HTTP methods (GET, HEAD, OPTIONS) are exempt from CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    // Automatically seed XSRF-TOKEN cookie if missing
    if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
      try {
        const newToken = generateCsrfToken();
        res.cookie('XSRF-TOKEN', newToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        });
      } catch (err) {
        return next(err);
      }
    }
    return next();
  }

  // 2. Determine if request is using ambient cookie credentials
  const hasAuthCookie = Boolean(req.cookies && req.cookies.lostlecture_token);
  const hasCsrfCookie = Boolean(req.cookies && req.cookies['XSRF-TOKEN']);
  const requiresCsrfValidation = hasAuthCookie || hasCsrfCookie;

  // 3. Extract and validate Origin / Referer on state-changing requests
  let origin = req.headers.origin;
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {
      origin = null;
    }
  }

  // For cookie-authenticated requests, an Origin or Referer header MUST be present.
  // Attackers cannot bypass origin checks by stripping headers (e.g. no-referrer).
  if (requiresCsrfValidation && !origin) {
    console.warn(
      `[CSRF Protection] Blocked cookie-authenticated request: Missing Origin and Referer headers for ${req.method} ${req.originalUrl}`
    );
    return next(
      new ApiError(
        403,
        'CSRF verification failed: Request must include a valid Origin or Referer header when using cookie authentication.'
      )
    );
  }

  // If origin is present, it MUST be an explicitly trusted origin
  if (origin && !isAllowedOrigin(origin, req, allowedOrigins)) {
    console.warn(`[CSRF Protection] Blocked request from untrusted origin: ${origin}`);
    return next(
      new ApiError(403, 'CSRF verification failed: Request origin is untrusted.')
    );
  }

  // 4. Token validation for cookie-authenticated requests
  if (requiresCsrfValidation) {
    const headerToken =
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'] ||
      (req.body && req.body._csrf);

    if (!headerToken || typeof headerToken !== 'string') {
      console.warn(
        `[CSRF Protection] Blocked state-changing request: Missing CSRF token for ${req.method} ${req.originalUrl}`
      );
      return next(
        new ApiError(
          403,
          'CSRF token missing. Please include X-CSRF-Token or X-XSRF-Token header.'
        )
      );
    }

    if (!verifyCsrfToken(headerToken)) {
      console.warn(
        `[CSRF Protection] Blocked state-changing request: Invalid CSRF token for ${req.method} ${req.originalUrl}`
      );
      return next(
        new ApiError(
          403,
          'CSRF token invalid. Token signature verification failed.'
        )
      );
    }

    // Double-submit match check if XSRF-TOKEN cookie is present (timing-safe)
    if (hasCsrfCookie) {
      const cookieToken = req.cookies['XSRF-TOKEN'];
      const matches =
        cookieToken &&
        typeof cookieToken === 'string' &&
        headerToken.length === cookieToken.length &&
        crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));

      if (!matches) {
        console.warn(
          `[CSRF Protection] Blocked state-changing request: CSRF token does not match cookie`
        );
        return next(
          new ApiError(
            403,
            'CSRF token mismatch between header and cookie.'
          )
        );
      }
    }
  }

  next();
};
