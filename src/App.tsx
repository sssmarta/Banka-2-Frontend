import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import LandingPage from './pages/Landing/LandingPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage';
import ActivateAccountPage from './pages/ActivateAccount/ActivateAccountPage';
import EmployeeListPage from './pages/Admin/EmployeeListPage';
import EmployeeCreatePage from './pages/Admin/EmployeeCreatePage';
import EmployeeEditPage from './pages/Admin/EmployeeEditPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Employee management – requires ADMIN */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees" element={<EmployeeListPage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees/new" element={<EmployeeCreatePage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees/:id" element={<EmployeeEditPage />} />
          </Route>

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
