import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ProtectedRoute() {
  const { user, employee, loading } = useAuth();
  const { canAccessCurrentRoute } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!employee) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!canAccessCurrentRoute) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
