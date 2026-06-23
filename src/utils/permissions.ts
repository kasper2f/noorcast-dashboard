import type { Department, Role } from './employee';

export const DEPARTMENT_ROUTES: Record<Department, string[]> = {
  finance: ['/finance'],
  operations: ['/operations'],
  hr: ['/hr'],
};

export const SHARED_ROUTES = ['/', '/assistant'];

export function canAccessRoute(
  department: Department,
  role: Role,
  path: string
): boolean {
  if (role === 'admin') return true;

  if (SHARED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))) {
    return true;
  }

  const allowedPrefixes = DEPARTMENT_ROUTES[department] ?? [];
  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function getDepartmentNavItems(department: Department, role: Role) {
  const items = [
    { path: '/', label: 'dashboard' as const },
    { path: '/assistant', label: 'assistant' as const },
  ];

  if (role === 'admin' || department === 'finance') {
    items.splice(1, 0, {
      path: '/finance',
      label: 'finance' as const,
    });
  }

  if (role === 'admin' || department === 'operations') {
    items.splice(role === 'admin' ? 2 : 1, 0, {
      path: '/operations',
      label: 'operations' as const,
    });
  }

  if (role === 'admin' || department === 'hr') {
    items.splice(items.length - 1, 0, {
      path: '/hr',
      label: 'hr' as const,
    });
  }

  return items;
}
