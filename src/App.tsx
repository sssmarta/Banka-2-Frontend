import { Routes, Route } from 'react-router-dom';

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
import NotFoundPage from './pages/Error/NotFoundPage';
import ForbiddenPage from './pages/Error/ForbiddenPage';
import ServerErrorPage from './pages/Error/ServerErrorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees" element={<EmployeeListPage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees/new" element={<EmployeeCreatePage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/employees/:id" element={<EmployeeEditPage />} />
          </Route>

          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}