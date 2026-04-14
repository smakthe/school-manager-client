import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../types/api';

export function PrivateRoute({ role }: { role: Role }) {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    // If they have a token but wrong role, push them to their proper dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
