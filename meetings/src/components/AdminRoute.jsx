import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard that requires a specific role (or admin).
 * Falls back to dashboard with a toast if the user lacks permission.
 *
 * Usage:
 *   <AdminRoute role="ADMIN"><UserManagement /></AdminRoute>
 *   <AdminRoute>          ← admin-only by default
 */
export default function AdminRoute({ children, role = 'ADMIN' }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin can access everything; otherwise check exact role match
  const hasAccess = user?.role === 'ADMIN' || user?.role === role;

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
