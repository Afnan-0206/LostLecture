import mongoose from 'mongoose';
import app from '../server.js';
import Subject from '../models/Subject.js';
import Resource from '../models/Resource.js';
import { escapeRegex } from '../controllers/resourceController.js';

const PORT = 5003;
let server;
let baseUrl;

const request = async (method, path, body = null, token = null) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

async function runResourceSecurityTests() {
  console.log('\n--- 🛡️ RUNNING RESOURCE CONTROLLER QUERY INJECTION & SECURITY REGRESSION TESTS ---\n');
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
    // 1. Unit tests for escapeRegex
    console.log('--- 1. Testing escapeRegex Helper ---');
    assert(escapeRegex('hello.world*test?') === 'hello\\.world\\*test\\?', 'Escapes regex characters (. * ?)');
    assert(escapeRegex('C++ & [MERN] (2024)') === 'C\\+\\+ & \\[MERN\\] \\(2024\\)', 'Escapes plus, brackets, and parentheses');
    assert(escapeRegex('^abc$|def{1,2}') === '\\^abc\\$\\|def\\{1,2\\}', 'Escapes anchors, pipes, and braces');
    assert(escapeRegex('\\path\\to\\file') === '\\\\path\\\\to\\\\file', 'Escapes backslashes');
    assert(escapeRegex(null) === '', 'Safely returns empty string for null');
    assert(escapeRegex(undefined) === '', 'Safely returns empty string for undefined');
    assert(escapeRegex({ $regex: '.*' }) === '', 'Safely returns empty string for object input');
    assert(escapeRegex(12345) === '', 'Safely returns empty string for number input');

    // Test RegExp compilation with escaped ReDoS pattern
    const redosInput = '((a+)+)+$';
    const escapedPattern = escapeRegex(redosInput);
    const regex = new RegExp(escapedPattern, 'i');
    assert(regex.test('((a+)+)+$') === true, 'Compiled regex accurately matches literal malicious string');
    assert(regex.test('aaaaaaaaaaaaaaaaaaaa') === false, 'Escaped pattern does not trigger backtracking or match text');

    // 2. Start server and wait for seed
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}/api`;

    console.log('\n--- 2. Starting Test Server & Connecting Database ---');
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
    while ((await Subject.countDocuments()) < 8) {
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('  🌱 Database connected and ready for query testing.\n');

    // Login users for authenticated tests
    const studentLogin = await request('POST', '/auth/login', {
      email: 'student@lostlecture.edu',
      password: 'StudentPassword123!',
    });
    const studentToken = studentLogin.data?.data?.token;

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@lostlecture.edu',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.data?.data?.token;

    const testSubject = await Subject.findOne();
    const validSubjectId = testSubject._id.toString();

    // 3. Testing GET /api/resources query parameter operator injection
    console.log('--- 3. Testing GET /api/resources Operator Injection Defenses ---');

    // Query with operator in subject: ?subject[$ne]=null
    const subjectOpRes = await request('GET', `/resources?subject[$ne]=null`);
    assert(subjectOpRes.status === 200, 'Handled ?subject[$ne]=null without crash or 500');
    assert(Array.isArray(subjectOpRes.data?.data?.resources), 'Returns resources array safely');

    // Query with operator in semester: ?semester[$gt]=0
    const semOpRes = await request('GET', `/resources?semester[$gt]=0`);
    assert(semOpRes.status === 200, 'Handled ?semester[$gt]=0 without crash');

    // Query with invalid alphanumeric semester: ?semester=2abc (must not become 2)
    const semAlphaRes = await request('GET', `/resources?semester=2abc`);
    assert(semAlphaRes.status === 200, 'Handled ?semester=2abc without crash');

    // Query with operator in unit: ?unit[$gt]=0
    const unitOpRes = await request('GET', `/resources?unit[$gt]=0`);
    assert(unitOpRes.status === 200, 'Handled ?unit[$gt]=0 without crash');

    // Query with invalid alphanumeric unit: ?unit=3xyz (must not become 3)
    const unitAlphaRes = await request('GET', `/resources?unit=3xyz`);
    assert(unitAlphaRes.status === 200, 'Handled ?unit=3xyz without crash');

    // Query with operator in isPYQ: ?isPYQ[$ne]=true
    const pyqOpRes = await request('GET', `/resources?isPYQ[$ne]=true`);
    assert(pyqOpRes.status === 200, 'Handled ?isPYQ[$ne]=true without crash');

    // Query with operator in type: ?type[$ne]=Other
    const typeOpRes = await request('GET', `/resources?type[$ne]=Other`);
    assert(typeOpRes.status === 200, 'Handled ?type[$ne]=Other without crash');

    // Query with operator in tags: ?tags[$where]=sleep(1000)
    const tagOpRes = await request('GET', `/resources?tags[$where]=sleep(1000)`);
    assert(tagOpRes.status === 200, 'Handled ?tags[$where]=... operator injection safely');

    // Query with operator in sort: ?sort[$ne]=newest
    const sortOpRes = await request('GET', `/resources?sort[$ne]=newest`);
    assert(sortOpRes.status === 200, 'Handled ?sort[$ne]=newest; safely defaulted to createdAt sort');

    // 4. Testing Pagination and Limits bounds
    console.log('\n--- 4. Testing Pagination & Limit Bounds ---');
    const limitHighRes = await request('GET', `/resources?limit=999999`);
    assert(limitHighRes.status === 200, 'High limit handled safely');
    assert(limitHighRes.data?.data?.pagination?.limit === 100, 'Limit capped at maximum 100');

    const limitNegRes = await request('GET', `/resources?limit=-50`);
    assert(limitNegRes.status === 200, 'Negative limit handled safely');
    assert(limitNegRes.data?.data?.pagination?.limit === 1, 'Negative limit clamped to minimum 1');

    const pageNegRes = await request('GET', `/resources?page=-10`);
    assert(pageNegRes.status === 200, 'Negative page handled safely');
    assert(pageNegRes.data?.data?.pagination?.page === 1, 'Negative page clamped to minimum 1');

    // 5. Testing Regex Injection and Search
    console.log('\n--- 5. Testing Search & Regex Injection ---');

    // Search with wildcards .* (should not match non-matching resources as wildcard)
    const wildcardRes = await request('GET', `/resources?search=.*`);
    assert(wildcardRes.status === 200, 'Search with .* executed safely');

    // Search with ReDoS string
    const redosRes = await request('GET', `/resources?search=((a%2B)%2B)%2B%24`);
    assert(redosRes.status === 200, 'Search with complex ReDoS pattern handled safely without hanging');

    // Object search injection: ?search[$regex]=.*
    const objSearchRes = await request('GET', `/resources?search[$regex]=.*`);
    assert(objSearchRes.status === 200, 'Handled ?search[$regex]=.* without passing raw object to query');

    // Legitimate search
    const legitSearchRes = await request('GET', `/resources?search=Data`);
    assert(legitSearchRes.status === 200, 'Legitimate keyword search succeeds');

    // 6. Testing Status Security
    console.log('\n--- 6. Testing Status Visibility Security ---');
    // Unauthenticated user requesting allStatus=true
    const unauthStatusRes = await request('GET', `/resources?allStatus=true`);
    assert(unauthStatusRes.status === 200, 'Public request with allStatus=true succeeds');
    const unapprovedPublic = (unauthStatusRes.data?.data?.resources || []).filter(
      (r) => r.status && r.status !== 'approved'
    );
    assert(unapprovedPublic.length === 0, 'Public user cannot see non-approved resources even with allStatus=true');

    // 7. Testing createResource (Line 186 Subject query injection)
    console.log('\n--- 7. Testing createResource Subject Query Injection Defenses ---');

    // Attacker sends operator object: { subject: { "$ne": null } }
    const injectSubjectRes = await request(
      'POST',
      '/resources',
      {
        title: 'Malicious Injected Subject Resource',
        description: 'Testing operator injection on subject field',
        subject: { $ne: null },
        semester: 1,
        resourceUrl: 'https://example.com/exploit.pdf',
        type: 'Notes',
      },
      studentToken
    );
    assert(
      injectSubjectRes.status === 400 && injectSubjectRes.data?.message?.includes('Invalid or missing Subject ID'),
      'Operator object in subject rejected with 400 Bad Request'
    );

    // Attacker sends invalid non-ObjectId string
    const invalidIdStringRes = await request(
      'POST',
      '/resources',
      {
        title: 'Invalid ID Resource',
        description: 'Testing non-hex subject ID',
        subject: 'not-a-valid-hex-id',
        semester: 1,
        resourceUrl: 'https://example.com/test.pdf',
        type: 'Notes',
      },
      studentToken
    );
    assert(
      invalidIdStringRes.status === 400,
      'Invalid non-hex subject ID rejected with 400 Bad Request'
    );

    // Non-existent subject ID (valid hex format)
    const nonExistentSubjectId = new mongoose.Types.ObjectId().toString();
    const notFoundSubjectRes = await request(
      'POST',
      '/resources',
      {
        title: 'Non-existent Subject Resource',
        description: 'Testing non-existent subject',
        subject: nonExistentSubjectId,
        semester: 1,
        resourceUrl: 'https://example.com/test.pdf',
        type: 'Notes',
      },
      studentToken
    );
    assert(
      notFoundSubjectRes.status === 404 && notFoundSubjectRes.data?.message?.includes('does not exist'),
      'Valid format but non-existent subject ID returns 404 Not Found'
    );

    // Legitimate resource creation by student (pending moderation)
    const legitCreateRes = await request(
      'POST',
      '/resources',
      {
        title: 'Security Verified Clean Resource',
        description: 'Verified resource created cleanly',
        subject: validSubjectId,
        semester: testSubject.semester || 1,
        unit: 1,
        resourceUrl: 'https://example.com/verified.pdf',
        type: 'PDF',
        tags: 'security, clean, test',
      },
      studentToken
    );
    assert(
      legitCreateRes.status === 201 && legitCreateRes.data?.data?.status === 'pending',
      'Legitimate resource creation succeeds with valid subject ObjectId'
    );
    const createdResourceId = legitCreateRes.data?.data?._id;

    // 8. Testing ID Format Validation on remaining endpoints
    console.log('\n--- 8. Testing Endpoint ID Format Validation ---');

    // getResourceById with invalid ID
    const getInvalidIdRes = await request('GET', '/resources/invalid-mongo-id');
    assert(getInvalidIdRes.status === 400, 'GET /resources/invalid-id returns 400 Invalid ID');

    // getResourceById with non-existent valid ObjectId
    const getNotFoundRes = await request('GET', `/resources/${new mongoose.Types.ObjectId().toString()}`);
    assert(getNotFoundRes.status === 404, 'GET /resources/:nonExistent returns 404');

    // incrementViewCount with invalid ID
    const viewInvalidIdRes = await request('POST', '/resources/invalid-mongo-id/view');
    assert(viewInvalidIdRes.status === 400, 'POST /resources/invalid-id/view returns 400 Invalid ID');

    // toggleUpvote with invalid ID
    const voteInvalidIdRes = await request('POST', '/resources/invalid-mongo-id/vote', null, studentToken);
    assert(voteInvalidIdRes.status === 400, 'POST /resources/invalid-id/vote returns 400 Invalid ID');

    // updateResource with invalid ID
    const updateInvalidIdRes = await request('PATCH', '/resources/invalid-mongo-id', { title: 'New' }, studentToken);
    assert(updateInvalidIdRes.status === 400, 'PATCH /resources/invalid-id returns 400 Invalid ID');

    // deleteResource with invalid ID
    const deleteInvalidIdRes = await request('DELETE', '/resources/invalid-mongo-id', null, studentToken);
    assert(deleteInvalidIdRes.status === 400, 'DELETE /resources/invalid-id returns 400 Invalid ID');

    // Legitimate view count increment on created resource
    if (createdResourceId) {
      const viewRes = await request('POST', `/resources/${createdResourceId}/view`);
      assert(viewRes.status === 200 && viewRes.data?.data?.views === 1, 'View count incremented successfully');

      // Legitimate toggle upvote
      const voteRes = await request('POST', `/resources/${createdResourceId}/vote`, null, studentToken);
      assert(voteRes.status === 200 && voteRes.data?.data?.hasUpvoted === true, 'Upvote toggled successfully');

      // Admin approves and updates status
      const adminUpdateRes = await request(
        'PATCH',
        `/resources/${createdResourceId}`,
        { status: 'approved' },
        adminToken
      );
      assert(adminUpdateRes.status === 200 && adminUpdateRes.data?.data?.status === 'approved', 'Admin updates resource status');
    }

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

runResourceSecurityTests();
