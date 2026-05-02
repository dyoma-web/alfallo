import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { PlanFormModal } from '../components/admin/PlanFormModal';
import { AssignPlanModal } from '../components/admin/AssignPlanModal';
import { config } from '../lib/config';

interface PlanCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  num_sesiones: number | string;
  precio: number | string;
  moneda?: string;
  vigencia_dias: number | string;
  estado?: string;
  entrenador?: { id: string; nombres: string; apellidos: string } | null;
  sede?: { id: string; nombre: string } | null;
}

const TIPO_LABEL: Record<string, string> = {
  personalizado: 'Personalizado',
  semipersonalizado: 'Semipersonalizado',
  grupal: 'Grupal',
};

export default function AdminPlanes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanCatalogo | null>(null);
  const [assigningPlanId, setAssigningPlanId] = useState<string | null>(null);

  const { data, error, loading, refetch } = useApiQuery<PlanCatalogo[]>(
    'adminListPlanesCatalogo'
  );
  const update = useApiMutation('adminUpdatePlanCatalogo');

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setShowCreate(true);
      const next = new URLSearchParams(searchParams);
      next.delete('nuevo');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleArchive(id: string) {
    if (!window.confirm('¿Archivar este plan? Los planes ya asignados a usuarios siguen activos.')) return;
    try {
      await update.mutate({ planId: id, estado: 'archived' });
      void refetch();
    } catch { /* error */ }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              Planes
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              Catálogo de plantillas. Asigna desde aquí o desde el detalle del usuario.
            </p>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setAssigningPlanId('')}>
              Asignar a usuario
            </Btn>
            <Btn icon="plus" onClick={() => setShowCreate(true)}>
              Nuevo plan
            </Btn>
          </div>
        </div>

        {loading && (
          <div className="bg-surface border border-line rounded-2xl h-32 animate-pulse" />
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && data.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="shield" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">El catálogo está vacío.</p>
              <Btn icon="plus" onClick={() => setShowCreate(true)}>
                Crear primer plan
              </Btn>
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((p) => (
              <PlanRow
                key={p.id}
                plan={p}
                onEdit={() => setEditingPlan(p)}
                onAssign={() => setAssigningPlanId(p.id)}
                onArchive={() => handleArchive(p.id)}
                busy={update.loading}
              />
            ))}
          </ul>
        )}
      </div>

      <PlanFormModal
        open={showCreate || !!editingPlan}
        initialPlan={editingPlan}
        onClose={() => {
          setShowCreate(false);
          setEditingPlan(null);
        }}
        onSaved={() => {
          setShowCreate(false);
          setEditingPlan(null);
          void refetch();
        }}
      />

      <AssignPlanModal
        open={assigningPlanId !== null}
        preselectedPlanId={assigningPlanId ?? undefined}
        onClose={() => setAssigningPlanId(null)}
        onAssigned={() => setAssigningPlanId(null)}
      />
    </AppShell>
  );
}

function PlanRow({
  plan,
  onEdit,
  onAssign,
  onArchive,
  busy,
}: {
  plan: PlanCatalogo;
  onEdit: () => void;
  onAssign: () => void;
  onArchive: () => void;
  busy: boolean;
}) {
  const isArchived = plan.estado === 'archived';
  return (
    <li>
      <Card padding={16}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-none">
            <Icon name="shield" size={18} color="#C8FF3D" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{plan.nombre}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3">
                {TIPO_LABEL[plan.tipo] ?? plan.tipo}
              </span>
            </div>
            {plan.descripcion && (
              <p className="text-fg-2 text-[12px] mt-0.5 line-clamp-1">{plan.descripcion}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[12px] text-fg-2">
              <span>{plan.num_sesiones} sesiones</span>
              <span>·</span>
              <span>vigencia {plan.vigencia_dias} días</span>
              <span>·</span>
              <span className="font-medium text-fg">
                {formatMoney(Number(plan.precio), plan.moneda || 'COP')}
              </span>
            </div>
            {(plan.entrenador || plan.sede) && (
              <div className="text-fg-3 text-[11px] mt-1">
                {plan.entrenador && (
                  <span>Titular: {plan.entrenador.nombres} {plan.entrenador.apellidos}</span>
                )}
                {plan.entrenador && plan.sede && ' · '}
                {plan.sede && <span>Sede: {plan.sede.nombre}</span>}
              </div>
            )}
          </div>

          <StatusBadge
            kind={isArchived ? 'cancelado' : 'plan-activo'}
            label={isArchived ? 'Archivado' : 'Activo'}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Btn>
          {!isArchived && (
            <>
              <Btn variant="outline" size="sm" onClick={onAssign} disabled={busy}>
                Asignar a usuario
              </Btn>
              <Btn variant="ghost" size="sm" onClick={onArchive} disabled={busy}>
                Archivar
              </Btn>
            </>
          )}
        </div>
      </Card>
    </li>
  );
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}
