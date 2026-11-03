import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';
import { encryptCookieToken, decryptCookieToken, getEncryptionKey } from '../utils/cookieCrypto.js';

const PORT = 5005;
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
      cookies[match[1].trim()] = decodeURIComponent(match[2].trim());
    }
  }
  return cookies;
};

const request = async (method, path, body = null, token = null, cookie = null) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data, headers: res.headers };
};

async function runAuthSecurityTests() {
  console.log('\n--- 🛡️ RUNNING AUTHENTICATION & TOKEN ENCRYPTION SECURITY TEST SUITE ---\n');
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
    // 1. Unit tests for cookieCrypto module
    console.log('--- 1. Testing cookieCrypto (AES-256-GCM) Unit Functions ---');
    const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJzdHVkZW50In0.sampleSignatureHere12345';

    const encrypted = encryptCookieToken(sampleJwt);
    assert(typeof encrypted === 'string' && encrypted.split(':').length === 3, 'encryptCookieToken returns format iv:authTag:ciphertext');
    assert(!encrypted.includes(sampleJwt), 'Encrypted cookie does not expose raw JWT in clear text');
    assert(!encrypted.includes('eyJ'), 'Encrypted cookie contains no base64 JWT header');

    const decrypted = decryptCookieToken(encrypted);
    assert(decrypted === sampleJwt, 'decryptCookieToken accurately recovers original JWT string');

    // Tampered ciphertext
    const [iv, authTag, cipher] = encrypted.split(':');
    const tamperedCipher = cipher.slice(0, -2) + (cipher.slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedResult = decryptCookieToken(`${iv}:${authTag}:${tamperedCipher}`);
    assert(tamperedResult === null, 'Tampered ciphertext rejected and returns null');

    // Tampered auth tag
    const tamperedTag = authTag.slice(0, -2) + (authTag.slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedTagResult = decryptCookieToken(`${iv}:${tamperedTag}:${cipher}`);
    assert(tamperedTagResult === null, 'Tampered auth tag rejected and returns null');

    // Production secret entropy & 64-character hexadecimal requirement tests
    const origEnv = process.env.NODE_ENV;
    const origCookieSecret = process.env.COOKIE_ENCRYPTION_SECRET;
    const origJwtSecret = process.env.JWT_SECRET;
    const origLegacyAuth = process.env.ALLOW_LEGACY_COOKIE_AUTH;
    const origLegacyDeadline = process.env.LEGACY_COOKIE_MIGRATION_DEADLINE;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.COOKIE_ENCRYPTION_SECRET;
      process.env.JWT_SECRET = 'existing_jwt_secret_should_not_be_used_in_prod';

      let missingThrown = false;
      try {
        getEncryptionKey();
      } catch (err) {
        missingThrown = err.message.includes('Dedicated COOKIE_ENCRYPTION_SECRET must be configured in production');
      }
      assert(missingThrown, 'Production strictly requires COOKIE_ENCRYPTION_SECRET and does not silently fall back to JWT_SECRET');

      // Test short/insufficient entropy secret in production (< 64 hex chars)
      process.env.COOKIE_ENCRYPTION_SECRET = '0123456789abcdef';
      let shortThrown = false;
      try {
        getEncryptionKey();
      } catch (err) {
        shortThrown = err.message.includes('must be a 64-character hexadecimal string');
      }
      assert(shortThrown, 'Production strictly rejects secret with non-64 length');

      // Test invalid non-hex characters in 64-character secret
      process.env.COOKIE_ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg';
      let nonHexThrown = false;
      try {
        getEncryptionKey();
      } catch (err) {
        nonHexThrown = err.message.includes('must be a 64-character hexadecimal string');
      }
      assert(nonHexThrown, 'Production strictly rejects 64-char string with non-hex characters');

      // Test valid 64-character hexadecimal high-entropy secret (32 random bytes)
      process.env.COOKIE_ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const validKey = getEncryptionKey();
      assert(Buffer.isBuffer(validKey) && validKey.length === 32, 'Valid production 64-hex secret derives exact 32-byte key Buffer');

      // Legacy migration opt-in & deadline enforcement tests:
      // 1. Unset deadline follows explicit opt-in policy
      delete process.env.LEGACY_COOKIE_MIGRATION_DEADLINE;
      delete process.env.ALLOW_LEGACY_COOKIE_AUTH;
      assert(decryptCookieToken(sampleJwt) === null, 'Unset deadline with unset opt-in rejects legacy cookies');

      process.env.ALLOW_LEGACY_COOKIE_AUTH = 'false';
      assert(decryptCookieToken(sampleJwt) === null, 'Unset deadline with opt-in=false rejects legacy cookies');

      process.env.ALLOW_LEGACY_COOKIE_AUTH = 'true';
      assert(decryptCookieToken(sampleJwt) === sampleJwt, 'Unset deadline with opt-in=true accepts legacy cookies');

      // 2. Valid future deadline allows legacy cookies only when explicitly enabled
      process.env.ALLOW_LEGACY_COOKIE_AUTH = 'true';
      process.env.LEGACY_COOKIE_MIGRATION_DEADLINE = new Date(Date.now() + 60000).toISOString();
      assert(decryptCookieToken(sampleJwt) === sampleJwt, 'Valid future deadline allows legacy cookies when explicitly enabled');

      // 3. Expired deadline rejects legacy cookies
      process.env.ALLOW_LEGACY_COOKIE_AUTH = 'true';
      process.env.LEGACY_COOKIE_MIGRATION_DEADLINE = new Date(Date.now() - 60000).toISOString();
      assert(decryptCookieToken(sampleJwt) === null, 'Expired deadline rejects legacy cookies');

      // 4. Invalid or unparseable deadline fails closed and rejects legacy cookies
      process.env.ALLOW_LEGACY_COOKIE_AUTH = 'true';
      process.env.LEGACY_COOKIE_MIGRATION_DEADLINE = 'invalid-unparseable-date';
      assert(decryptCookieToken(sampleJwt) === null, 'Invalid or unparseable deadline fails closed and rejects legacy cookies');
    } finally {
      if (origEnv !== undefined) process.env.NODE_ENV = origEnv;
      else delete process.env.NODE_ENV;
      if (origCookieSecret) process.env.COOKIE_ENCRYPTION_SECRET = origCookieSecret;
      else delete process.env.COOKIE_ENCRYPTION_SECRET;
      if (origJwtSecret) process.env.JWT_SECRET = origJwtSecret;
      else delete process.env.JWT_SECRET;
      if (origLegacyAuth !== undefined) process.env.ALLOW_LEGACY_COOKIE_AUTH = origLegacyAuth;
      else delete process.env.ALLOW_LEGACY_COOKIE_AUTH;
      if (origLegacyDeadline !== undefined) process.env.LEGACY_COOKIE_MIGRATION_DEADLINE = origLegacyDeadline;
      else delete process.env.LEGACY_COOKIE_MIGRATION_DEADLINE;
    }

    // Edge cases: null, undefined, empty, numbers
    assert(encryptCookieToken(null) === '', 'encryptCookieToken(null) returns empty string');
    assert(encryptCookieToken('') === '', 'encryptCookieToken("") returns empty string');
    assert(decryptCookieToken(null) === null, 'decryptCookieToken(null) returns null');
    assert(decryptCookieToken('') === null, 'decryptCookieToken("") returns null');
    assert(decryptCookieToken('malformed:data') === null, 'decryptCookieToken("malformed:data") returns null');

    // 2. Start server and wait for DB
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}/api`;

    console.log('\n--- 2. Starting Test Server & Connecting Database ---');
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
    while ((await User.countDocuments()) < 3) {
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('  🌱 Database connected.\n');

    // 3. Register user and verify clear-text storage prevention
    console.log('--- 3. Testing User Registration & Password Hashing ---');
    const testEmail = `sec_auth_${Date.now()}@university.edu`;
    const rawPassword = 'StrongPassword123!';

    const regRes = await request('POST', '/auth/register', {
      name: 'Security Test Student',
      email: testEmail,
      password: rawPassword,
      confirmPassword: rawPassword,
      department: 'Computer Science',
      semester: 4,
    });

    assert(regRes.status === 201 && regRes.data.success, 'Registration succeeds with 201');
    const regCookies = parseCookies(regRes);
    const authCookie = regCookies['lostlecture_token'];

    assert(Boolean(authCookie), 'Registration sets lostlecture_token cookie');
    assert(authCookie && authCookie.split(':').length === 3, 'Auth cookie is stored in encrypted iv:authTag:ciphertext format');
    assert(authCookie && !authCookie.includes('eyJ'), 'Auth cookie does NOT store plaintext base64 JWT');

    // Verify database record has bcrypt hash and not plaintext password
    const dbUser = await User.findOne({ email: testEmail }).select('+passwordHash');
    assert(dbUser && dbUser.passwordHash.startsWith('$2'), 'Password stored as secure bcrypt hash in MongoDB');
    assert(dbUser && dbUser.passwordHash !== rawPassword, 'Password is never stored in clear text');
    assert(dbUser && dbUser.passwordHash.length === 60, 'Password hash is exact single-pass bcrypt hash length (60 chars)');

    // Model method verification (proves exactly single hashing and compatibility)
    const matchSuccess = await dbUser.matchPassword(rawPassword);
    assert(matchSuccess === true, 'Model matchPassword() succeeds with original raw password (no double hashing)');
    const matchFailure = await dbUser.matchPassword('IncorrectPassword123!');
    assert(matchFailure === false, 'Model matchPassword() correctly rejects wrong password');

    // 4. Testing Login & Encrypted Cookie Delivery
    console.log('\n--- 4. Testing Login & Encrypted Cookie Storage ---');
    const loginRes = await request('POST', '/auth/login', {
      email: testEmail,
      password: rawPassword,
    });

    assert(loginRes.status === 200 && loginRes.data.success, 'Login succeeds with 200 OK');
    const loginCookies = parseCookies(loginRes);
    const loginAuthCookie = loginCookies['lostlecture_token'];

    assert(Boolean(loginAuthCookie), 'Login sets lostlecture_token cookie');
    assert(loginAuthCookie && loginAuthCookie.split(':').length === 3, 'Login cookie is stored encrypted (AES-256-GCM)');
    assert(loginAuthCookie && !loginAuthCookie.includes('eyJ'), 'Login cookie does NOT expose raw JWT in clear text');

    // Response body provides Bearer token for API clients
    const bearerToken = loginRes.data?.data?.token;
    assert(Boolean(bearerToken) && bearerToken.split('.').length === 3, 'Login payload provides JWT for Bearer token clients');

    // 5. Testing Authentication via Protect Middleware
    console.log('\n--- 5. Testing Protected Route Verification ---');

    // A. Using Encrypted Cookie
    const meCookieRes = await request('GET', '/auth/me', null, null, `lostlecture_token=${loginAuthCookie}`);
    assert(meCookieRes.status === 200 && meCookieRes.data?.data?.email === testEmail, 'Protected /auth/me succeeds with encrypted cookie');

    // B. Using Bearer Token
    const meBearerRes = await request('GET', '/auth/me', null, bearerToken);
    assert(meBearerRes.status === 200 && meBearerRes.data?.data?.email === testEmail, 'Protected /auth/me succeeds with Bearer token');

    // C. Legacy Raw JWT Cookie Behavior (rejected by default, accepted only when opt-in is enabled)
    delete process.env.ALLOW_LEGACY_COOKIE_AUTH;
    const meLegacyDefaultRes = await request('GET', '/auth/me', null, null, `lostlecture_token=${bearerToken}`);
    assert(meLegacyDefaultRes.status === 401, 'Legacy unencrypted cookie is rejected with 401 by default (safe default)');

    process.env.ALLOW_LEGACY_COOKIE_AUTH = 'true';
    const meLegacyOptInRes = await request('GET', '/auth/me', null, null, `lostlecture_token=${bearerToken}`);
    assert(meLegacyOptInRes.status === 200 && meLegacyOptInRes.data?.data?.email === testEmail, 'Legacy unencrypted cookie succeeds when ALLOW_LEGACY_COOKIE_AUTH=true (explicit migration opt-in)');
    delete process.env.ALLOW_LEGACY_COOKIE_AUTH;

    // D. Expired JWT Token is strictly rejected through jwt.verify()
    const expiredToken = jwt.sign(
      { id: dbUser._id, role: dbUser.role },
      process.env.JWT_SECRET || 'lostlecture_secret_dev_key_fallback_123456789',
      { expiresIn: -10 } // Expired 10 seconds ago
    );
    const expiredBearerRes = await request('GET', '/auth/me', null, expiredToken);
    assert(expiredBearerRes.status === 401, 'Expired token is strictly rejected by jwt.verify() with 401');

    const encryptedExpiredCookie = encryptCookieToken(expiredToken);
    const expiredCookieRes = await request('GET', '/auth/me', null, null, `lostlecture_token=${encryptedExpiredCookie}`);
    assert(expiredCookieRes.status === 401, 'Encrypted cookie containing expired token is rejected by jwt.verify() with 401');

    // D. Tampered Cookie Rejected (fails closed, cannot fallback to legacy)
    const tamperedCookie = loginAuthCookie.slice(0, -4) + 'ffff';
    const meTamperedRes = await request('GET', '/auth/me', null, null, `lostlecture_token=${tamperedCookie}`);
    assert(meTamperedRes.status === 401, 'Tampered cookie rejected with 401 Unauthorized (fails closed)');

    // E. Verify encrypted format cannot be confused with legacy format
    assert(loginAuthCookie.includes(':') && !loginAuthCookie.includes('.'), 'Encrypted cookie uses colon delimiters and contains no dots');
    assert(bearerToken.includes('.') && !bearerToken.includes(':'), 'Legacy JWT uses dot delimiters and contains no colons');

    // 6. Testing Logout Cookie Clearing
    console.log('\n--- 6. Testing Logout ---');
    const logoutRes = await request('POST', '/auth/logout', null, bearerToken);
    assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

  } catch (err) {
    console.error('Unhandled test runner error:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthSecurityTests();
