# lostLecture

> **Never lose track of a lecture again.**
> A centralized, subject-wise academic resource management platform built with the MERN stack.

---

## 📚 Overview

Students frequently struggle to locate lecture slides, PDFs, notes, assignments, reference links, and learning materials shared across different WhatsApp groups, classroom discussions, and temporary channels.

**lostLecture** solves this problem by providing one organized platform where students can discover, upload, bookmark, search, and report academic resources.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM v7, Axios, Lucide React, React Hot Toast
- **Backend**: Node.js, Express.js (REST API, JWT Auth, Bcrypt, Zod, Helmet, Express Rate Limit, Morgan, Multer, Cloudinary)
- **Database**: MongoDB (Mongoose ODM, compound indexing, schema validation, Atlas & memory server support)
- **File & Link Storage**: Cloudinary (documents & PDFs) & Google Drive / External URLs with local static upload fallback

---

## 🚀 Execution Phases & Status

- [x] **PHASE 1**: Project Setup, Folder Architecture & Tooling Configuration
- [x] **PHASE 2**: React Frontend Foundation, Layouts & Routing Structure
- [x] **PHASE 3**: Express Backend Architecture, Config & MongoDB Connection
- [x] **PHASE 4**: Authentication, JWT Persistence & Role Authorization
- [x] **PHASE 5**: Subject Management & Resource Library Modules
- [x] **PHASE 6**: Resource Upload & Cloudinary/Local File Storage
- [x] **PHASE 7**: Server-Side Search, Complex Filters & Pagination
- [x] **PHASE 8**: Bookmark System & Resource Reporting Pipeline
- [x] **PHASE 9**: Admin Moderation Dashboard & Management Workflows
- [x] **PHASE 10**: Testing, Verification & Production Deployment Build
- [x] **PERFECTION SUITE**:
  - 📄 **In-App Document Viewer**: Native PDF and external resource previewer with zoom & fullscreen controls.
  - 🤖 **AI Study Assistant**: Real-time structured summaries, key takeaways, exam preparation tips, and interactive practice quizzes powered by Gemini API.
  - 💬 **Discussion & Doubt Board**: Per-resource threaded question and peer answer forum.
  - 🔺 **Helpfulness Upvoting**: Peer voting system highlighting high-yield study materials.
  - 📦 **Exam Survival Packs**: Curated, syllabus-aligned resource bundles for midterms and finals.
  - 🏆 **Contributor Leaderboard**: Department scholar rankings, contribution points, and Academic MVP badges.
  - 🎯 **Syllabus Unit (1-6) & Exam PYQ Tagging**: Granular filtering for previous year exam questions and course modules.
  - ✨ **Interactive Hover Buttons**: Physics-based interactive hover buttons with expanding micro-dot animations and direction-aware slide indicators across all primary workflows.
  - 🔍 **Universal Spotlight Command Palette (`Ctrl+K` / `Cmd+K`)**: Instant keyboard navigation jumping directly to any course code, semester subjects, PYQs, and actions.
  - 👁️ **Instant Document Quick-Peek**: In-modal PDF and lecture slide previewing directly from the search grid without leaving the page.
  - 📝 **Academic Citation Generator**: Instant APA, IEEE, and BibTeX formatted citation generation for semester project references and lab reports.
  - 🔥 **Exam Readiness & Study Streak Planner**: Gamified curriculum alignment tracker with exam countdown shortcuts on the student dashboard.
  - ⚡ **Batch Moderation Workflow**: Single-click bulk review and approval capabilities for departmental administrators.

---

## 🔑 Demo Access Accounts

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@lostlecture.edu` | `AdminPassword123!` |
| **Student** | `student@lostlecture.edu` | `StudentPassword123!` |

*(The login screen also features 1-click demo credential fill buttons for fast testing)*

---

## 📂 Project Structure

```
LostLecture/
├── client/                 # React 19 + Vite + Tailwind v4 Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     # ProtectedRoute, LoadingSkeleton, EmptyState, ErrorState, Pagination, ConfirmationDialog
│   │   │   ├── filters/    # SearchBar (debounced), FilterPanel
│   │   │   ├── navigation/ # Navbar, Sidebar (desktop + mobile drawer)
│   │   │   ├── resources/  # ResourceCard, BookmarkButton, ReportDialog
│   │   │   ├── subjects/   # SubjectCard
│   │   │   └── upload/     # UploadDropzone (drag-and-drop & link modes)
│   │   ├── context/        # AuthContext (state, tokens, session rehydration)
│   │   ├── layouts/        # MainLayout, AuthLayout
│   │   ├── pages/          # Login, Register, Dashboard, SubjectLibrary, SubjectDetails, ResourceLibrary, ResourceDetails, UploadResource, MyBookmarks, MyContributions, MyReports, Profile
│   │   │   └── admin/      # AdminDashboard, PendingApprovals, ManageResources, ManageSubjects, ManageReports, ManageUsers
│   │   ├── services/       # Axios API client with JWT interceptor & auto-logout
│   │   ├── App.jsx         # App router & Toaster provider
│   │   └── index.css       # Academic palette styling
│   └── vite.config.js      # Vite configuration & /api proxy to backend
│
├── server/                 # Express REST API Backend
│   ├── config/             # db.js (MongoDB Atlas + In-Memory fallback), cloudinary.js
│   ├── controllers/        # auth, user, subject, resource, bookmark, report, admin
│   ├── middleware/         # authMiddleware, adminMiddleware, validateMiddleware, uploadMiddleware, errorMiddleware
│   ├── models/             # User, Subject, Resource, Bookmark, Report
│   ├── routes/             # auth, user, subject, resource, bookmark, report, admin
│   ├── scripts/            # seed.js (controlled realistic academic data)
│   ├── tests/              # integration.test.js (full 20-point test suite)
│   ├── utils/              # ApiError, ApiResponse, asyncHandler, generateToken
│   ├── validators/         # authValidator, subjectValidator, resourceValidator (Zod)
│   ├── server.js           # Server entrypoint with Helmet, CORS, RateLimit
│   └── package.json
│
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Monorepo management scripts
└── README.md               # Project documentation
```

---

## ⚙️ Running Locally

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Quick Setup & Seed
```bash
# Clone the repository
git clone <repo-url>
cd LostLecture

# Install dependencies
npm --prefix server install
npm --prefix client install

# Seed database with sample curriculum (optional - server auto-seeds on first launch if empty)
cd server && node scripts/seed.js && cd ..
```

### 3. Run Development Servers
In two separate terminals or with concurrently:
```bash
# Terminal 1: Start Express API Backend (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Start Vite React Frontend (runs on http://localhost:5173)
cd client
npm run dev
```

### 4. Run Automated Test Suite
```bash
cd server
node tests/integration.test.js
```
All 25 integration tests will execute against live endpoints and verify complete end-to-end functionality including authentication, moderation, search, voting, comments, AI assistant, and leaderboard rankings.
# LostLecture
