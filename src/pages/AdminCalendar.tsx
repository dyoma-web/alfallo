import { useMemo, useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { CalendarView, type CalendarBooking, type UnavailabilityEvent as UnavailabilityEvt } from '../components/calendar/CalendarView';
import { useApiQuery } from '../lib/useApiQuery';
import { SedeBlockFormModal, type SedeBlock } from '../components/admin/SedeBlockFormModal';
import { formatDate, formatTime } from '../lib/datetime';

interface BookingFromApi extends CalendarBooking {
  user_id: string;
  entrenador_id: string;
  sede_id: string;
}

interface OptionLite {
  id: string;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  email?: string;
  ciudad?: string;
}

export default function AdminCalendar() {
  const [filterTrainerId, setFilterTrainerId] = useState('');
  const [filterSedeId, setFilterSedeId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [showSedeBlock, setShowSedeBlock] = useState(false);
  const [editingSedeBlock, setEditingSedeBlock] = useState<SedeBlock | null>(null);

  const { data, error, loading } = useApiQuery<BookingFromApi[]>(
    'listMyBookings',
    {
      filterTrainerId: filterTrainerId || undefined,
      filterSedeId: filterSedeId || undefined,
      filterUserId: filterUserId || undefined,
    },
    { deps: [filterTrainerId, filterSedeId, filterUserId] }
  );

  const { data: trainers } = useApiQuery<OptionLite[]>('adminListTrainers');
  const { data: sedes } = useApiQuery<OptionLite[]>('adminListSedes');
  const { data: users } = useApiQuery<OptionLite[]>(
    'adminListUsers',
    { rol: 'client' }
  );

  const bookings = useMemo(() => data ?? [], [data]);

  // Iter 13: cargar franjas de no-disponibilidad de TODOS los trainers
  const unavailFrom = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString();
  }, []);
  const unavailTo = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString();
  }, []);
  const { data: unavailability } = useApiQuery<UnavailabilityEvt[]>(
    'expandUnavailability',
    {
      fromUtc: unavailFrom,
      toUtc: unavailTo,
      entityId: filterTrainerId || undefined,
    },
    { deps: [filterTrainerId] }
  );
  const { data: sedeBlocks, refetch: refetchSedeBlocks } = useApiQuery<UnavailabilityEvt[]>(
    'expandSedeBlocks',
    {
      fromUtc: unavailFrom,
      toUtc: unavailTo,
      sedeId: filterSedeId || undefined,
    },
    { deps: [filterSedeId] }
  );

  const calendarBlocks = useMemo(
    () => [...(unavailability ?? []), ...(sedeBlocks ?? [])],
    [unavailability, sedeBlocks]
  );

  const labelMode =
    filterUserId ? 'tipo' : filterTrainerId ? 'cliente' : 'auto';

  const activeFilterCount = [filterTrainerId, filterSedeId, filterUserId]
    .filter(Boolean).length;

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-8 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              Calendario global
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              Todos los agendamientos. Filtra por entrenador, sede o usuario.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {bookings.length > 0 && (
              <div className="text-[12px] text-fg-3">
                {bookings.length} agendamiento{bookings.length === 1 ? '' : 's'}
                {activeFilterCount > 0 && ` (${activeFilterCount} filtro${activeFilterCount === 1 ? '' : 's'} activo${activeFilterCount === 1 ? '' : 's'})`}
              </div>
            )}
            <Btn icon="plus" size="sm" onClick={() => setShowSedeBlock(true)}>
              Bloquear sede
            </Btn>
          </div>
        </div>

        {/* Filtros */}
        <Card padding={14} className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FilterSelect
              label="Entrenador"
              value={filterTrainerId}
              onChange={setFilterTrainerId}
              placeholder="Todos los entrenadores"
              options={(trainers ?? []).map((t) => ({
                value: t.id,
                label: `${t.nombres ?? ''} ${t.apellidos ?? ''}`.trim() || t.email || t.id,
              }))}
            />
            <FilterSelect
              label="Sede"
              value={filterSedeId}
              onChange={setFilterSedeId}
              placeholder="Todas las sedes"
              options={(sedes ?? []).map((s) => ({
                value: s.id,
                label: s.ciudad ? `${s.nombre} · ${s.ciudad}` : (s.nombre ?? s.id),
              }))}
            />
            <FilterSelect
              label="Cliente"
              value={filterUserId}
              onChange={setFilterUserId}
              placeholder="Todos los clientes"
              options={(users ?? []).map((u) => ({
                value: u.id,
                label: `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim() || u.email || u.id,
              }))}
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setFilterTrainerId('');
                setFilterSedeId('');
                setFilterUserId('');
              }}
              className="mt-2 text-[12px] text-fg-2 hover:text-fg underline-offset-2 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </Card>

        {error && (
          <Card padding={20} className="border-err/25 bg-err/5 mb-4">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {loading && (
          <div className="bg-surface border border-line rounded-2xl h-[600px] animate-pulse" />
        )}

        {!loading && (
          <>
            <Card padding={14}>
              {bookings.length === 0 && calendarBlocks.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="cal" size={32} color="#6B746A" className="mx-auto mb-3" />
                  <p className="text-fg-2">No hay agendamientos en el rango.</p>
                </div>
              ) : (
                <CalendarView
                  bookings={bookings}
                  unavailability={calendarBlocks}
                  showTrainerInUnavailability
                  defaultView="timeGridWeek"
                  showLabel={labelMode}
                  height={700}
                />
              )}
            </Card>

            <SedeBlocksPanel
              blocks={(sedeBlocks ?? []) as SedeBlock[]}
              onEdit={(block) => {
                setEditingSedeBlock(block);
                setShowSedeBlock(true);
              }}
            />
          </>
        )}

        <SedeBlockFormModal
          open={showSedeBlock}
          sedes={sedes ?? []}
          initialSedeId={filterSedeId}
          initialBlock={editingSedeBlock}
          onClose={() => {
            setShowSedeBlock(false);
            setEditingSedeBlock(null);
          }}
          onSaved={() => {
            setShowSedeBlock(false);
            setEditingSedeBlock(null);
            void refetchSedeBlocks();
          }}
        />
      </div>
    </AppShell>
  );
}

function SedeBlocksPanel({
  blocks,
  onEdit,
}: {
  blocks: SedeBlock[];
  onEdit: (block: SedeBlock) => void;
}) {
  if (blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
          Bloqueos de sede
        </h2>
        <span className="text-[11px] text-fg-3">{blocks.length}</span>
      </div>
      <Card padding={0}>
        <ul className="divide-y divide-line">
          {sorted.map((b) => (
            <li key={`${b.ruleId}-${b.start}`} className="p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-err/10 border border-err/20 flex items-center justify-center flex-none">
                <Icon name="mapPin" size={15} color="#FF8E8E" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{b.sedeName || b.titulo}</div>
                <div className="text-[12px] text-fg-2 mt-0.5">
                  {formatDate(b.start)} · {formatTime(b.start)}-{formatTime(b.end)}
                </div>
                {b.descripcion && (
                  <p className="text-[12px] text-fg-3 mt-0.5">{b.descripcion}</p>
                )}
              </div>
              <Btn variant="secondary" size="sm" onClick={() => onEdit(b)}>
                Editar
              </Btn>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
