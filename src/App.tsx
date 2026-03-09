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

      {/* TODO [FE-23] ELENA KALAJDŽIĆ — Error stranice (404, 500, 403)
          ZADATAK: Napraviti error stranice u src/pages/Error/ folderu:
            1. NotFoundPage.tsx (404) — "Stranica nije pronađena"
            2. ForbiddenPage.tsx (403) — "Nemate dozvolu za pristup"
            3. ServerErrorPage.tsx (500) — "Greška servera"
            4. GenericErrorPage.tsx — "Nešto je pošlo naopako"
          Svaka stranica treba da ima:
            - Veliku cifru (404/403/500), poruku, predloge korisniku
            - Dugmad: "Nazad na početnu" → / i sl.
            - Profesionalan dizajn (pogledaj LoginPage.tsx za primer gradient pozadine)
            - Dark/light tema podršku, responsive dizajn
          Ikone: AlertTriangle, ShieldX, ServerCrash, FileQuestion (iz lucide-react)
          Koristi AI Agent Mode za pomoć!
          PROMENA ISPOD: Zameni Navigate sa <NotFoundPage /> nakon kreiranja.
          + Napiši E2E test da nepostojeći URL prikazuje 404 i dugme radi.
      */}
      {/* Catch-all — ELENA: zameni Navigate ispod sa <NotFoundPage /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
