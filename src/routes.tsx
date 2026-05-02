import { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/store/session';
import { lazyWithRetry } from './lib/lazy';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireRole } from './components/auth/RequireRole';
import { Logo } from './components/Logo';

// Lazy-loaded pages — splits the initial bundle por route.
const Login = lazyWithRetry(() => import('./pages/Login'));
const ActivateAccount = lazyWithRetry(() => import('./pages/ActivateAccount'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const Logout = lazyWithRetry(() => import('./pages/Logout'));

// Cliente
const UserDashboard = lazyWithRetry(() => import('./pages/UserDashboard'));
const MyPlan = lazyWithRetry(() => import('./pages/MyPlan'));
const Alerts = lazyWithRetry(() => import('./pages/Alerts'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const UserCalendar = lazyWithRetry(() => import('./pages/UserCalendar'));
const Booking = lazyWithRetry(() => import('./pages/Booking'));

// Trainer
const TrainerDashboard = lazyWithRetry(() => import('./pages/TrainerDashboard'));
const TrainerCalendar = lazyWithRetry(() => import('./pages/TrainerCalendar'));
const TrainerUsers = lazyWithRetry(() => import('./pages/TrainerUsers'));
const UserDetailForTrainer = lazyWithRetry(() => import('./pages/UserDetailForTrainer'));

// Otras
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

/** Dashboard switch por rol — cada rol tiene su pantalla. */
function DashboardSwitch() {
  const role = useSession((s) => s.role);
  if (role === 'trainer' || role === 'admin' || role === 'super_admin') {
    return <TrainerDashboard />;
  }
  return <UserDashboard />;
}

/** Calendario switch — cliente ve sus bookings, trainer ve los suyos con acciones. */
function CalendarSwitch() {
  const role = useSession((s) => s.role);
  if (role === 'trainer' || role === 'admin' || role === 'super_admin') {
    return <TrainerCalendar />;
  }
  return <UserCalendar />;
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

          {/* Protegidas — switch por rol */}
          <Route
            path="/dashboard"
            element={<RequireAuth><DashboardSwitch /></RequireAuth>}
          />
          <Route
            path="/calendario"
            element={<RequireAuth><CalendarSwitch /></RequireAuth>}
          />
          <Route
            path="/alertas"
            element={<RequireAuth><Alerts /></RequireAuth>}
          />
          <Route
            path="/perfil"
            element={<RequireAuth><Profile /></RequireAuth>}
          />

          {/* Solo cliente */}
          <Route
            path="/mi-plan"
            element={
              <RequireAuth>
                <RequireRole roles={['client']}><MyPlan /></RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/agendar"
            element={
              <RequireAuth>
                <RequireRole roles={['client']}><Booking /></RequireRole>
              </RequireAuth>
            }
          />

          {/* Solo trainer/admin */}
          <Route
            path="/usuarios"
            element={
              <RequireAuth>
                <RequireRole roles={['trainer', 'admin', 'super_admin']}>
                  <TrainerUsers />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/usuarios/:id"
            element={
              <RequireAuth>
                <RequireRole roles={['trainer', 'admin', 'super_admin']}>
                  <UserDetailForTrainer />
                </RequireRole>
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
