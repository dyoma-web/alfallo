import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon, type IconName } from '../components/Icon';
import { CalendarView, type CalendarBooking } from '../components/calendar/CalendarView';
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

interface BookingForCal extends CalendarBooking {
  user_id: string;
  entrenador_id: string;
  sede_id: string;
}

export default function AdminDashboard() {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const { data, error, loading } = useApiQuery<AdminDashboardData>('getAdminDashboard');

  const [calFilterTrainer, setCalFilterTrainer] = useState('');
  const [calFilterSede, setCalFilterSede] = useState('');
  const [calFilterUser, setCalFilterUser] = useState('');

  const { data: bookings } = useApiQuery<BookingForCal[]>(
    'listMyBookings',
    {
      filterTrainerId: calFilterTrainer || undefined,
      filterSedeId: calFilterSede || undefined,
      filterUserId: calFilterUser || undefined,
    },
    { deps: [calFilterTrainer, calFilterSede, calFilterUser] }
  );

  const { data: trainers } = useApiQuery<Array<{ id: string; nombres: string; apellidos: string }>>(
    'adminListTrainers'
  );
  const { data: sedes } = useApiQuery<Array<{ id: string; nombre: string; ciudad?: string }>>(
    'adminListSedes'
  );
  const { data: users } = useApiQuery<Array<{ id: string; nombres: string; apellidos: string }>>(
    'adminListUsers',
    { rol: 'client' }
  );

  const calBookings = useMemo(() => bookings ?? [], [bookings]);
  const labelMode = calFilterUser ? 'tipo' : calFilterTrainer ? 'cliente' : 'auto';

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

            {/* Calendario global */}
            <Section
              title="Calendario global"
              action={{ to: '/calendario', label: 'Ver pantalla completa' }}
            >
              <Card padding={14}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <select
                    value={calFilterTrainer}
                    onChange={(e) => setCalFilterTrainer(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-surface-2 border border-line-2 text-fg text-[13px] focus:outline-none focus:border-accent/60"
                  >
                    <option value="">Todos los entrenadores</option>
                    {trainers?.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>
                    ))}
                  </select>
                  <select
                    value={calFilterSede}
                    onChange={(e) => setCalFilterSede(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-surface-2 border border-line-2 text-fg text-[13px] focus:outline-none focus:border-accent/60"
                  >
                    <option value="">Todas las sedes</option>
                    {sedes?.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <select
                    value={calFilterUser}
                    onChange={(e) => setCalFilterUser(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-surface-2 border border-line-2 text-fg text-[13px] focus:outline-none focus:border-accent/60"
                  >
                    <option value="">Todos los clientes</option>
                    {users?.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                    ))}
                  </select>
                </div>

                {calBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="cal" size={28} color="#6B746A" className="mx-auto mb-2" />
                    <p className="text-fg-2 text-sm">Sin agendamientos en el rango.</p>
                  </div>
                ) : (
                  <CalendarView
                    bookings={calBookings}
                    defaultView="timeGridWeek"
                    showLabel={labelMode}
                    height={520}
                    onBookingClick={() => navigate('/calendario')}
                  />
                )}
              </Card>
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
