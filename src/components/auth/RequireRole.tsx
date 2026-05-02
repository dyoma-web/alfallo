import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession, type Role } from '../../lib/store/session';

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

/**
 * Guard por rol. Asume que ya pasó RequireAuth (usar en composición).
 * Si el rol del usuario no está en la lista, redirige a /forbidden.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const role = useSession((s) => s.role);

  if (!role || !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
