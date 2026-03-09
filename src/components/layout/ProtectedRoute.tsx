import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Permission } from '../../types';

interface ProtectedRouteProps {
  requiredPermission?: Permission;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  requiredPermission,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, hasPermission, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/403" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}