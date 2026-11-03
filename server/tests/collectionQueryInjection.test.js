import mongoose from 'mongoose';
import app from '../server.js';
import Subject from '../models/Subject.js';
import Collection from '../models/Collection.js';
import Resource from '../models/Resource.js';

const PORT = 5004;
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

async function runCollectionSecurityTests() {
  console.log('\n--- 🛡️ RUNNING COLLECTION CONTROLLER QUERY INJECTION & SECURITY REGRESSION TESTS ---\n');
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
    baseUrl = `http://localhost:${PORT}/api`;

    console.log('  ⏳ Connecting to database and verifying seed readiness...');
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
    while ((await Subject.countDocuments()) < 8) {
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('  🌱 Database and seed data ready.\n');

    // Authenticate users
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

    // 1. Operator injection in GET /api/collections?subject[...]
    console.log('--- 1. Testing GET /api/collections Operator Injection Defenses ---');

    // Injected $ne: ?subject[$ne]=null
    const neRes = await request('GET', '/collections?subject[$ne]=null');
    assert(neRes.status === 200, 'Handled ?subject[$ne]=null without crash or 500');
    assert(Array.isArray(neRes.data?.data), 'Returns collections array safely');

    // Injected $where: ?subject[$where]=sleep(1000)
    const whereRes = await request('GET', '/collections?subject[$where]=sleep(1000)');
    assert(whereRes.status === 200, 'Handled ?subject[$where]=... operator safely');

    // Injected $gt on subject: ?subject[$gt]=
    const gtRes = await request('GET', '/collections?subject[$gt]=');
    assert(gtRes.status === 200, 'Handled ?subject[$gt]= operator safely');

    // Injected $gt on semester: ?semester[$gt]=0
    const semGtRes = await request('GET', '/collections?semester[$gt]=0');
    assert(semGtRes.status === 200, 'Handled ?semester[$gt]=0 without crash');

    // Injected alphanumeric on semester: ?semester=2abc (must not become 2)
    const semAlphaRes = await request('GET', '/collections?semester=2abc');
    assert(semAlphaRes.status === 200, 'Handled ?semester=2abc without crash');

    // Injected $ne on semester: ?semester[$ne]=1
    const semNeRes = await request('GET', '/collections?semester[$ne]=1');
    assert(semNeRes.status === 200, 'Handled ?semester[$ne]=1 without crash');

    // Invalid non-ObjectId string for subject
    const invalidSubRes = await request('GET', '/collections?subject=invalid-format-id');
    assert(invalidSubRes.status === 200, 'Invalid subject string handled gracefully (200 OK)');
    assert(Array.isArray(invalidSubRes.data?.data) && invalidSubRes.data.data.length === 0, 'Invalid subject string safely yields empty list');

    // Valid subject query
    const validSubRes = await request('GET', `/collections?subject=${validSubjectId}`);
    assert(validSubRes.status === 200, 'Valid subject ID query succeeds');

    // Valid semester query
    const validSemRes = await request('GET', '/collections?semester=3');
    assert(validSemRes.status === 200, 'Valid semester integer query succeeds');

    // 2. ID Validation on GET /api/collections/:id
    console.log('\n--- 2. Testing GET /api/collections/:id Identifier Validation ---');

    const invalidIdRes = await request('GET', '/collections/invalid-id-format');
    assert(invalidIdRes.status === 400, 'Invalid ID format rejected with 400 Bad Request');
    assert(invalidIdRes.data?.message?.includes('Invalid collection identifier format'), 'Clear error message returned');

    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await request('GET', `/collections/${nonExistentId}`);
    assert(notFoundRes.status === 404, 'Non-existent valid ObjectId returns 404 Not Found');

    // 3. Testing POST /api/collections Injection & Validation
    console.log('\n--- 3. Testing POST /api/collections Injection Defenses ---');

    // Missing required fields
    const missingFieldsRes = await request(
      'POST',
      '/collections',
      { title: 'No subject' },
      studentToken
    );
    assert(missingFieldsRes.status === 400, 'Missing subject/semester rejected with 400');

    // Operator injection in subject: { subject: { "$ne": null } }
    const injectSubjectBodyRes = await request(
      'POST',
      '/collections',
      {
        title: 'Exploit Collection',
        description: 'Testing operator injection',
        subject: { $ne: null },
        semester: 3,
      },
      studentToken
    );
    assert(injectSubjectBodyRes.status === 400, 'Operator object in subject rejected with 400');

    // Operator injection in semester: { semester: { "$gt": 0 } }
    const injectSemBodyRes = await request(
      'POST',
      '/collections',
      {
        title: 'Exploit Collection Sem',
        description: 'Testing operator injection on semester',
        subject: validSubjectId,
        semester: { $gt: 0 },
      },
      studentToken
    );
    assert(injectSemBodyRes.status === 400, 'Operator object in semester rejected with 400');

    // Non-existent subject ID
    const notFoundSubRes = await request(
      'POST',
      '/collections',
      {
        title: 'Pack with non-existent subject',
        description: 'Testing 404 on subject lookup',
        subject: nonExistentId,
        semester: 2,
      },
      studentToken
    );
    assert(notFoundSubRes.status === 404, 'Non-existent subject ID returns 404 Not Found');

    // Legitimate collection creation with operator objects in resources array
    const testResource = await Resource.findOne();
    const validResourceId = testResource ? testResource._id.toString() : new mongoose.Types.ObjectId().toString();

    const legitCreateRes = await request(
      'POST',
      '/collections',
      {
        title: 'Security Verified Clean Survival Pack',
        description: 'A well-structured study pack with sanitized resources',
        subject: validSubjectId,
        semester: 3,
        resources: [validResourceId, { $ne: null }, 'invalid-res-id'],
      },
      studentToken
    );
    assert(legitCreateRes.status === 201, 'Legitimate collection creation succeeds with 201 Created');
    assert(legitCreateRes.data?.data?.title === 'Security Verified Clean Survival Pack', 'Created collection contains expected title');
    // Verify malicious/invalid items were filtered from resources
    const createdCol = legitCreateRes.data?.data;
    assert(createdCol?.resources?.length <= 1, 'Operator objects and invalid IDs safely excluded from resources array');
    const createdColId = createdCol?._id;

    // Verify GET /api/collections/:id on newly created collection
    if (createdColId) {
      const getNewRes = await request('GET', `/collections/${createdColId}`);
      assert(getNewRes.status === 200, 'GET /collections/:id retrieves created collection');
      assert(getNewRes.data?.data?._id === createdColId, 'Retrieved ID matches created ID');
    }

    // 4. Testing DELETE /api/collections/:id
    console.log('\n--- 4. Testing DELETE /api/collections/:id Defenses ---');

    const deleteInvalidRes = await request('DELETE', '/collections/invalid-id-format', null, studentToken);
    assert(deleteInvalidRes.status === 400, 'DELETE with invalid ID rejected with 400 Bad Request');

    const deleteNotFoundRes = await request('DELETE', `/collections/${nonExistentId}`, null, studentToken);
    assert(deleteNotFoundRes.status === 404, 'DELETE non-existent collection returns 404 Not Found');

    // Legitimate deletion by owner
    if (createdColId) {
      const deleteSuccessRes = await request('DELETE', `/collections/${createdColId}`, null, studentToken);
      assert(deleteSuccessRes.status === 200, 'Owner can delete their own collection');

      const verifyDeletedRes = await request('GET', `/collections/${createdColId}`);
      assert(verifyDeletedRes.status === 404, 'Deleted collection no longer accessible (404)');
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

runCollectionSecurityTests();
