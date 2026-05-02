import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import {
  formatDate,
  formatDateLong,
  formatTime,
  formatRelative,
  formatShortDate,
  daysFromNow,
} from '../lib/datetime';

interface Booking {
  id: string;
  user_id: string;
  entrenador_id: string;
  sede_id: string;
  fecha_inicio_utc: string;
  duracion_min: number | string;
  tipo: string;
  estado: string;
  notas_usuario?: string;
  notas_entrenador?: string;
  motivo_cancelacion?: string;
  cancelado_at_utc?: string;
  created_at: string;
  entrenador: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  sede: { id: string; nombre: string; ciudad: string } | null;
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
  expirado: 'cancelado',
};

const FINAL_STATES = ['cancelado', 'completado', 'no-asistido', 'rechazado', 'expirado'];

export default function UserCalendar() {
  const [searchParams] = useSearchParams();
  const justBooked = searchParams.get('booked') === '1';
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Booking[]>('listMyBookings', {});

  const filtered = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.filter((b) => {
      if (!b.fecha_inicio_utc) return false;
      const t = new Date(b.fecha_inicio_utc).getTime();
      if (filter === 'upcoming') return t >= now && !FINAL_STATES.includes(String(b.estado));
      if (filter === 'past') return t < now || FINAL_STATES.includes(String(b.estado));
      return true;
    });
  }, [data, filter]);

  const grouped = useMemo(() => groupByPeriod(filtered, filter), [filtered, filter]);
  const selectedBooking = useMemo(
    () => (selectedBookingId ? data?.find((b) => b.id === selectedBookingId) ?? null : null),
    [selectedBookingId, data]
  );

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Mi calendario
          </h1>
          <Link to="/agendar">
            <Btn icon="plus" size="md">Agendar</Btn>
          </Link>
        </div>

        {justBooked && (
          <Card padding={14} className="border-ok/25 bg-ok/5 mb-4">
            <div className="flex items-start gap-3">
              <Icon name="check" size={16} color="#A6EDB1" strokeWidth={2.5} />
              <div className="text-ok-fg text-[13px]">
                Tu solicitud quedó registrada. Tu entrenador la verá y la confirmará pronto.
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-5 overflow-x-auto">
          <FilterChip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
            Próximas
          </FilterChip>
          <FilterChip active={filter === 'past'} onClick={() => setFilter('past')}>
            Anteriores
          </FilterChip>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas
          </FilterChip>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && filtered.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="cal" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">
                {filter === 'upcoming' ? 'No tienes sesiones próximas.' : 'Sin sesiones aquí.'}
              </p>
              {filter === 'upcoming' && (
                <Link to="/agendar">
                  <Btn icon="plus">Agendar primera sesión</Btn>
                </Link>
              )}
            </div>
          </Card>
        )}

        {data && filtered.length > 0 && (
          <div className="space-y-6">
            {grouped.map(([groupName, items]) => (
              <section key={groupName}>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2 px-1">
                  {groupName}
                </div>
                <ul className="space-y-2">
                  {items.map((b) => (
                    <BookingRow key={b.id} booking={b} onClick={() => setSelectedBookingId(b.id)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBookingId(null)}
          onCancelled={() => {
            setSelectedBookingId(null);
            void refetch();
          }}
        />
      </div>
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// BookingRow
// ──────────────────────────────────────────────────────────────────────────

function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const trainerName = booking.entrenador
    ? `${booking.entrenador.nombres} ${booking.entrenador.apellidos}`.trim()
    : '';

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-surface border border-line hover:border-line-2 rounded-2xl p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <div className="flex items-start gap-4">
          <div className="text-center flex-none w-14">
            <div className="font-display text-xl font-bold tracking-[-0.03em] leading-none">
              {formatTime(booking.fecha_inicio_utc)}
            </div>
            <div className="text-[10px] font-mono text-fg-3 mt-1">
              {Number(booking.duracion_min) || 60}m
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mb-1">
              {formatDate(booking.fecha_inicio_utc)}
            </div>
            <div className="font-medium text-sm capitalize">
              {booking.tipo} {trainerName && `· ${trainerName}`}
            </div>
            {booking.sede && (
              <div className="text-fg-2 text-[12px] mt-1 flex items-center gap-1">
                <Icon name="mapPin" size={12} color="currentColor" />
                {booking.sede.nombre}
              </div>
            )}
          </div>

          <div className="flex-none">
            <StatusBadge kind={STATE_TO_BADGE[booking.estado] ?? 'cancelado'} />
          </div>
        </div>
      </button>
    </li>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// BookingDetailModal — detalle + cancelación
// ──────────────────────────────────────────────────────────────────────────

function BookingDetailModal({
  booking,
  onClose,
  onCancelled,
}: {
  booking: Booking | null;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const cancel = useApiMutation<{
    booking: { estado: string };
    dentroMargen: boolean;
    politicaAplicada: { nombre: string; ventanaHoras: number } | null;
  }>('cancelBooking');

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [postCancelInfo, setPostCancelInfo] = useState<
    | { dentroMargen: boolean; politica: string | null }
    | null
  >(null);

  if (!booking) return null;

  const cancelable =
    !FINAL_STATES.includes(String(booking.estado)) && booking.estado !== 'borrador';

  async function doCancel() {
    if (!booking) return;
    try {
      const res = await cancel.mutate({ bookingId: booking.id, motivo });
      setConfirmingCancel(false);
      setPostCancelInfo({
        dentroMargen: res.dentroMargen,
        politica: res.politicaAplicada?.nombre ?? null,
      });
    } catch {
      /* error queda en cancel.error */
    }
  }

  function close() {
    setConfirmingCancel(false);
    setMotivo('');
    setPostCancelInfo(null);
    cancel.reset();
    onClose();
    if (postCancelInfo) onCancelled();
  }

  // Después de cancelar: pantalla de confirmación
  if (postCancelInfo) {
    return (
      <Modal open onClose={close} title="Sesión cancelada">
        <div className="px-5 py-5 space-y-4">
          <div
            className={[
              'p-4 rounded-xl border text-[13px] flex items-start gap-3',
              postCancelInfo.dentroMargen
                ? 'bg-ok/5 border-ok/25 text-ok-fg'
                : 'bg-warn/5 border-warn/25 text-warn',
            ].join(' ')}
            style={postCancelInfo.dentroMargen ? undefined : { color: '#FFC97A' }}
          >
            <Icon
              name={postCancelInfo.dentroMargen ? 'check' : 'bell'}
              size={16}
              strokeWidth={2.5}
              className="mt-0.5 flex-none"
            />
            <div>
              {postCancelInfo.dentroMargen
                ? 'Cancelaste dentro del margen permitido. Tu sesión vuelve a estar disponible para tu plan.'
                : 'Cancelaste fuera del margen. Según la política, esta sesión podría descontarse de tu plan.'}
              {postCancelInfo.politica && (
                <div className="text-[12px] opacity-75 mt-1">
                  Política aplicada: {postCancelInfo.politica}
                </div>
              )}
            </div>
          </div>
          <Btn full onClick={() => { onCancelled(); close(); }}>Entendido</Btn>
        </div>
      </Modal>
    );
  }

  // Confirmación de cancelación
  if (confirmingCancel) {
    return (
      <Modal open onClose={() => setConfirmingCancel(false)} title="¿Cancelar sesión?">
        <div className="px-5 py-5 space-y-4">
          <div className="text-fg-2 text-sm leading-relaxed">
            Esta acción no se puede deshacer. Si la cancelación es fuera del margen permitido,
            podría descontar la sesión de tu plan según la política de tu entrenador.
          </div>

          <div>
            <label
              htmlFor="motivo-cancel"
              className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2"
            >
              Motivo (opcional)
            </label>
            <textarea
              id="motivo-cancel"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej. Imprevisto laboral"
              className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
            />
          </div>

          {cancel.error && (
            <div role="alert" className="text-err-fg text-[13px]">
              {cancel.error.message}
            </div>
          )}

          <div className="flex gap-2">
            <Btn
              variant="secondary"
              full
              onClick={() => setConfirmingCancel(false)}
              disabled={cancel.loading}
            >
              Volver
            </Btn>
            <Btn
              variant="danger"
              full
              icon="x"
              onClick={doCancel}
              disabled={cancel.loading}
            >
              {cancel.loading ? 'Cancelando...' : 'Sí, cancelar'}
            </Btn>
          </div>
        </div>
      </Modal>
    );
  }

  const trainerName = booking.entrenador
    ? `${booking.entrenador.nombres} ${booking.entrenador.apellidos}`.trim()
    : '—';

  return (
    <Modal open onClose={close} title="Detalle del entrenamiento" size="lg">
      <div className="px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-bold tracking-[-0.03em]">
              {formatTime(booking.fecha_inicio_utc)}
            </div>
            <div className="text-fg-2 text-sm mt-1">
              {formatDateLong(booking.fecha_inicio_utc)}
            </div>
            <div className="text-fg-3 text-[12px] mt-0.5">
              {formatRelative(booking.fecha_inicio_utc)} · {Number(booking.duracion_min) || 60} min
            </div>
          </div>
          <StatusBadge kind={STATE_TO_BADGE[booking.estado] ?? 'cancelado'} />
        </div>

        <hr className="border-line" />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Tipo" value={booking.tipo} capitalize />
          <Field label="Entrenador" value={trainerName} />
          <Field
            label="Sede"
            value={
              booking.sede
                ? `${booking.sede.nombre} · ${booking.sede.ciudad}`
                : '—'
            }
          />
          <Field label="Solicitada" value={formatShortDate(booking.created_at)} />
        </dl>

        {booking.notas_usuario && (
          <div className="pt-3 border-t border-line">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              Tus notas
            </div>
            <p className="text-fg-2 text-sm">{booking.notas_usuario}</p>
          </div>
        )}

        {booking.notas_entrenador && (
          <div className="pt-3 border-t border-line">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              Notas del entrenador
            </div>
            <p className="text-fg-2 text-sm">{booking.notas_entrenador}</p>
          </div>
        )}

        {booking.motivo_cancelacion && (
          <div className="pt-3 border-t border-line">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              Motivo de cancelación
            </div>
            <p className="text-fg-2 text-sm">{booking.motivo_cancelacion}</p>
          </div>
        )}

        <div className="flex gap-2 pt-3">
          <Btn variant="secondary" full onClick={close}>
            Cerrar
          </Btn>
          {cancelable && (
            <Btn
              variant="danger"
              icon="x"
              full
              onClick={() => setConfirmingCancel(true)}
            >
              Cancelar sesión
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">{label}</dt>
      <dd className={`text-fg mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3.5 py-1.5 rounded-full text-sm border transition-colors flex-none',
        active
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-transparent border-line-2 text-fg-2 hover:text-fg hover:bg-surface',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function groupByPeriod(items: Booking[], filter: 'upcoming' | 'past' | 'all'): Array<[string, Booking[]]> {
  if (items.length === 0) return [];
  // Sort según filtro: upcoming asc, past/all desc
  const sorted = [...items].sort((a, b) => {
    const ta = new Date(a.fecha_inicio_utc).getTime();
    const tb = new Date(b.fecha_inicio_utc).getTime();
    return filter === 'upcoming' ? ta - tb : tb - ta;
  });

  const groups: Record<string, Booking[]> = {};
  const order: string[] = [];
  for (const b of sorted) {
    const key = bucketLabel(b.fecha_inicio_utc, filter);
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(b);
  }
  return order.map((k) => [k, groups[k]] as [string, Booking[]]);
}

function bucketLabel(utcIso: string, filter: 'upcoming' | 'past' | 'all'): string {
  const days = daysFromNow(utcIso);
  if (filter === 'past' || days < 0) {
    if (days >= -1) return 'Ayer';
    if (days >= -7) return 'Esta semana';
    if (days >= -30) return 'Este mes';
    return 'Anteriores';
  }
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days <= 7) return 'Esta semana';
  if (days <= 14) return 'Próxima semana';
  return 'Más adelante';
}
