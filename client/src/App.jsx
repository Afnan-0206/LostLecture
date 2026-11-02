import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import Dashboard from './pages/Dashboard';
import SubjectLibrary from './pages/SubjectLibrary';
import SubjectDetails from './pages/SubjectDetails';
import ResourceLibrary from './pages/ResourceLibrary';
import ResourceDetails from './pages/ResourceDetails';
import UploadResource from './pages/UploadResource';
import MyBookmarks from './pages/MyBookmarks';
import MyContributions from './pages/MyContributions';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';
import StudyCollections from './pages/StudyCollections';
import Leaderboard from './pages/Leaderboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingApprovals from './pages/admin/PendingApprovals';
import ManageResources from './pages/admin/ManageResources';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageReports from './pages/admin/ManageReports';
import ManageUsers from './pages/admin/ManageUsers';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<SubjectLibrary />} />
            <Route path="/subjects/:id" element={<SubjectDetails />} />
            <Route path="/resources" element={<ResourceLibrary />} />
            <Route path="/resources/:id" element={<ResourceDetails />} />
            <Route path="/collections" element={<StudyCollections />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/upload" element={<UploadResource />} />
            <Route path="/bookmarks" element={<MyBookmarks />} />
            <Route path="/my-contributions" element={<MyContributions />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Restricted Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PendingApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ManageResources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ManageSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ManageReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
