import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { CalendarView, type CalendarBooking } from '../components/calendar/CalendarView';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useSession } from '../lib/store/session';
import { formatDate, formatTime, formatRelative, greeting } from '../lib/datetime';

interface SesionHoy {
  id: string;
  fechaInicioUtc: string;
  duracionMin: number;
  tipo: string;
  estado: string;
  cliente: { id: string; nombres: string; apellidos: string; nick?: string } | null;
}

interface SolicitudPendiente {
  id: string;
  fechaInicioUtc: string;
  duracionMin: number;
  estado: string;
  requiereAutorizacion: boolean;
  cliente: { id: string; nombres: string; apellidos: string; nick?: string } | null;
}

interface PlanPorVencer {
  id: string;
  fechaVencimientoUtc: string;
  diasRestantes: number;
  sesionesRestantes: number;
  cliente: { id: string; nombres: string; apellidos: string; nick?: string } | null;
}

interface DashboardData {
  hoyKpi: {
    sesionesHoy: number;
    solicitudesPendientes: number;
    completadasSemana: number;
    usuariosActivos: number;
  };
  sesionesHoy: SesionHoy[];
  solicitudesPendientes: SolicitudPendiente[];
  planesPorVencer: PlanPorVencer[];
}

const STATE_TO_BADGE: Record<string, StatusKind> = {
  solicitado: 'pendiente',
  confirmado: 'confirmado',
  pactado: 'pactado',
  completado: 'completado',
  'no-asistido': 'no-asistido',
  rechazado: 'rechazado',
  requiere_autorizacion: 'autorizacion',
};

