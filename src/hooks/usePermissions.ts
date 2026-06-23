import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute, getDepartmentNavItems } from '@/utils/permissions';

export function usePermissions() {
  const { employee } = useAuth();
  const location = useLocation();

  const canAccessCurrentRoute = useMemo(() => {
    if (!employee) return false;
    return canAccessRoute(employee.department, employee.role, location.pathname);
  }, [employee, location.pathname]);

  const navItems = useMemo(() => {
    if (!employee) return [];
    return getDepartmentNavItems(employee.department, employee.role);
  }, [employee]);

  return { canAccessCurrentRoute, navItems, employee };
}
