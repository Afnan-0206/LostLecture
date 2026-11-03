import mongoose from 'mongoose';
import app from '../server.js';
import Subject from '../models/Subject.js';
import { generateCsrfToken, verifyCsrfToken, isAllowedOrigin } from '../middleware/csrfMiddleware.js';

const PORT = 5002;
let server;
let baseUrl;

const parseCookies = (res) => {
  const raw = res.headers.get('set-cookie');
  if (!raw) return {};
  const cookies = {};
  const parts = raw.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
  for (const part of parts) {
    const match = part.match(/^\s*([^=;]+)=([^;]*)/);
    if (match) {
      cookies[match[1].trim()] = match[2].trim();
    }
  }
  return cookies;
};

const makeRequest = async (method, path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : null,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data, headers: res.headers };
};

async function runCsrfTests() {
  console.log('\n--- 🛡️ RUNNING COMPREHENSIVE CSRF PROTECTION & CROSS-ORIGIN AUDIT SUITE ---\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}`;

    // Wait for DB ready and auto-seed complete
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
    while ((await Subject.countDocuments()) < 8) {
      await new Promise((r) => setTimeout(r, 400));
    }

    // 1. Safe methods (GET, HEAD, OPTIONS) do not require CSRF tokens
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200, 'Safe method GET /api/health succeeds without CSRF token');

    // 2. Cross-origin token retrieval with credentials from GET /api/csrf-token
    const crossOriginTokenRes = await makeRequest('GET', '/api/csrf-token', {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(crossOriginTokenRes.status === 200, 'GET /api/csrf-token returns 200 OK for cross-origin request');
    assert(
      crossOriginTokenRes.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'CORS header Access-Control-Allow-Origin correctly echoes trusted frontend origin'
    );
    assert(
      crossOriginTokenRes.headers.get('access-control-allow-credentials') === 'true',
      'CORS header Access-Control-Allow-Credentials is true for credentialed token delivery'
    );
    const inMemoryRetrievedToken = crossOriginTokenRes.data?.data?.csrfToken;
    assert(Boolean(inMemoryRetrievedToken), 'GET /api/csrf-token returns csrfToken in response payload');
    assert(verifyCsrfToken(inMemoryRetrievedToken) === true, 'In-memory token passes HMAC verification');

    const cookiesFromToken = parseCookies(crossOriginTokenRes);
    assert(Boolean(cookiesFromToken['XSRF-TOKEN']), 'GET /api/csrf-token sets XSRF-TOKEN cookie');
    assert(cookiesFromToken['XSRF-TOKEN'] === inMemoryRetrievedToken, 'Response payload csrfToken matches Set-Cookie value');

    // 3. Login lifecycle: authenticates user, sets cookies, and returns csrfToken in data payload
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      headers: { Origin: 'http://localhost:5173' },
      body: { email: 'student@lostlecture.edu', password: 'StudentPassword123!' },
    });
    assert(loginRes.status === 200, 'Login succeeds for student');
    assert(Boolean(loginRes.data?.data?.csrfToken), 'Login response payload includes csrfToken for in-memory frontend storage');
    assert(Boolean(loginRes.data?.data?.token), 'Login response payload includes JWT bearer token');

    const loginCookies = parseCookies(loginRes);
    const authCookie = loginCookies['lostlecture_token'];
    const csrfCookie = loginCookies['XSRF-TOKEN'];
    const studentBearerToken = loginRes.data?.data?.token;
    const loginCsrfToken = loginRes.data?.data?.csrfToken;

    assert(Boolean(authCookie), 'Login sets lostlecture_token cookie');
    assert(Boolean(csrfCookie), 'Login sets XSRF-TOKEN cookie');
    assert(loginCsrfToken === csrfCookie, 'Login payload csrfToken matches login XSRF-TOKEN cookie');

    // Fetch an approved resource to use for state-changing tests
    const resourcesRes = await makeRequest('GET', '/api/resources');
    const targetResource = resourcesRes.data?.data?.resources?.[0];
    assert(Boolean(targetResource), 'Test target resource located');
    const targetResourceId = targetResource._id;

    // 4. State-changing request with cookie auth WITHOUT a CSRF token is REJECTED
    const noTokenRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(
      noTokenRes.status === 403,
      'State-changing request with cookie auth but missing CSRF token is rejected with 403 Forbidden'
    );

    // 5. State-changing request with cookie auth and INVALID / tampered CSRF token is REJECTED
    const invalidTokenRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Origin: 'http://localhost:5173',
        'X-CSRF-Token': 'tampered_invalid_token.deadbeef1234567890abcdef',
      },
    });
    assert(
      invalidTokenRes.status === 403,
      'State-changing request with invalid CSRF token is rejected with 403 Forbidden'
    );

    // 6. State-changing request with cookie auth and MISMATCHED CSRF token is REJECTED
    const otherValidToken = generateCsrfToken();
    const mismatchTokenRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Origin: 'http://localhost:5173',
        'X-CSRF-Token': otherValidToken,
      },
    });
    assert(
      mismatchTokenRes.status === 403,
      'State-changing request with CSRF token mismatched against cookie is rejected with 403 Forbidden'
    );

    // 7. State-changing request with cookie auth and in-memory retrieved token SUCCEEDS
    const validTokenRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Origin: 'http://localhost:5173',
        'X-CSRF-Token': loginCsrfToken,
      },
    });
    assert(
      validTokenRes.status === 200 || validTokenRes.status === 201,
      'State-changing request with cookie auth and in-memory retrieved token succeeds (200/201)'
    );

    // 8. Verify X-XSRF-Token header format (Axios standard) SUCCEEDS
    const validXsrfHeaderRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Origin: 'http://localhost:5173',
        'X-XSRF-Token': loginCsrfToken,
      },
    });
    assert(
      validXsrfHeaderRes.status === 200 || validXsrfHeaderRes.status === 201,
      'State-changing request with X-XSRF-Token header (Axios standard) succeeds'
    );

    // 9. State-changing request from UNTRUSTED origin is REJECTED
    const untrustedOriginRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        'X-CSRF-Token': loginCsrfToken,
        Origin: 'https://malicious-attacker.evil.com',
      },
    });
    assert(
      untrustedOriginRes.status === 403,
      'State-changing request from untrusted origin is rejected with 403 Forbidden'
    );

    // 10. Cookie-authenticated request with MISSING Origin and Referer is REJECTED
    // (Prevents bypassing origin validation by stripping headers)
    const missingOriginRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        'X-CSRF-Token': loginCsrfToken,
      },
    });
    assert(
      missingOriginRes.status === 403,
      'Cookie-authenticated state-changing request missing both Origin and Referer is rejected with 403'
    );

    // 11. Malformed origins are REJECTED
    assert(
      isAllowedOrigin('null', {}, ['http://localhost:5173']) === false,
      'Malformed origin "null" is rejected'
    );
    assert(
      isAllowedOrigin('javascript:alert(1)', {}, ['http://localhost:5173']) === false,
      'JavaScript protocol origin is rejected'
    );
    assert(
      isAllowedOrigin('data:text/html,<html>', {}, ['http://localhost:5173']) === false,
      'Data URI origin is rejected'
    );

    // 12. Manipulated Host header cannot bypass origin validation
    const manipulatedHostRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Host: 'evil.com',
        Origin: 'http://evil.com',
        'X-CSRF-Token': loginCsrfToken,
      },
    });
    assert(
      manipulatedHostRes.status === 403,
      'Manipulated Host header matching attacker origin is rejected with 403'
    );

    // 13. Logout lifecycle: clears cookies and requires valid token
    const logoutRes = await makeRequest('POST', '/api/auth/logout', {
      cookie: `lostlecture_token=${authCookie}; XSRF-TOKEN=${csrfCookie}`,
      headers: {
        Origin: 'http://localhost:5173',
        'X-CSRF-Token': loginCsrfToken,
      },
    });
    assert(logoutRes.status === 200, 'Logout succeeds with valid CSRF token');
    const rawSetCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      rawSetCookie.includes('lostlecture_token=;') || rawSetCookie.includes('lostlecture_token=deleted') || rawSetCookie.includes('Max-Age=0') || rawSetCookie.includes('Expires='),
      'Logout clears lostlecture_token cookie'
    );
    assert(
      rawSetCookie.includes('XSRF-TOKEN=;') || rawSetCookie.includes('XSRF-TOKEN=deleted') || rawSetCookie.includes('Max-Age=0') || rawSetCookie.includes('Expires='),
      'Logout clears XSRF-TOKEN cookie'
    );

    // 14. Existing authentication and normal workflows: Pure Bearer token without cookies
    const bearerOnlyRes = await makeRequest('POST', `/api/bookmarks/${targetResourceId}`, {
      token: studentBearerToken,
    });
    assert(
      bearerOnlyRes.status === 200 || bearerOnlyRes.status === 201,
      'Existing workflow: Bearer-token-only request without cookies succeeds without CSRF/Origin headers'
    );

    console.log(`\n======================================================`);
    console.log(`CSRF Protection Tests: ${passed} PASSED | ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('CSRF test suite error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runCsrfTests().then(() => {
  process.exit(0);
});
