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
  { to: '/planes', icon: 'shield', label: 'Planes' },
  { to: '/perfil', icon: 'user', label: 'Perfil' },
];

const NAV_TRAINER: NavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Hoy' },
  { to: '/calendario', icon: 'cal', label: 'Calendario' },
  { to: '/usuarios', icon: 'group', label: 'Usuarios' },
  { to: '/planes', icon: 'shield', label: 'Planes' },
  { to: '/alertas', icon: 'bell', label: 'Alertas' },
];

const NAV_ADMIN: NavItem[] = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/usuarios', icon: 'group', label: 'Usuarios' },
  { to: '/calendario', icon: 'cal', label: 'Calendario' },
  { to: '/alertas', icon: 'bell', label: 'Alertas' },
  { to: '/perfil', icon: 'user', label: 'Más' },
];

interface AppShellMobileProps {
  children: ReactNode;
}

export function AppShellMobile({ children }: AppShellMobileProps) {
  const role = useSession((s) => s.role);
  const items =
    role === 'admin' || role === 'super_admin'
      ? NAV_ADMIN
      : role === 'trainer'
      ? NAV_TRAINER
      : NAV_CLIENT;

  return (
    <div className="min-h-screen bg-ink text-fg flex flex-col">
      <header className="px-5 py-3 border-b border-line flex items-center justify-between">
        <Link to="/dashboard" aria-label="Inicio">
          <Logo size={22} />
        </Link>
        <Link
          to="/alertas"
          className="w-9 h-9 rounded-full bg-surface-2 border border-line-2 flex items-center justify-center"
          aria-label="Alertas"
        >
          <Icon name="bell" size={16} color="currentColor" />
        </Link>
      </header>

      <main className="flex-1 pb-24 overflow-x-hidden">{children}</main>

      <BottomNav items={items} />
    </div>
  );
}

function BottomNav({ items }: { items: NavItem[] }) {
  const location = useLocation();
  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-30 bg-ink/90 backdrop-blur border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={[
                  'flex flex-col items-center gap-1 py-2.5 transition-colors',
                  active ? 'text-accent' : 'text-fg-3 hover:text-fg-2',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon} size={20} strokeWidth={active ? 2 : 1.6} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
