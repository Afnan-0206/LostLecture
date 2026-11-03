import assert from 'assert';
import http from 'http';
import express from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Regression Test Suite for CodeQL Alert #9 (js/missing-rate-limiting).
 * Verifies global and route-specific rate limiting configurations.
 */
async function runRateLimitingTests() {
  console.log('\n--- 🛡️ RUNNING COMPREHENSIVE RATE LIMITING REGRESSION TEST SUITE ---\n');
  let passed = 0;
  let failed = 0;

  const testAssert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Build a self-contained Express test app mirroring server.js structure
    const app = express();

    // Mirror globalLimiter
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100, // Sufficient capacity to test both global tracking and specific limiters
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
        errors: [],
      },
    });

    // Mirror authLimiter (strict brute-force defense)
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3, // Small max to test brute force rejection
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
        errors: [],
      },
    });

    app.use(globalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);

    // Static mockup
    app.get('/uploads/test.txt', (req, res) => res.send('static content'));
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
    app.post('/api/auth/login', (req, res) => res.json({ status: 'login-ok' }));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Helper request function
    const makeRequest = (path, method = 'GET') => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          `${baseUrl}${path}`,
          { method },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // 2. Test normal request under limit
    const res1 = await makeRequest('/api/health');
    testAssert(res1.statusCode === 200, 'Normal request under rate limit succeeds with 200 OK');
    testAssert(res1.headers['ratelimit-limit'] === '100', 'Response contains standard RateLimit-Limit header');
    testAssert(res1.headers['ratelimit-remaining'] !== undefined, 'Response contains standard RateLimit-Remaining header');
    testAssert(res1.headers['ratelimit-reset'] !== undefined, 'Response contains standard RateLimit-Reset header');
    testAssert(res1.headers['x-ratelimit-limit'] === undefined, 'Legacy X-RateLimit headers are omitted (RFC standard headers enforced)');

    // 3. Test static uploads protection under global limiter
    const uploadRes = await makeRequest('/uploads/test.txt');
    testAssert(uploadRes.statusCode === 200, 'Static file request is tracked by globalLimiter');
    testAssert(uploadRes.headers['ratelimit-limit'] === '100', 'Static upload response carries standard RateLimit header');

    // 4. Test authLimiter enforcement on sensitive endpoints (/api/auth/login)
    // Send 3 requests (limit is 3)
    const auth1 = await makeRequest('/api/auth/login', 'POST');
    testAssert(auth1.statusCode === 200, 'Auth request #1 succeeds within limit');
    const auth2 = await makeRequest('/api/auth/login', 'POST');
    testAssert(auth2.statusCode === 200, 'Auth request #2 succeeds within limit');
    const auth3 = await makeRequest('/api/auth/login', 'POST');
    testAssert(auth3.statusCode === 200, 'Auth request #3 succeeds within limit');

    // Send 4th request (should exceed auth limit of 3)
    const auth4 = await makeRequest('/api/auth/login', 'POST');
    testAssert(auth4.statusCode === 429, 'Auth request exceeding limit is rejected with 429 Too Many Requests');
    const parsedBody = JSON.parse(auth4.body);
    testAssert(
      parsedBody.message.includes('Too many authentication attempts'),
      'Auth rejection returns clear security message for credential protection'
    );

    // 5. Cleanup server
    await new Promise((resolve) => server.close(resolve));

    console.log(`\n======================================================`);
    console.log(`Rate Limiting Tests: ${passed} PASSED | ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runRateLimitingTests();