export default function TrainerDashboard() {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const { data, error, loading, refetch } = useApiQuery<DashboardData>('getTrainerDashboard');
  const { data: weekBookings } = useApiQuery<CalendarBooking[]>('listMyBookings');

  const calBookings = useMemo(() => weekBookings ?? [], [weekBookings]);

  const confirmM = useApiMutation('confirmBooking');
  const reject = useApiMutation('rejectBooking');
  const { confirm: askConfirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

  async function handleConfirm(id: string) {
    try {
      await confirmM.mutate({ bookingId: id });
      toast({ title: 'Solicitud confirmada', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo confirmar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  async function handleReject(id: string) {
    if (confirmM.loading) return;
    const ok = await askConfirm({
      title: 'Rechazar solicitud',
      message: 'El cliente recibirá una alerta con el rechazo. La franja queda libre.',
      confirmLabel: 'Rechazar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await reject.mutate({ bookingId: id });
      toast({ title: 'Solicitud rechazada', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo rechazar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            {greeting()}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            {user?.nombres ?? 'Hola'}, vamos al lío.
          </h1>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-2xl h-28 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-40 animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KpiTile
                icon="cal"
                label="Hoy"
                value={data.hoyKpi.sesionesHoy}
                sub={`sesion${data.hoyKpi.sesionesHoy === 1 ? '' : 'es'}`}
              />
              <KpiTile
                icon="bell"
                label="Pendientes"
                value={data.hoyKpi.solicitudesPendientes}
                sub="por confirmar"
                tone={data.hoyKpi.solicitudesPendientes > 0 ? 'warn' : undefined}
              />
              <KpiTile
                icon="check"
                label="Esta semana"
                value={data.hoyKpi.completadasSemana}
                sub="completadas"
              />
              <KpiTile
                icon="group"
                label="Usuarios"
                value={data.hoyKpi.usuariosActivos}
                sub="activos"
              />
            </div>

            {/* Solicitudes pendientes */}
            <Section
              title="Solicitudes pendientes"
              count={data.solicitudesPendientes.length}
            >
              {data.solicitudesPendientes.length === 0 ? (
                <p className="text-fg-2 text-sm py-4">
                  Sin solicitudes pendientes. Bien manejado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.solicitudesPendientes.map((s) => (
                    <RequestRow
                      key={s.id}
                      request={s}
                      onConfirm={() => handleConfirm(s.id)}
                      onReject={() => handleReject(s.id)}
                      busy={confirmM.loading || reject.loading}
                    />
                  ))}
                </ul>
              )}
            </Section>

            {/* Sesiones de hoy */}
            <Section title="Sesiones de hoy">
              {data.sesionesHoy.length === 0 ? (
                <p className="text-fg-2 text-sm py-4">Día libre, sin sesiones agendadas.</p>
              ) : (
                <ul className="space-y-2">
                  {data.sesionesHoy.map((s) => (
                    <TodayRow key={s.id} session={s} />
                  ))}
                </ul>
              )}
            </Section>

            {/* Calendario semanal embebido */}
            {calBookings.length > 0 && (
              <Section
                title="Tu semana"
                action={{ to: '/calendario', label: 'Ver pantalla completa' }}
              >
                <Card padding={14}>
                  <CalendarView
                    bookings={calBookings}
                    defaultView="timeGridWeek"
                    showLabel="cliente"
                    height={500}
                    onBookingClick={() => navigate('/calendario')}
                  />
                </Card>
              </Section>
            )}

            {/* Planes por vencer */}
            {data.planesPorVencer.length > 0 && (
              <Section title="Planes por vencer">
                <ul className="space-y-2">
                  {data.planesPorVencer.map((p) => (
                    <ExpiringRow key={p.id} plan={p} />
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>
      {confirmDialog}
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────

function KpiTile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: 'cal' | 'bell' | 'check' | 'group';
  label: string;
  value: number;
  sub: string;
  tone?: 'warn';
}) {
  return (
    <Card padding={16}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon
          name={icon}
          size={14}
          color={tone === 'warn' ? '#FFB02E' : '#A8B0A4'}
          strokeWidth={2}
        />
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
          {label}
        </span>
      </div>
      <div className="font-display text-3xl font-bold tracking-[-0.03em] leading-none">
        {value}
      </div>
      <div className="text-fg-3 text-[12px] mt-1">{sub}</div>
    </Card>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-2 text-warn">({count})</span>
          )}
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

function RequestRow({
  request,
  onConfirm,
  onReject,
  busy,
}: {
  request: SolicitudPendiente;
  onConfirm: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <li>
      <Card padding={14}>
        <div className="flex items-start gap-3 mb-3">
          <div className="text-center flex-none w-12">
            <div className="font-display text-lg font-bold tracking-[-0.03em] leading-none">
              {formatTime(request.fechaInicioUtc)}
            </div>
            <div className="text-[10px] font-mono text-fg-3 mt-0.5">
              {request.duracionMin}m
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
              {formatDate(request.fechaInicioUtc)} · {formatRelative(request.fechaInicioUtc)}
            </div>
            <div className="font-medium text-sm mt-0.5">
              {request.cliente
                ? `${request.cliente.nombres} ${request.cliente.apellidos}`.trim()
                : 'Cliente'}
            </div>
            <div className="mt-1.5">
              <StatusBadge kind={STATE_TO_BADGE[request.estado] ?? 'pendiente'} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="danger" size="sm" full onClick={onReject} disabled={busy}>
            Rechazar
          </Btn>
          <Btn size="sm" full onClick={onConfirm} disabled={busy}>
            Confirmar
          </Btn>
        </div>
      </Card>
    </li>
  );
}

function TodayRow({ session }: { session: SesionHoy }) {
  return (
    <li>
      <Link
        to="/calendario"
        className="block bg-surface border border-line hover:border-line-2 rounded-2xl p-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-center flex-none w-12">
            <div className="font-display text-lg font-bold tracking-[-0.03em] leading-none">
              {formatTime(session.fechaInicioUtc)}
            </div>
            <div className="text-[10px] font-mono text-fg-3 mt-0.5">
              {session.duracionMin}m
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm capitalize">
              {session.tipo} ·{' '}
              {session.cliente
                ? `${session.cliente.nombres} ${session.cliente.apellidos}`.trim()
                : 'Cliente'}
            </div>
          </div>
          <StatusBadge kind={STATE_TO_BADGE[session.estado] ?? 'pendiente'} />
        </div>
      </Link>
    </li>
  );
}

function ExpiringRow({ plan }: { plan: PlanPorVencer }) {
  return (
    <li>
      <Link
        to={plan.cliente ? `/usuarios/${plan.cliente.id}` : '/usuarios'}
        className="block bg-surface border border-line hover:border-line-2 rounded-2xl p-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon name="clock" size={16} color="#FFB02E" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">
              {plan.cliente
                ? `${plan.cliente.nombres} ${plan.cliente.apellidos}`.trim()
                : 'Cliente'}
            </div>
            <div className="text-fg-3 text-[12px] mt-0.5">
              Vence en {plan.diasRestantes} día{plan.diasRestantes === 1 ? '' : 's'} ·{' '}
              {plan.sesionesRestantes} sesion{plan.sesionesRestantes === 1 ? '' : 'es'} restantes
            </div>
          </div>
          <Icon name="arrow" size={14} color="#6B746A" />
        </div>
      </Link>
    </li>
  );
}
