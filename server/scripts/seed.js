import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Resource from '../models/Resource.js';
import Bookmark from '../models/Bookmark.js';
import Report from '../models/Report.js';
import Comment from '../models/Comment.js';
import Collection from '../models/Collection.js';
import connectDB, { disconnectDB } from '../config/db.js';

dotenv.config();

export const seedDatabase = async () => {
  console.log('[Seed] Starting database population...');

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Subject.deleteMany({}),
    Resource.deleteMany({}),
    Bookmark.deleteMany({}),
    Report.deleteMany({}),
    Comment.deleteMany({}),
    Collection.deleteMany({}),
  ]);

  console.log('[Seed] Cleared existing records');

  // 1. Create Users
  const adminPasswordHash = await User.hashPassword('AdminPassword123!');
  const studentPasswordHash = await User.hashPassword('StudentPassword123!');

  const admin = await User.create({
    name: 'Prof. David Vance',
    email: 'admin@lostlecture.edu',
    passwordHash: adminPasswordHash,
    role: 'admin',
    department: 'Computer Science & Engineering',
    semester: 8,
    studentId: 'FAC-CS-001',
    isActive: true,
  });

  const student1 = await User.create({
    name: 'Alex Johnson',
    email: 'student@lostlecture.edu',
    passwordHash: studentPasswordHash,
    role: 'student',
    department: 'Computer Science & Engineering',
    semester: 4,
    studentId: '2024CS042',
    isActive: true,
  });

  const student2 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@lostlecture.edu',
    passwordHash: studentPasswordHash,
    role: 'student',
    department: 'Computer Science & Engineering',
    semester: 6,
    studentId: '2023CS019',
    isActive: true,
  });

  console.log(`[Seed] Created ${3} users (1 Admin, 2 Students)`);

  // 2. Create Subjects
  const subjectsData = [
    {
      name: 'Introduction to Programming & Algorithms',
      code: 'CS101',
      semester: 1,
      description: 'Foundations of structured programming, pointers, memory allocation, and time complexity in C/C++.',
    },
    {
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      semester: 2,
      description: 'Linear and non-linear data structures: Linked Lists, Stacks, Queues, Balanced Trees, Graphs, Sorting, and Dynamic Programming.',
    },
    {
      name: 'Computer Organization & Architecture',
      code: 'CS301',
      semester: 3,
      description: 'Instruction set architecture, ALU design, pipelining, cache memory hierarchies, and bus systems.',
    },
    {
      name: 'Operating Systems Concepts & Design',
      code: 'CS401',
      semester: 4,
      description: 'Process management, multi-threading, concurrency, CPU scheduling, deadlocks, and virtual memory paging.',
    },
    {
      name: 'Database Management Systems & SQL',
      code: 'CS402',
      semester: 4,
      description: 'Relational algebra, ER diagrams, schema normalization (1NF-BCNF), ACID properties, and indexing strategies.',
    },
    {
      name: 'Computer Networks & Protocols',
      code: 'CS501',
      semester: 5,
      description: 'OSI 7-layer model, TCP/IP socket programming, flow and congestion control, routing algorithms, and DNS.',
    },
    {
      name: 'Software Engineering & Design Patterns',
      code: 'CS601',
      semester: 6,
      description: 'Agile methodologies, UML diagrams, SOLID principles, creational/structural design patterns, and CI/CD pipelines.',
    },
    {
      name: 'Machine Learning & Intelligent Systems',
      code: 'CS701',
      semester: 7,
      description: 'Supervised and unsupervised learning, gradient descent, linear/logistic regression, SVMs, neural networks, and model evaluation.',
    },
  ];

  const createdSubjects = await Subject.insertMany(subjectsData);
  console.log(`[Seed] Created ${createdSubjects.length} subjects`);

  const subMap = {};
  createdSubjects.forEach((s) => {
    subMap[s.code] = s._id;
  });

  // 3. Create Resources with Units, Upvotes & PYQ Flags
  const resourcesData = [
    {
      title: 'Unit 3: Virtual Memory & Page Replacement Algorithms Slides',
      description: 'Detailed lecture slides covering demand paging, page faults, FIFO, LRU, and Optimal replacement strategies with numerical examples.',
      subject: subMap['CS401'],
      semester: 4,
      unit: 3,
      isPYQ: true,
      type: 'PDF',
      tags: ['operating-systems', 'paging', 'virtual-memory', 'exam-prep'],
      resourceUrl: 'https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/9_VirtualMemory.html',
      uploadedBy: admin._id,
      status: 'approved',
      verificationStatus: 'verified',
      views: 142,
      upvotes: [student1._id, student2._id],
      upvoteCount: 2,
    },
    {
      title: 'Relational Schema Normalization (1NF to BCNF) Handout',
      description: 'Comprehensive step-by-step revision notes with 15 solved practice questions determining functional dependencies and candidate keys.',
      subject: subMap['CS402'],
      semester: 4,
      unit: 2,
      isPYQ: true,
      type: 'Notes',
      tags: ['dbms', 'normalization', 'bcnf', 'sql'],
      resourceUrl: 'https://en.wikipedia.org/wiki/Database_normalization',
      uploadedBy: student1._id,
      status: 'approved',
      verificationStatus: 'verified',
      views: 98,
      upvotes: [student2._id],
      upvoteCount: 1,
    },
    {
      title: 'Binary Search Trees & AVL Tree Rotations Cheatsheet',
      description: 'Visual diagrams and C++ implementation code for single and double rotations in self-balancing AVL trees.',
      subject: subMap['CS201'],
      semester: 2,
      unit: 4,
      isPYQ: false,
      type: 'PDF',
      tags: ['dsa', 'trees', 'avl', 'algorithms'],
      resourceUrl: 'https://www.geeksforgeeks.org/introduction-to-avl-tree/',
      uploadedBy: student2._id,
      status: 'approved',
      verificationStatus: 'verified',
      views: 215,
      upvotes: [student1._id, admin._id],
      upvoteCount: 2,
    },
    {
      title: 'TCP vs UDP Multi-threaded Socket Programming Assignment',
      description: 'Lab assignment description, client-server template code in Python, and test rubric for reliable packet delivery emulation.',
      subject: subMap['CS501'],
      semester: 5,
      unit: 2,
      isPYQ: false,
      type: 'Assignment',
      tags: ['networking', 'sockets', 'tcp', 'python-lab'],
      resourceUrl: 'https://docs.python.org/3/howto/sockets.html',
      uploadedBy: admin._id,
      status: 'approved',
      verificationStatus: 'verified',
      views: 74,
      upvotes: [student1._id],
      upvoteCount: 1,
    },
    {
      title: 'SOLID Principles & Gang of Four Design Patterns Slide Deck',
      description: 'Class presentation on Singleton, Factory, Strategy, and Observer patterns with real-world refactoring examples.',
      subject: subMap['CS601'],
      semester: 6,
      unit: 3,
      isPYQ: true,
      type: 'PPT',
      tags: ['software-engineering', 'design-patterns', 'solid', 'architecture'],
      resourceUrl: 'https://refactoring.guru/design-patterns',
      uploadedBy: student2._id,
      status: 'approved',
      verificationStatus: 'unverified',
      views: 52,
      upvotes: [],
      upvoteCount: 0,
    },
    {
      title: 'Gradient Descent Optimization & Cost Function Derivation',
      description: 'Mathematical derivation of batch and stochastic gradient descent formulas with learning rate tuning guidelines.',
      subject: subMap['CS701'],
      semester: 7,
      unit: 1,
      isPYQ: true,
      type: 'Notes',
      tags: ['machine-learning', 'math', 'gradient-descent', 'neural-networks'],
      resourceUrl: 'https://en.wikipedia.org/wiki/Gradient_descent',
      uploadedBy: student1._id,
      status: 'approved',
      verificationStatus: 'verified',
      views: 110,
      upvotes: [student2._id],
      upvoteCount: 1,
    },
    {
      title: 'MIPS CPU Datapath & Instruction Pipelining Hazards Slides',
      description: 'Structural, data, and control hazard mitigation using forwarding, stalls, and branch prediction mechanisms.',
      subject: subMap['CS301'],
      semester: 3,
      unit: 3,
      isPYQ: false,
      type: 'PDF',
      tags: ['coa', 'pipelining', 'mips', 'hazards'],
      resourceUrl: 'https://en.wikipedia.org/wiki/Classic_RISC_pipeline',
      uploadedBy: student1._id,
      status: 'approved',
      verificationStatus: 'unverified',
      views: 45,
      upvotes: [],
      upvoteCount: 0,
    },
    {
      title: 'Unit 2: Inter-Process Communication (Pipes & Shared Memory)',
      description: 'Student submitted draft notes covering POSIX shared memory and named pipes (FIFOs).',
      subject: subMap['CS401'],
      semester: 4,
      unit: 2,
      isPYQ: false,
      type: 'Notes',
      tags: ['ipc', 'pipes', 'shared-memory'],
      resourceUrl: 'https://man7.org/linux/man-pages/man7/pipe.7.html',
      uploadedBy: student2._id,
      status: 'pending',
      verificationStatus: 'unverified',
      views: 0,
      upvotes: [],
      upvoteCount: 0,
    },
    {
      title: 'Exam Review: Concurrency & Semaphores Solutions',
      description: 'Review problems for Dining Philosophers and Producer-Consumer with counting semaphores.',
      subject: subMap['CS401'],
      semester: 4,
      unit: 2,
      isPYQ: true,
      type: 'PDF',
      tags: ['deadlock', 'semaphores', 'concurrency'],
      resourceUrl: 'https://en.wikipedia.org/wiki/Dining_philosophers_problem',
      uploadedBy: student1._id,
      status: 'pending',
      verificationStatus: 'unverified',
      views: 0,
      upvotes: [],
      upvoteCount: 0,
    },
  ];

  const createdResources = await Resource.insertMany(resourcesData);
  console.log(`[Seed] Created ${createdResources.length} resources`);

  // 4. Create Bookmark for student1
  await Bookmark.create({
    user: student1._id,
    resource: createdResources[0]._id,
  });
  await Bookmark.create({
    user: student1._id,
    resource: createdResources[2]._id,
  });
  console.log('[Seed] Created sample bookmarks');

  // 5. Create a sample report for moderation
  await Report.create({
    resource: createdResources[0]._id,
    reportedBy: student2._id,
    reason: 'Outdated material',
    description: 'The syllabus section referenced for slide 14 was updated in the latest curriculum revision.',
    status: 'Pending',
  });
  console.log('[Seed] Created sample report');

  // 6. Create sample Discussion Comments
  await Comment.create({
    resource: createdResources[0]._id,
    user: student1._id,
    content: 'On slide 18, is the Belady anomaly formula required for the Midterm 1 proof question?',
  });
  await Comment.create({
    resource: createdResources[0]._id,
    user: admin._id,
    content: 'Yes Alex, make sure you know the 3-frame vs 4-frame FIFO counterexample specifically.',
  });
  console.log('[Seed] Created sample discussion threads');

  // 7. Create sample Curated Study Pack (Collection)
  await Collection.create({
    title: 'Operating Systems Endterm Cram Pack (CS401)',
    description: 'All verified lecture slides, page replacement examples, and concurrency numericals bundled for fast exam revision.',
    subject: subMap['CS401'],
    semester: 4,
    resources: [createdResources[0]._id],
    createdBy: admin._id,
    isPublic: true,
  });
  console.log('[Seed] Created sample curated study collection');

  console.log('[Seed] Database seeding completed successfully! ✨');
};

// Execute directly if run as a script
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}
