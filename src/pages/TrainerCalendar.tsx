/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { RegisterAttendanceModal } from '../components/RegisterAttendanceModal';
import { CalendarView, type CalendarBooking, type UnavailabilityEvent as UnavailabilityEvt } from '../components/calendar/CalendarView';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import {
  formatDate,
  formatDateLong,
  formatTime,
  formatRelative,
  formatShortDate,
  daysFromNow,
} from '../lib/datetime';

interface Booking extends CalendarBooking {
  user_id: string;
  entrenador_id: string;
  notas_usuario?: string;
  notas_entrenador?: string;
  motivo_cancelacion?: string;
  created_at: string;
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

type ViewMode = 'list' | 'calendar';
type DayFilter = 'all' | 'weekdays' | 'weekend';

export default function TrainerCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userParam = searchParams.get('userId') ?? '';
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calendar' : 'list'
  );
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [userFilter, setUserFilter] = useState(userParam);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registeringAttendance, setRegisteringAttendance] = useState<string | null>(null);

  useEffect(() => {
    setUserFilter(userParam);
  }, [userParam]);

  function updateUserFilter(id: string) {
    setUserFilter(id);
    const next = new URLSearchParams(searchParams);
    if (id) next.set('userId', id);
    else next.delete('userId');
    setSearchParams(next, { replace: true });
  }

  const { data, error, loading, refetch } = useApiQuery<Booking[]>('listMyBookings', {});

  // Iter 13: cargar franjas de no-disponibilidad para mostrar de fondo
  const unavailFrom = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString();
  }, []);
  const unavailTo = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString();
  }, []);
  const { data: unavailability } = useApiQuery<UnavailabilityEvt[]>(
    'expandUnavailability',
    { fromUtc: unavailFrom, toUtc: unavailTo }
  );

  useEffect(() => {
    const stored = localStorage.getItem('alfallo.trainer_calendar_view');
    if (stored === 'list' || stored === 'calendar') setViewMode(stored);
  }, []);
  useEffect(() => {
    localStorage.setItem('alfallo.trainer_calendar_view', viewMode);
  }, [viewMode]);

  const allActive = useMemo(() => {
    if (!data) return [];
    return data.filter((b) => !!b.fecha_inicio_utc);
  }, [data]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of allActive) {
      if (b.cliente?.id) {
        const name = `${b.cliente.nombres ?? ''} ${b.cliente.apellidos ?? ''}`.trim();
        if (!map.has(b.cliente.id)) map.set(b.cliente.id, name || b.cliente.id);
      }
    }
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allActive]);

  const calendarBookings = useMemo(() => {
    if (!userFilter) return allActive;
    return allActive.filter((b) => b.cliente?.id === userFilter);
  }, [allActive, userFilter]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return allActive.filter((b) => {
      const t = new Date(b.fecha_inicio_utc).getTime();
      if (filter === 'upcoming' && (t < now || FINAL_STATES.includes(String(b.estado)))) return false;
      if (filter === 'past' && t >= now && !FINAL_STATES.includes(String(b.estado))) return false;
      if (userFilter && b.cliente?.id !== userFilter) return false;
      return true;
    });
  }, [allActive, filter, userFilter]);

  const grouped = useMemo(() => groupByPeriod(filtered, filter), [filtered, filter]);
  const selected = useMemo(
    () => (selectedId ? data?.find((b) => b.id === selectedId) ?? null : null),
    [selectedId, data]
  );

  const hiddenDays =
    dayFilter === 'weekdays'
      ? [0, 6]
      : dayFilter === 'weekend'
      ? [1, 2, 3, 4, 5]
      : undefined;

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Mi calendario
          </h1>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === 'calendar' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <DayFilterChip active={dayFilter === 'all'} onClick={() => setDayFilter('all')}>
                Toda la semana
              </DayFilterChip>
              <DayFilterChip active={dayFilter === 'weekdays'} onClick={() => setDayFilter('weekdays')}>
                Solo entre semana
              </DayFilterChip>
              <DayFilterChip active={dayFilter === 'weekend'} onClick={() => setDayFilter('weekend')}>
                Solo fin de semana
              </DayFilterChip>
              <ClientSelect
                value={userFilter}
                onChange={updateUserFilter}
                clients={clients}
              />
            </div>

            <Card padding={14}>
              {loading ? (
                <div className="h-[600px] animate-pulse" />
              ) : error ? (
                <p className="text-err-fg p-4">{error.message}</p>
              ) : calendarBookings.length === 0 ? (
                <EmptyCalendar filtered={!!userFilter} />
              ) : (
                <CalendarView
                  bookings={calendarBookings}
                  unavailability={unavailability ?? []}
                  defaultView="timeGridWeek"
                  showLabel="cliente"
                  height={650}
                  hiddenDays={hiddenDays}
                  onBookingClick={(id) => setSelectedId(id)}
                />
              )}
            </Card>
          </>
        )}

        {viewMode === 'list' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <FilterChip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
                Próximas
              </FilterChip>
              <FilterChip active={filter === 'past'} onClick={() => setFilter('past')}>
                Anteriores
              </FilterChip>
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                Todas
              </FilterChip>
              <ClientSelect
                value={userFilter}
                onChange={updateUserFilter}
                clients={clients}
              />
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
                  <p className="text-fg-2">
                    {userFilter
                      ? 'Sin sesiones para este cliente con el filtro actual.'
                      : filter === 'upcoming'
                      ? 'Sin sesiones próximas.'
                      : 'Sin sesiones aquí.'}
                  </p>
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
                        <BookingRow key={b.id} booking={b} onClick={() => setSelectedId(b.id)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        <BookingDetailTrainerModal
          booking={selected}
          onClose={() => setSelectedId(null)}
          onAction={() => {
            setSelectedId(null);
            void refetch();
          }}
          onRegister={(id) => {
            setSelectedId(null);
            setRegisteringAttendance(id);
          }}
        />

        <RegisterAttendanceModal
          bookingId={registeringAttendance}
          onClose={() => setRegisteringAttendance(null)}
          onRegistered={() => {
            setRegisteringAttendance(null);
            void refetch();
          }}
        />
      </div>
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div role="tablist" className="inline-flex bg-surface-2 border border-line-2 rounded-xl p-0.5">
      <ToggleButton active={mode === 'calendar'} onClick={() => onChange('calendar')}>
        <Icon name="cal" size={14} />
        <span className="hidden sm:inline">Calendario</span>
      </ToggleButton>
      <ToggleButton active={mode === 'list'} onClick={() => onChange('list')}>
        <Icon name="list" size={14} />
        <span className="hidden sm:inline">Lista</span>
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
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
      role="tab"
      aria-selected={active}
      className={[
        'px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors',
        active ? 'bg-accent text-accent-ink' : 'text-fg-2 hover:text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
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
              {booking.tipo}
              {booking.cliente && ` · ${booking.cliente.nombres} ${booking.cliente.apellidos}`}
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

function BookingDetailTrainerModal({
  booking,
  onClose,
  onAction,
  onRegister,
}: {
  booking: Booking | null;
  onClose: () => void;
  onAction: () => void;
  onRegister: (id: string) => void;
}) {
  const confirmM = useApiMutation('confirmBooking');
  const rejectM = useApiMutation('rejectBooking');
  const cancelM = useApiMutation('cancelBooking');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

  const [confirmingReject, setConfirmingReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!booking) return null;

  const isPending = ['solicitado', 'requiere_autorizacion'].includes(booking.estado);
  const isReady = ['confirmado', 'pactado'].includes(booking.estado);
  const cancelable = !FINAL_STATES.includes(booking.estado) && booking.estado !== 'borrador';

  async function handleConfirm() {
    if (!booking) return;
    try {
      await confirmM.mutate({ bookingId: booking.id });
      onAction();
    } catch { /* */ }
  }

  async function handleReject() {
    if (!booking) return;
    try {
      await rejectM.mutate({ bookingId: booking.id, motivo: rejectReason });
      setConfirmingReject(false);
      setRejectReason('');
      onAction();
    } catch { /* */ }
  }

  async function handleCancel() {
    if (!booking) return;
    const ok = await confirm({
      title: 'Cancelar sesión',
      message: 'El cliente recibirá una alerta y la franja queda libre. La acción no se puede deshacer.',
      confirmLabel: 'Cancelar sesión',
      cancelLabel: 'Volver',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await cancelM.mutate({ bookingId: booking.id });
      toast({ title: 'Sesión cancelada', tone: 'success' });
      onAction();
    } catch (e) {
      toast({
        title: 'No se pudo cancelar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  if (confirmingReject) {
    return (
      <Modal open onClose={() => setConfirmingReject(false)} title="Rechazar solicitud">
        <div className="px-5 py-5 space-y-4">
          <p className="text-fg-2 text-sm">
            El cliente recibirá una alerta. Puedes incluir un motivo (opcional).
          </p>
          <div>
            <label htmlFor="motivo-reject" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Motivo (opcional)
            </label>
            <textarea
              id="motivo-reject"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej. Tengo otro compromiso esa hora..."
              className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
            />
          </div>
          {rejectM.error && (
            <div role="alert" className="text-err-fg text-[13px]">{rejectM.error.message}</div>
          )}
          <div className="flex gap-2">
            <Btn variant="secondary" full onClick={() => setConfirmingReject(false)} disabled={rejectM.loading}>
              Volver
            </Btn>
            <Btn variant="danger" full onClick={handleReject} disabled={rejectM.loading}>
              {rejectM.loading ? 'Rechazando...' : 'Rechazar'}
            </Btn>
          </div>
        </div>
      </Modal>
    );
  }

  const clientName = booking.cliente
    ? `${booking.cliente.nombres} ${booking.cliente.apellidos}`.trim()
    : '—';

  return (
    <Modal open onClose={onClose} title="Detalle del entrenamiento" size="lg">
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
          <Field label="Cliente" value={clientName} />
          <Field label="Sede" value={booking.sede ? `${booking.sede.nombre}` : '—'} />
          <Field label="Solicitada" value={formatShortDate(booking.created_at)} />
        </dl>

        {booking.cliente && (
          <Link
            to={`/usuarios/${booking.cliente.id}`}
            className="text-[12px] text-accent hover:underline underline-offset-2 inline-flex items-center gap-1"
          >
            Ver perfil del cliente <Icon name="arrow" size={12} color="currentColor" />
          </Link>
        )}

        {booking.notas_usuario && (
          <div className="pt-3 border-t border-line">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              Notas del cliente
            </div>
            <p className="text-fg-2 text-sm">{booking.notas_usuario}</p>
          </div>
        )}

        {(confirmM.error || cancelM.error) && (
          <div role="alert" className="text-err-fg text-[13px]">
            {(confirmM.error || cancelM.error)?.message}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3">
          {isPending && (
            <div className="flex gap-2">
              <Btn variant="danger" full onClick={() => setConfirmingReject(true)} disabled={confirmM.loading}>
                Rechazar
              </Btn>
              <Btn full onClick={handleConfirm} disabled={confirmM.loading}>
                {confirmM.loading ? 'Confirmando...' : 'Confirmar'}
              </Btn>
            </div>
          )}

          {isReady && (
            <Btn full size="lg" icon="check" onClick={() => onRegister(booking.id)}>
              Registrar asistencia
            </Btn>
          )}

          <div className="flex gap-2">
            <Btn variant="secondary" full onClick={onClose}>Cerrar</Btn>
            {cancelable && !isPending && (
              <Btn variant="ghost" full onClick={handleCancel} disabled={cancelM.loading}>
                {cancelM.loading ? 'Cancelando...' : 'Cancelar sesión'}
              </Btn>
            )}
          </div>
        </div>
      </div>
      {confirmDialog}
    </Modal>
  );
}

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

function DayFilterChip({
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
        'px-3 py-1 rounded-lg text-[12px] border transition-colors flex-none',
        active
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-surface-2 border-line text-fg-3 hover:text-fg-2',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function EmptyCalendar({ filtered }: { filtered?: boolean }) {
  return (
    <div className="text-center py-16">
      <Icon name="cal" size={32} color="#6B746A" className="mx-auto mb-3" />
      <p className="text-fg-2">
        {filtered ? 'Este cliente no tiene sesiones aquí.' : 'Sin sesiones agendadas todavía.'}
      </p>
    </div>
  );
}

function ClientSelect({
  value,
  onChange,
  clients,
}: {
  value: string;
  onChange: (id: string) => void;
  clients: Array<{ id: string; nombre: string }>;
}) {
  if (clients.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 ml-auto">
      <Icon name="user" size={12} color="#6B746A" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 rounded-lg bg-surface-2 border border-line-2 text-fg text-[12px] focus:outline-none focus:border-accent/60"
        aria-label="Filtrar por cliente"
      >
        <option value="">Todos los clientes</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
    </div>
  );
}

function groupByPeriod(items: Booking[], filter: 'upcoming' | 'past' | 'all'): Array<[string, Booking[]]> {
  if (items.length === 0) return [];
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
