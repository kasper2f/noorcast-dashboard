import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ProtectedRoute() {
  const { user, employee, adminData, loading } = useAuthContext();
  const { canAccessCurrentRoute } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner />
      </div>
    );
  }

  // السماح بالمرور إذا كان المشرف مسجلاً عبر قوقل شيت (adminData) أو عبر فايربيس
  const isAuthenticated = user || adminData;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // إذا كان مشرف قوقل شيت، نسمح له بالمرور مباشرة دون الحاجة لشروط الـ employee أو الصلاحيات المعقدة
  if (!adminData) {
    if (!employee) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (!canAccessCurrentRoute) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}