import { UserRole } from '@shared-types';

const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  [UserRole.CLIENT]: '/client/dashboard',
  [UserRole.PROFESSIONAL]: '/professional/dashboard',
  [UserRole.ADMIN]: '/admin/dashboard',
};

export const getDashboardPathForRole = (role?: UserRole | null): string => {
  if (!role) {
    return '/';
  }

  return ROLE_DASHBOARD_PATHS[role] ?? '/';
};

export const getPostAuthRedirectPath = (params: {
  role?: UserRole | null;
  nextPath?: string | null;
}): string => {
  const nextPath = params.nextPath?.trim();

  if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return nextPath;
  }

  return getDashboardPathForRole(params.role);
};
