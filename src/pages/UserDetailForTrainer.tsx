import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery } from '../lib/useApiQuery';
import { formatDate, formatTime, formatShortDate, formatRelative } from '../lib/datetime';

interface UserData {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  celular?: string;
  estado: string;
}
interface PlanData {
  id: string;
  nombre: string;
  tipo: string;
  sesionesTotales: number;
  sesionesConsumidas: number;
  sesionesRestantes: number;
  fechaCompraUtc: string;
  fechaVencimientoUtc: string;
  estado: string;
}
interface AsistenciaData {
  id: string;
  agendamientoId: string;
  presente: boolean;
  peso?: string | number;
  observaciones?: string;
  createdAt: string;
}
interface BookingData {
  id: string;
  fecha_inicio_utc: string;
  duracion_min: number | string;
  tipo: string;
  estado: string;
}

interface ProfileData {
  user: UserData;
  planes: PlanData[];
  asistencias: AsistenciaData[];
  proximos: BookingData[];
  recientes: BookingData[];
}

const STATE_TO_BADGE: Record<string, StatusKind> = {
  solicitado: 'pendiente',
  confirmado: 'confirmado',
  pactado: 'pactado',
  completado: 'completado',
  cancelado: 'cancelado',
  'no-asistido': 'no-asistido',
  rechazado: 'rechazado',
  requiere_autorizacion: 'autorizacion',
};

export default function UserDetailForTrainer() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApiQuery<ProfileData>(
    'getUserOperationalProfile',
    { userId: id ?? '' },
    { enabled: !!id }
  );

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <Link
          to="/usuarios"
          className="text-[12px] text-fg-2 hover:text-fg flex items-center gap-1 mb-4"
        >
          <Icon name="arrow" size={12} className="rotate-180" /> Volver a usuarios
        </Link>

        {loading && <div className="bg-surface border border-line rounded-2xl h-64 animate-pulse" />}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && (
          <>
            {/* Header con avatar + datos */}
            <Card padding={24}>
              <div className="flex items-start gap-4">
                <Avatar nombres={data.user.nombres} apellidos={data.user.apellidos} />
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-xl md:text-2xl font-semibold tracking-[-0.02em]">
                    {data.user.nombres} {data.user.apellidos}
                  </h1>
                  {data.user.nick && (
                    <div className="text-fg-3 text-sm">@{data.user.nick}</div>
                  )}
                  <div className="text-fg-2 text-sm mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Icon name="msg" size={12} color="currentColor" />
                      {data.user.email}
                    </span>
                    {data.user.celular && (
                      <span className="flex items-center gap-1">
                        <Icon name="user" size={12} color="currentColor" />
                        {data.user.celular}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Plan activo */}
            <section className="mt-6">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2 px-1">
                Planes
              </h2>
              {data.planes.length === 0 ? (
                <Card padding={20}>
                  <p className="text-fg-2 text-sm">Este usuario no tiene planes asignados.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {data.planes.map((p) => (
                    <PlanRow key={p.id} plan={p} />
                  ))}
                </div>
              )}
            </section>

            {/* Próximas sesiones */}
            {data.proximos.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2 px-1">
                  Próximas sesiones
                </h2>
                <ul className="space-y-2">
                  {data.proximos.map((b) => (
                    <BookingRow key={b.id} booking={b} />
                  ))}
                </ul>
              </section>
            )}

            {/* Asistencia reciente */}
            {data.asistencias.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2 px-1">
                  Asistencia reciente
                </h2>
                <Card padding={0}>
                  <ul className="divide-y divide-line">
                    {data.asistencias.map((a) => (
                      <AsistenciaRow key={a.id} item={a} />
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {/* Sesiones pasadas */}
            {data.recientes.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2 px-1">
                  Historial reciente
                </h2>
                <ul className="space-y-2">
                  {data.recientes.slice(0, 10).map((b) => (
                    <BookingRow key={b.id} booking={b} />
                  ))}
                </ul>
              </section>
            )}

            {/* Footer note about Iter 7 features */}
            <div className="mt-8 text-center text-[12px] text-fg-3">
              Asignar rutinas, ver indicadores avanzados y editar datos del usuario llegan en Iter 7.
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function PlanRow({ plan }: { plan: PlanData }) {
  const badge: StatusKind =
    plan.estado === 'active'
      ? 'plan-activo'
      : plan.estado === 'expired'
      ? 'plan-vencido'
      : 'cancelado';
  const pct = Math.round((plan.sesionesConsumidas / Math.max(1, plan.sesionesTotales)) * 100);

  return (
    <Card padding={16}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-medium text-sm">{plan.nombre}</div>
          <div className="text-fg-3 text-[12px] mt-0.5">
            {formatShortDate(plan.fechaCompraUtc)} → {formatShortDate(plan.fechaVencimientoUtc)}
          </div>
        </div>
        <StatusBadge kind={badge} />
      </div>
      <div className="flex items-baseline justify-between mt-2 mb-1.5">
        <span className="text-[13px] text-fg-2">
          {plan.sesionesRestantes}/{plan.sesionesTotales} restantes
        </span>
        <span className="text-[11px] font-mono text-fg-3">{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

function BookingRow({ booking }: { booking: BookingData }) {
  return (
    <li>
      <div className="bg-surface border border-line rounded-2xl p-3">
        <div className="flex items-center gap-3">
          <div className="text-center flex-none w-12">
            <div className="font-display text-base font-bold tracking-[-0.03em] leading-none">
              {formatTime(booking.fecha_inicio_utc)}
            </div>
            <div className="text-[10px] font-mono text-fg-3 mt-0.5">
              {Number(booking.duracion_min) || 60}m
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mb-0.5">
              {formatDate(booking.fecha_inicio_utc)}
            </div>
            <div className="text-sm capitalize">{booking.tipo}</div>
          </div>
          <StatusBadge kind={STATE_TO_BADGE[booking.estado] ?? 'cancelado'} />
        </div>
      </div>
    </li>
  );
}

function AsistenciaRow({ item }: { item: AsistenciaData }) {
  return (
    <li className="flex items-start gap-3 p-3">
      <span
        className={[
          'w-2 h-2 rounded-full mt-1.5 flex-none',
          item.presente ? 'bg-ok' : 'bg-err',
        ].join(' ')}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          {item.presente ? 'Asistió' : 'No asistió'}
          {item.peso && ` · Peso: ${item.peso}kg`}
        </div>
        {item.observaciones && (
          <p className="text-fg-2 text-[12px] mt-0.5">{item.observaciones}</p>
        )}
        <div className="text-fg-3 text-[11px] mt-0.5">{formatRelative(item.createdAt)}</div>
      </div>
    </li>
  );
}

function Avatar({ nombres, apellidos }: { nombres: string; apellidos: string }) {
  const initials =
    (nombres?.charAt(0) ?? '').toUpperCase() +
    (apellidos?.charAt(0) ?? '').toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center flex-none">
      <span
        className="font-display text-lg font-bold tracking-[-0.02em]"
        style={{ color: '#0B1208' }}
      >
        {initials || '·'}
      </span>
    </div>
  );
}

// Btn import not used currently — quitarlo si TS reclama
void Btn;
