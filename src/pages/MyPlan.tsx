import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery } from '../lib/useApiQuery';
import { formatShortDate, formatRelative } from '../lib/datetime';
import { config } from '../lib/config';

interface PlanItem {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  sesionesTotales: number;
  sesionesConsumidas: number;
  sesionesRestantes: number;
  fechaCompraUtc: string;
  fechaVencimientoUtc: string;
  precio: number;
  moneda: string;
  estado: string;
  entrenador?: { id: string; nombres: string; apellidos: string } | null;
  notas?: string;
}

interface MyPlanData {
  activo: PlanItem | null;
  historial: PlanItem[];
}

const STATE_TO_BADGE: Record<string, StatusKind> = {
  active: 'plan-activo',
  expired: 'plan-vencido',
  cancelled: 'cancelado',
  transferred: 'cancelado',
};

const TIPO_LABEL: Record<string, string> = {
  personalizado: 'Personalizado',
  semipersonalizado: 'Semipersonalizado',
  grupal: 'Grupal',
};

export default function MyPlan() {
  const { data, error, loading } = useApiQuery<MyPlanData>('getMyPlan');

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
          Mi plan
        </h1>

        {loading && <div className="bg-surface border border-line rounded-2xl h-40 animate-pulse" />}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && (
          <>
            {data.activo ? (
              <ActivePlanCard plan={data.activo} />
            ) : (
              <Card padding={28}>
                <div className="text-center">
                  <Icon name="shield" size={32} color="#6B746A" className="mx-auto mb-3" />
                  <h2 className="font-display text-lg font-semibold mb-1.5">
                    No tienes un plan activo
                  </h2>
                  <p className="text-fg-2 text-sm">
                    Pide al equipo de administración o a tu entrenador que te asigne uno.
                  </p>
                </div>
              </Card>
            )}

            {data.historial.filter((p) => p.estado !== 'active').length > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">
                  Historial
                </h2>
                <div className="space-y-3">
                  {data.historial
                    .filter((p) => p.estado !== 'active')
                    .map((p) => (
                      <HistoryRow key={p.id} plan={p} />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ActivePlanCard({ plan }: { plan: PlanItem }) {
  const pct = Math.round(
    (plan.sesionesConsumidas / Math.max(1, plan.sesionesTotales)) * 100
  );
  const dias = Math.ceil(
    (new Date(plan.fechaVencimientoUtc).getTime() - Date.now()) / 86400000
  );
  const badge: StatusKind =
    dias < 0 ? 'plan-vencido' : dias <= 7 ? 'plan-vence' : 'plan-activo';

  return (
    <Card padding={28}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1.5">
            {TIPO_LABEL[plan.tipo] ?? plan.tipo}
          </div>
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">
            {plan.nombre}
          </h2>
          {plan.descripcion && (
            <p className="text-fg-2 text-sm mt-2">{plan.descripcion}</p>
          )}
        </div>
        <StatusBadge kind={badge} />
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="font-display text-3xl font-bold tracking-[-0.03em]">
              {plan.sesionesRestantes}
            </span>
            <span className="text-fg-2 text-sm ml-2">de {plan.sesionesTotales} restantes</span>
          </div>
          <span className="text-fg-3 text-[12px] font-mono">
            {plan.sesionesConsumidas} usadas · {pct}%
          </span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 pt-5 border-t border-line text-sm">
        <Field label="Compra" value={formatShortDate(plan.fechaCompraUtc)} />
        <Field
          label="Vence"
          value={`${formatShortDate(plan.fechaVencimientoUtc)} · ${formatRelative(plan.fechaVencimientoUtc)}`}
        />
        <Field
          label="Precio"
          value={formatMoney(plan.precio, plan.moneda)}
        />
        <Field
          label="Entrenador"
          value={
            plan.entrenador
              ? `${plan.entrenador.nombres} ${plan.entrenador.apellidos}`.trim()
              : '—'
          }
        />
      </dl>

      {plan.notas && (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            Notas
          </div>
          <p className="text-fg-2 text-sm">{plan.notas}</p>
        </div>
      )}
    </Card>
  );
}

function HistoryRow({ plan }: { plan: PlanItem }) {
  return (
    <Card padding={16}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{plan.nombre}</div>
          <div className="text-fg-3 text-[12px] mt-0.5">
            {formatShortDate(plan.fechaCompraUtc)} → {formatShortDate(plan.fechaVencimientoUtc)} ·{' '}
            {plan.sesionesConsumidas}/{plan.sesionesTotales} usadas
          </div>
        </div>
        <StatusBadge kind={STATE_TO_BADGE[plan.estado] ?? 'cancelado'} />
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
        {label}
      </dt>
      <dd className="text-fg mt-0.5">{value}</dd>
    </div>
  );
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency || config.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
