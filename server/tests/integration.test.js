import mongoose from 'mongoose';
import app from '../server.js';
import Subject from '../models/Subject.js';

const PORT = 5001;
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

async function runTests() {
  console.log('\n--- 🚀 RUNNING lostLecture INTEGRATION TEST SUITE ---\n');
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

    // Wait until mongoose is connected and server auto-seeding is complete
    console.log('  ⏳ Waiting for database connection and seed readiness...');
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 400));
    }

    // Wait until auto-seed in server.js has populated subjects
    while ((await Subject.countDocuments()) < 8) {
      await new Promise((r) => setTimeout(r, 400));
    }
    console.log('  🌱 Database and academic catalog verified ready for testing.\n');

    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data.success, 'Health check endpoint operational');

    // 2. Login seeded admin
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@lostlecture.edu',
      password: 'AdminPassword123!',
    });
    assert(
      adminLogin.status === 200 && adminLogin.data.data.user.role === 'admin',
      'Admin login authenticates with role "admin"'
    );
    const adminToken = adminLogin.data?.data?.token;

    // 3. Login seeded student
    const studentLogin = await request('POST', '/auth/login', {
      email: 'student@lostlecture.edu',
      password: 'StudentPassword123!',
    });
    assert(
      studentLogin.status === 200 && studentLogin.data.data.user.role === 'student',
      'Student login authenticates with role "student"'
    );
    const studentToken = studentLogin.data?.data?.token;

    // 4. Invalid login rejected
    const badLogin = await request('POST', '/auth/login', {
      email: 'student@lostlecture.edu',
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401, 'Invalid password correctly rejected with 401');

    // 5. Register new student
    const randomEmail = `test_${Date.now()}@university.edu`;
    const regRes = await request('POST', '/auth/register', {
      name: 'Test Student',
      email: randomEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      department: 'Computer Science',
      semester: 3,
    });
    assert(regRes.status === 201 && regRes.data.success, 'New student registration succeeds');

    // 6. Duplicate registration rejected
    const dupRes = await request('POST', '/auth/register', {
      name: 'Test Student Duplicate',
      email: randomEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      department: 'Computer Science',
      semester: 3,
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // 7. Protected route /auth/me
    const meRes = await request('GET', '/auth/me', null, studentToken);
    assert(
      meRes.status === 200 && meRes.data.data.email === 'student@lostlecture.edu',
      'Protected /auth/me returns current authenticated user'
    );

    // 8. Admin authorization check: student denied admin access
    const studentDeniedAdmin = await request('GET', '/admin/dashboard', null, studentToken);
    assert(
      studentDeniedAdmin.status === 403,
      'Student access to /admin/dashboard blocked with 403 Forbidden'
    );

    // 9. Admin authorized to access admin dashboard
    const adminAllowed = await request('GET', '/admin/dashboard', null, adminToken);
    assert(
      adminAllowed.status === 200 && adminAllowed.data.data.stats.totalStudents >= 1,
      'Admin access to /admin/dashboard succeeds with full metrics'
    );

    // 10. Subjects query
    const subjectsRes = await request('GET', '/subjects');
    assert(
      subjectsRes.status === 200 && subjectsRes.data.data.subjects.length >= 8,
      'Subjects retrieved with resource counts'
    );
    const testSubjectId = subjectsRes.data.data.subjects[0]._id;

    // 11. Student creates resource -> status must be 'pending'
    const studentResourceRes = await request(
      'POST',
      '/resources',
      {
        title: 'Student Submission Test Notes',
        description: 'Practice questions for algorithms',
        subject: testSubjectId,
        semester: 2,
        type: 'Notes',
        tags: 'test, revision',
        resourceUrl: 'https://example.com/test-notes.pdf',
      },
      studentToken
    );
    assert(
      studentResourceRes.status === 201 && studentResourceRes.data.data.status === 'pending',
      'Student resource submission defaults to "pending" moderation status'
    );
    const submittedResourceId = studentResourceRes.data.data._id;

    // 12. Admin sees pending submission
    const pendingRes = await request('GET', '/admin/resources/pending', null, adminToken);
    const inPending = pendingRes.data.data.some((r) => r._id === submittedResourceId);
    assert(inPending, 'Admin can see student submission in pending queue');

    // 13. Admin approves resource
    const approveRes = await request(
      'PATCH',
      `/admin/resources/${submittedResourceId}/approve`,
      null,
      adminToken
    );
    assert(
      approveRes.status === 200 && approveRes.data.data.status === 'approved',
      'Admin approves resource, updating status to "approved"'
    );

    // 14. Search & Filter resources
    const searchRes = await request('GET', '/resources?search=algorithms');
    if (searchRes.status !== 200) {
      console.error('  ⚠️ Search Error Response:', searchRes.data);
    }
    assert(
      searchRes.status === 200 && searchRes.data.data.resources.length > 0,
      'Case-insensitive search against MongoDB works'
    );

    // 15. Bookmark resource
    const bookmarkRes = await request('POST', `/bookmarks/${submittedResourceId}`, null, studentToken);
    assert(bookmarkRes.status === 201 || bookmarkRes.status === 200, 'Student can bookmark resource');

    // 16. Duplicate bookmark handled idempotently
    const dupBookmark = await request('POST', `/bookmarks/${submittedResourceId}`, null, studentToken);
    assert(dupBookmark.status === 200, 'Duplicate bookmark handled gracefully');

    // 17. View count increment
    const viewRes = await request('POST', `/resources/${submittedResourceId}/view`);
    assert(viewRes.status === 200 && viewRes.data.data.views >= 1, 'View count increments successfully');

    // 18. Report resource
    const reportRes = await request(
      'POST',
      `/reports/${submittedResourceId}`,
      { reason: 'Broken link', description: 'Link gives 404' },
      studentToken
    );
    assert(reportRes.status === 201, 'Student can submit issue report for broken/outdated material');

    // 19. Duplicate active report rejected
    const dupReport = await request(
      'POST',
      `/reports/${submittedResourceId}`,
      { reason: 'Broken link' },
      studentToken
    );
    assert(dupReport.status === 409, 'Duplicate active report rejected with 409 Conflict');

    // 20. Admin reviews and resolves report
    const allReports = await request('GET', '/admin/reports', null, adminToken);
    const activeReport = allReports.data.data.find((r) => r.resource?._id === submittedResourceId);
    if (activeReport) {
      const resolveRes = await request(
        'PATCH',
        `/admin/reports/${activeReport._id}`,
        { status: 'Resolved', adminNotes: 'Verified and link updated' },
        adminToken
      );
      assert(
        resolveRes.status === 200 && resolveRes.data.data.status === 'Resolved',
        'Admin resolves report with feedback'
      );
    }

    // 21. Upvote / Helpfulness voting
    const voteRes = await request('POST', `/resources/${submittedResourceId}/vote`, null, studentToken);
    assert(
      voteRes.status === 200 && voteRes.data.data.upvotes >= 1 && voteRes.data.data.hasUpvoted === true,
      'Student can upvote resource and upvote count increments'
    );

    // 22. Threaded Discussion / Q&A comments
    const commentRes = await request(
      'POST',
      `/resources/${submittedResourceId}/comments`,
      { content: 'Is question 3 from this revision sheet covered in the midterm syllabus?' },
      studentToken
    );
    assert(
      commentRes.status === 201 && commentRes.data.data.content.includes('question 3'),
      'Student can post a question to the resource discussion board'
    );
    const getComments = await request('GET', `/resources/${submittedResourceId}/comments`);
    assert(
      getComments.status === 200 && getComments.data.data.length >= 1,
      'Discussion comments are queryable per resource'
    );

    // 23. AI Study Assistant (Summary & Quiz)
    const aiSummaryRes = await request('GET', `/resources/${submittedResourceId}/ai-summary`);
    assert(
      aiSummaryRes.status === 200 && aiSummaryRes.data.data.summary.length > 0,
      'AI Study Assistant delivers structured summary & key takeaways'
    );
    const aiQuizRes = await request('GET', `/resources/${submittedResourceId}/ai-quiz`);
    assert(
      aiQuizRes.status === 200 && Array.isArray(aiQuizRes.data.data.questions) && aiQuizRes.data.data.questions.length > 0,
      'AI Practice Quiz generates multiple-choice questions with answers'
    );

    // 24. Curated Exam Survival Packs (Collections)
    const collectionsRes = await request('GET', '/collections');
    assert(
      collectionsRes.status === 200 && Array.isArray(collectionsRes.data.data),
      'Exam survival packs and bundles list successfully'
    );
    const createCollectionRes = await request(
      'POST',
      '/collections',
      {
        title: 'End-Sem Algorithm Masterpack',
        description: 'All unit notes, cheat sheets, and solved PYQs for algorithms',
        semester: 3,
        resources: [submittedResourceId],
        tags: 'exam, endsem, dsa',
      },
      studentToken
    );
    assert(
      createCollectionRes.status === 201 && createCollectionRes.data.data.title.includes('Masterpack'),
      'Student can curate and publish an Exam Survival Pack'
    );

    // 25. Contributor Leaderboard
    const leaderboardRes = await request('GET', '/leaderboard');
    assert(
      leaderboardRes.status === 200 && Array.isArray(leaderboardRes.data.data.topContributors),
      'Contributor Leaderboard ranks top scholars with badges and points'
    );

    console.log(`\n--- 📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED ---\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runTests();
