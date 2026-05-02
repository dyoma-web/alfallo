import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../lib/store/session';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Guard de rutas autenticadas. Si no hay sesión activa, redirige a /login
 * preservando la ruta de origen para volver tras el login.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useSession((s) => s.isAuthenticated());
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
