import { Link } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon, type IconName } from '../components/Icon';
import { useApiQuery } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';
import { greeting } from '../lib/datetime';

interface AdminDashboardData {
  usuarios: {
    total: number;
    activos: number;
    pendientes: number;
    clients: number;
    trainers: number;
  };
  sedes: { total: number; activas: number };
  planes: { activos: number; porVencer: number; vencidos: number };
  sesionesSemana: {
    total: number;
    completadas: number;
    canceladas: number;
    noAsistidas: number;
  };
}

export default function AdminDashboard() {
  const user = useSession((s) => s.user);
  const { data, error, loading } = useApiQuery<AdminDashboardData>('getAdminDashboard');

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            {greeting()}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Hola {user?.nombres ?? 'admin'}, vamos al control.
          </h1>
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface border border-line rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && (
          <>
            {/* Sección: Personas */}
            <Section title="Personas" action={{ to: '/usuarios', label: 'Gestionar' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile icon="user" label="Clientes activos" value={data.usuarios.clients} />
                <KpiTile icon="bolt" label="Entrenadores activos" value={data.usuarios.trainers} />
                <KpiTile
                  icon="bell"
                  label="Pendientes activación"
                  value={data.usuarios.pendientes}
                  tone={data.usuarios.pendientes > 0 ? 'warn' : undefined}
                />
                <KpiTile icon="group" label="Total usuarios" value={data.usuarios.total} />
              </div>
            </Section>

            {/* Sección: Operación */}
            <Section title="Operación">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiTile
                  icon="building"
                  label="Sedes activas"
                  value={data.sedes.activas}
                  sub={`de ${data.sedes.total} total`}
                />
                <KpiTile
                  icon="shield"
                  label="Planes activos"
                  value={data.planes.activos}
                />
                <KpiTile
                  icon="clock"
                  label="Por vencer"
                  value={data.planes.porVencer}
                  tone={data.planes.porVencer > 0 ? 'warn' : undefined}
                  sub="≤7 días"
                />
              </div>
            </Section>

            {/* Sección: Esta semana */}
            <Section title="Sesiones · últimos 7 días">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiTile icon="cal" label="Total" value={data.sesionesSemana.total} />
                <KpiTile
                  icon="check"
                  label="Completadas"
                  value={data.sesionesSemana.completadas}
                />
                <KpiTile
                  icon="x"
                  label="Canceladas"
                  value={data.sesionesSemana.canceladas}
                  tone={data.sesionesSemana.canceladas > 5 ? 'warn' : undefined}
                />
                <KpiTile
                  icon="x"
                  label="No asistidas"
                  value={data.sesionesSemana.noAsistidas}
                  tone={data.sesionesSemana.noAsistidas > 0 ? 'warn' : undefined}
                />
              </div>
            </Section>

            {/* Acciones rápidas */}
            <Section title="Acciones rápidas">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionCard
                  to="/usuarios?nuevo=1"
                  icon="plus"
                  title="Crear usuario"
                  subtitle="Cliente, entrenador o admin"
                />
                <ActionCard
                  to="/sedes?nuevo=1"
                  icon="building"
                  title="Crear sede"
                  subtitle="Nueva ubicación"
                />
                <ActionCard
                  to="/planes?nuevo=1"
                  icon="shield"
                  title="Crear plan"
                  subtitle="Plantilla en catálogo"
                />
              </div>
            </Section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
          {title}
        </h2>
        {action && (
          <Link
            to={action.to}
            className="text-[12px] text-fg-2 hover:text-fg underline-offset-2 hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiTile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: IconName;
  label: string;
  value: number;
  sub?: string;
  tone?: 'warn' | 'err';
}) {
  const color = tone === 'err' ? '#FF8E8E' : tone === 'warn' ? '#FFB02E' : '#A8B0A4';
  return (
    <Card padding={14}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icon} size={13} color={color} strokeWidth={2} />
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3 truncate">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl md:text-3xl font-bold tracking-[-0.03em] leading-none">
        {value}
      </div>
      {sub && <div className="text-fg-3 text-[11px] mt-1">{sub}</div>}
    </Card>
  );
}

function ActionCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="group">
      <Card padding={18} className="hover:border-accent/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-none">
            <Icon name={icon} size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-fg-3 text-[12px] mt-0.5">{subtitle}</div>
          </div>
          <Icon name="arrow" size={14} color="#6B746A" />
        </div>
      </Card>
    </Link>
  );
}
