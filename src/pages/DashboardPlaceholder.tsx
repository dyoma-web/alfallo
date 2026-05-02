import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { StatusBadge } from '../components/StatusBadge';
import { Icon } from '../components/Icon';
import { useSession } from '../lib/store/session';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  trainer: 'Entrenador',
  client: 'Cliente',
};

export default function DashboardPlaceholder() {
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <Link to="/dashboard" aria-label="Dashboard">
            <Logo size={24} />
          </Link>
          <div className="flex items-center gap-3">
            {role && (
              <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
                {ROLE_LABEL[role] ?? role}
              </span>
            )}
            <Link to="/logout">
              <Btn variant="ghost" size="sm">Salir</Btn>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[-0.03em] leading-tight">
            Bienvenido, {user?.nombres ?? 'tú'}.
          </h1>
          <p className="text-fg-2 mt-2 leading-relaxed">
            Has iniciado sesión correctamente. Esta es una pantalla provisional —
            las features funcionales llegan en las próximas iteraciones.
          </p>
        </div>

        <Card>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">
            Tu sesión
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Info label="Nombre" value={`${user?.nombres ?? ''} ${user?.apellidos ?? ''}`.trim()} />
            <Info label="Correo" value={user?.email} />
            <Info label="Nick" value={user?.nick} />
            <Info label="Rol" value={role ? ROLE_LABEL[role] ?? role : ''} />
          </dl>
        </Card>

        <Card className="mt-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">
            Próximamente
          </div>
          <ul className="space-y-3 text-sm text-fg-2">
            <li className="flex items-center gap-3">
              <StatusBadge kind="pendiente" label="Iter 5" />
              <span>Dashboard de usuario · Agendamiento · Calendario · Alertas</span>
            </li>
            <li className="flex items-center gap-3">
              <StatusBadge kind="pendiente" label="Iter 6" />
              <span>Núcleo del entrenador: rutinas, grupos, asistencia, mensajes</span>
            </li>
            <li className="flex items-center gap-3">
              <StatusBadge kind="pendiente" label="Iter 7" />
              <span>Núcleo del admin: sedes, usuarios, planes, reportes</span>
            </li>
            <li className="flex items-center gap-3">
              <StatusBadge kind="pendiente" label="Iter 8" />
              <span>Backups, polish, deploy final</span>
            </li>
          </ul>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-[12px] text-fg-3 flex items-center justify-center gap-1.5">
            <Icon name="shield" size={12} />
            Sesión protegida · Token persistido en localStorage
          </p>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-fg-3 text-[11px] font-mono uppercase tracking-[0.12em]">{label}</dt>
      <dd className="text-fg mt-0.5">{value || '—'}</dd>
    </div>
  );
}
