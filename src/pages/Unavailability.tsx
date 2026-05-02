import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { useApiQuery } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';
import { UnavailabilityFormModal } from '../components/UnavailabilityFormModal';
import { formatDate, formatTime, formatDateLong } from '../lib/datetime';

interface Rule {
  id: string;
  entity_type: string;
  entity_id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio_utc: string;
  fecha_fin_utc: string;
  recurrence: 'none' | 'daily' | 'weekly';
  dias_semana?: string;
  intervalo?: number | string;
  fecha_fin_recurrencia?: string;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Unavailability() {
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Rule[]>('listUnavailability');

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              No disponibilidad
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              {isAdmin
                ? 'Franjas globales y por entrenador. Bloquean agendamiento.'
                : 'Tus franjas marcadas como no-disponibles. Tus clientes no podrán agendar en esas horas.'}
            </p>
          </div>
          <Btn icon="plus" onClick={() => setShowCreate(true)}>Nueva franja</Btn>
        </div>

        {loading && <div className="bg-surface border border-line rounded-2xl h-32 animate-pulse" />}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && data.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="clock" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">
                No tienes franjas de no-disponibilidad.
              </p>
              <Btn icon="plus" onClick={() => setShowCreate(true)}>
                Crear primera
              </Btn>
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((r) => (
              <RuleRow key={r.id} rule={r} onEdit={() => setEditing(r)} />
            ))}
          </ul>
        )}
      </div>

      <UnavailabilityFormModal
        open={showCreate || !!editing}
        initialRule={editing}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        onSaved={() => { setShowCreate(false); setEditing(null); void refetch(); }}
      />
    </AppShell>
  );
}

function RuleRow({ rule, onEdit }: { rule: Rule; onEdit: () => void }) {
  const dur = `${formatTime(rule.fecha_inicio_utc)} – ${formatTime(rule.fecha_fin_utc)}`;
  const isRecurring = rule.recurrence !== 'none';

  let recurrenceText = '';
  if (rule.recurrence === 'daily') {
    const n = Number(rule.intervalo) || 1;
    recurrenceText = n === 1 ? 'Todos los días' : `Cada ${n} días`;
  } else if (rule.recurrence === 'weekly') {
    const dows = String(rule.dias_semana || '').split(',').map(Number).filter((d) => !isNaN(d));
    const dayNames = dows.map((d) => DAY_NAMES[d]).join(', ');
    const n = Number(rule.intervalo) || 1;
    recurrenceText = n === 1 ? dayNames : `${dayNames} (cada ${n} sem)`;
  }

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left bg-surface border border-line hover:border-line-2 rounded-2xl p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-warn/10 border border-warn/25 flex items-center justify-center flex-none">
            <Icon name="clock" size={18} color="#FFC97A" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">{rule.titulo}</div>
            {rule.descripcion && (
              <div className="text-fg-2 text-[12px] mt-0.5 line-clamp-1">{rule.descripcion}</div>
            )}
            <div className="text-fg-3 text-[12px] mt-1.5">
              {isRecurring ? (
                <span>
                  <span className="text-fg-2">{recurrenceText}</span> · {dur}
                </span>
              ) : (
                <span>{formatDateLong(rule.fecha_inicio_utc)} · {dur}</span>
              )}
            </div>
            {isRecurring && (
              <div className="text-fg-3 text-[11px] mt-0.5">
                Desde {formatDate(rule.fecha_inicio_utc)}
                {rule.fecha_fin_recurrencia
                  ? ` hasta ${formatDate(rule.fecha_fin_recurrencia)}`
                  : ' · sin fin'}
              </div>
            )}
          </div>

          {rule.entity_type === 'global' && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/10 text-warn border border-warn/25">
              global
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
