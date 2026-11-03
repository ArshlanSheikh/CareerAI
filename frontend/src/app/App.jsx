import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AppLayout from '../layouts/AppLayout/AppLayout';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import ProtectedRoute from '../components/common/ProtectedRoute/ProtectedRoute';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import ProfilePage from '../modules/profile/pages/ProfilePage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import ResumeEditorPage from '../modules/resume/pages/ResumeEditorPage';
import ResumePreviewPage from '../modules/resume/pages/ResumePreviewPage';
import ResumeImportPage from '../modules/resume/pages/ResumeImportPage';
import AnalysisDashboardPage from '../modules/analysis/pages/AnalysisDashboardPage';
import ResumeComparePage from '../modules/enhancement/pages/ResumeComparePage';
import Card from '../components/common/Card/Card';
import Button from '../components/common/Button/Button';
import { Link } from 'react-router-dom';

function AuthenticatedAppWrapper() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Protected App Routes */}
      <Route element={<ProtectedRoute><AppLayout user={user} onLogout={logout} /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resumes/create" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/resumes/:id/edit" element={<ResumeEditorPage />} />
        <Route path="/resumes/:id/preview" element={<ResumePreviewPage />} />
        <Route path="/resumes/:id/analysis" element={<AnalysisDashboardPage />} />
        <Route path="/resumes/:id/enhance" element={<ResumeComparePage />} />
        <Route path="/resumes/import" element={<ResumeImportPage />} />
      </Route>

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Redirect root to dashboard if logged in, else to login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <AuthenticatedAppWrapper />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
