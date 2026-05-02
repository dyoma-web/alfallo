import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../Logo';
import { Icon, type IconName } from '../Icon';
import { useSession } from '../../lib/store/session';

interface NavItem {
  to: string;
  icon: IconName;
  label: string;
}

const NAV_CLIENT: NavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/agendar', icon: 'plus', label: 'Agendar' },
  { to: '/calendario', icon: 'cal', label: 'Calendario' },
  { to: '/alertas', icon: 'bell', label: 'Alertas' },
  { to: '/mi-plan', icon: 'shield', label: 'Mi plan' },
  { to: '/perfil', icon: 'user', label: 'Perfil' },
];

const NAV_TRAINER: NavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Hoy' },
  { to: '/calendario', icon: 'cal', label: 'Calendario' },
  { to: '/usuarios', icon: 'group', label: 'Mis usuarios' },
  { to: '/solicitudes', icon: 'msg', label: 'Solicitudes' },
  { to: '/alertas', icon: 'bell', label: 'Alertas' },
  { to: '/perfil', icon: 'user', label: 'Perfil' },
];

const NAV_ADMIN: NavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/calendario', icon: 'cal', label: 'Calendario' },
  { to: '/usuarios', icon: 'group', label: 'Usuarios' },
  { to: '/gimnasios', icon: 'building', label: 'Gimnasios' },
  { to: '/sedes', icon: 'mapPin', label: 'Sedes' },
  { to: '/planes', icon: 'shield', label: 'Planes' },
  { to: '/solicitudes', icon: 'msg', label: 'Solicitudes' },
  { to: '/alertas', icon: 'bell', label: 'Alertas' },
  { to: '/perfil', icon: 'user', label: 'Perfil' },
];

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  trainer: 'Entrenador',
  client: 'Cliente',
};

interface AppShellDesktopProps {
  children: ReactNode;
}

export function AppShellDesktop({ children }: AppShellDesktopProps) {
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const items =
    role === 'admin' || role === 'super_admin'
      ? NAV_ADMIN
      : role === 'trainer'
      ? NAV_TRAINER
      : NAV_CLIENT;

  return (
    <div className="min-h-screen bg-ink text-fg flex">
      <aside className="w-64 border-r border-line flex flex-col flex-none sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-line">
          <Link to="/dashboard" aria-label="Inicio">
            <Logo size={24} />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </ul>
        </nav>

        <div className="px-3 py-3 border-t border-line">
          <div className="px-3 py-2.5 rounded-xl bg-surface-2 border border-line">
            <div className="text-sm font-medium truncate">
              {user?.nombres} {user?.apellidos}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mt-0.5">
              {role ? ROLE_LABEL[role] ?? role : ''}
            </div>
          </div>
          <Link
            to="/logout"
            className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-fg-3 hover:text-fg hover:bg-surface rounded-xl transition-colors"
          >
            <Icon name="x" size={14} />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const active =
    location.pathname === item.to ||
    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

  return (
    <li>
      <Link
        to={item.to}
        aria-current={active ? 'page' : undefined}
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
          active
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'text-fg-2 hover:bg-surface hover:text-fg border border-transparent',
        ].join(' ')}
      >
        <Icon name={item.icon} size={18} strokeWidth={active ? 2 : 1.6} />
        <span className="font-medium">{item.label}</span>
      </Link>
    </li>
  );
}
