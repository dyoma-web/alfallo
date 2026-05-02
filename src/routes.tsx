import { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/store/session';
import { lazyWithRetry } from './lib/lazy';
import { RequireAuth } from './components/auth/RequireAuth';
import { Logo } from './components/Logo';

// Lazy-loaded pages — splits the initial bundle por route.
// lazyWithRetry recarga la página si un chunk quedó obsoleto tras un deploy.
const Login = lazyWithRetry(() => import('./pages/Login'));
const ActivateAccount = lazyWithRetry(() => import('./pages/ActivateAccount'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const Logout = lazyWithRetry(() => import('./pages/Logout'));
const DashboardPlaceholder = lazyWithRetry(() => import('./pages/DashboardPlaceholder'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Forbidden = lazyWithRetry(() => import('./pages/Forbidden'));
const PoliticaDatos = lazyWithRetry(() => import('./pages/PoliticaDatos'));
const Terminos = lazyWithRetry(() => import('./pages/Terminos'));

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
