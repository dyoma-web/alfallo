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

// Admin
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminUsers = lazyWithRetry(() => import('./pages/AdminUsers'));
const AdminSedes = lazyWithRetry(() => import('./pages/AdminSedes'));
const AdminPlanes = lazyWithRetry(() => import('./pages/AdminPlanes'));

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
  if (role === 'admin' || role === 'super_admin') return <AdminDashboard />;
  if (role === 'trainer') return <TrainerDashboard />;
  return <UserDashboard />;
}

/** Calendario switch — cliente ve sus bookings, trainer/admin ve los suyos con acciones. */
function CalendarSwitch() {
  const role = useSession((s) => s.role);
  if (role === 'trainer' || role === 'admin' || role === 'super_admin') {
    return <TrainerCalendar />;
  }
  return <UserCalendar />;
}

/** Usuarios switch — admin ve todos, trainer ve los suyos. */
function UsersSwitch() {
  const role = useSession((s) => s.role);
  if (role === 'admin' || role === 'super_admin') return <AdminUsers />;
  return <TrainerUsers />;
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

          {/* Trainer + Admin */}
          <Route
            path="/usuarios"
            element={
              <RequireAuth>
                <RequireRole roles={['trainer', 'admin', 'super_admin']}>
                  <UsersSwitch />
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

          {/* Solo Admin */}
          <Route
            path="/sedes"
            element={
              <RequireAuth>
                <RequireRole roles={['admin', 'super_admin']}>
                  <AdminSedes />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/planes"
            element={
              <RequireAuth>
                <RequireRole roles={['admin', 'super_admin']}>
                  <AdminPlanes />
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
