import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/store/session';
import { RequireAuth } from './components/auth/RequireAuth';
import { Logo } from './components/Logo';

// Lazy-loaded pages — splits the initial bundle by route
const Login = lazy(() => import('./pages/Login'));
const ActivateAccount = lazy(() => import('./pages/ActivateAccount'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Logout = lazy(() => import('./pages/Logout'));
const DashboardPlaceholder = lazy(() => import('./pages/DashboardPlaceholder'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const PoliticaDatos = lazy(() => import('./pages/PoliticaDatos'));
const Terminos = lazy(() => import('./pages/Terminos'));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="opacity-60 animate-pulse">
        <Logo size={28} />
      </div>
    </div>
  );
}

function RootRedirect() {
  const isAuth = useSession((s) => s.isAuthenticated());
  return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
}

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<ActivateAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="/politica-datos" element={<PoliticaDatos />} />
          <Route path="/terminos" element={<Terminos />} />

          {/* Protegidas */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPlaceholder />
              </RequireAuth>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
