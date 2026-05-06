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
import { DetailModal, type DetailSection } from '../components/DetailModal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { config } from '../lib/config';
import { useSession } from '../lib/store/session';

interface PlanCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  num_sesiones: number | string;
  precio: number | string;
  moneda?: string;
  vigencia_dias: number | string;
  cupos_max_simultaneos?: number | string;
  cupos_estricto?: boolean | string;
  alcance?: string;
  owner?: { id: string; nombres: string; apellidos: string } | null;
  gimnasio?: { id: string; nombre: string } | null;
  area_profesional?: string;
  categoria_profesional?: string;
  precio_version?: number | string;
  estado?: string;
  entrenador?: { id: string; nombres: string; apellidos: string } | null;
  sede?: { id: string; nombre: string } | null;
}

const TIPO_LABEL: Record<string, string> = {
  personalizado: 'Personalizado',
  semipersonalizado: 'Semipersonalizado',
  grupal: 'Grupal',
};

const AREA_LABEL: Record<string, string> = {
  entrenamiento: 'Area de entrenamiento',
  medica: 'Area medica',
  otra: 'Otra area',
};

const CATEGORY_LABEL: Record<string, string> = {
  entrenador_personalizado: 'Entrenamiento personalizado',
  profesor_grupal: 'Clases grupales',
  nutricionista: 'Nutricion',
  fisio: 'Fisioterapia',
  evaluador: 'Evaluacion medica',
  otro: 'Otra categoria',
};

export default function AdminPlanes() {
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanCatalogo | null>(null);
  const [viewingPlan, setViewingPlan] = useState<PlanCatalogo | null>(null);
  const [assigningPlanId, setAssigningPlanId] = useState<string | null>(null);

  const { data, error, loading, refetch } = useApiQuery<PlanCatalogo[]>(
    'adminListPlanesCatalogo'
  );
  const update = useApiMutation('adminUpdatePlanCatalogo');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

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
    const ok = await confirm({
      title: 'Archivar plan',
      message: 'Los planes ya asignados a usuarios siguen activos. Solo se oculta del catálogo.',
      confirmLabel: 'Archivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await update.mutate({ planId: id, estado: 'archived' });
      toast({ title: 'Plan archivado', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo archivar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
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
              {isAdmin
                ? 'Catalogo global por gimnasio y planes personalizados de profesionales.'
                : 'Catalogo global disponible y tus planes personalizados.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Btn variant="secondary" onClick={() => setAssigningPlanId('')}>
                Asignar a usuario
              </Btn>
            )}
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
                onView={() => setViewingPlan(p)}
                onEdit={() => setEditingPlan(p)}
                onAssign={() => setAssigningPlanId(p.id)}
                onArchive={() => handleArchive(p.id)}
                busy={update.loading}
                canAssign={isAdmin}
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

      <PlanDetailModal
        plan={viewingPlan}
        onClose={() => setViewingPlan(null)}
        onEdit={() => {
          setEditingPlan(viewingPlan);
          setViewingPlan(null);
        }}
        onAssign={() => {
          if (viewingPlan) setAssigningPlanId(viewingPlan.id);
          setViewingPlan(null);
        }}
        canAssign={isAdmin}
      />

      {isAdmin && (
        <AssignPlanModal
          open={assigningPlanId !== null}
          preselectedPlanId={assigningPlanId ?? undefined}
          onClose={() => setAssigningPlanId(null)}
          onAssigned={() => setAssigningPlanId(null)}
        />
      )}

      {confirmDialog}
    </AppShell>
  );
}

function PlanDetailModal({
  plan,
  onClose,
  onEdit,
  onAssign,
  canAssign,
}: {
  plan: PlanCatalogo | null;
  onClose: () => void;
  onEdit: () => void;
  onAssign: () => void;
  canAssign: boolean;
}) {
  if (!plan) return null;
  const isArchived = plan.estado === 'archived';
  const cupos = plan.cupos_max_simultaneos ? Number(plan.cupos_max_simultaneos) : null;
  const estricto = plan.cupos_estricto === true || plan.cupos_estricto === 'TRUE';
  const defaultsByTipo: Record<string, number> = { personalizado: 1, semipersonalizado: 5, grupal: 15 };

  const sections: DetailSection[] = [
    {
      title: 'Detalles del plan',
      fields: [
        { label: 'Tipo', value: TIPO_LABEL[plan.tipo] ?? plan.tipo },
        { label: 'Sesiones', value: String(plan.num_sesiones) },
        { label: 'Vigencia', value: `${plan.vigencia_dias} días` },
        { label: 'Precio', value: formatMoney(Number(plan.precio), plan.moneda || 'COP') },
        { label: 'Alcance', value: plan.alcance === 'personalizado' ? 'Personalizado' : 'Global' },
        { label: 'Version precio', value: String(plan.precio_version || 1) },
      ],
    },
    {
      title: 'Categoria operativa',
      fields: [
        { label: 'Area', value: AREA_LABEL[plan.area_profesional || ''] ?? 'Sin area' },
        { label: 'Categoria', value: CATEGORY_LABEL[plan.categoria_profesional || ''] ?? 'Sin categoria' },
        { label: 'Gimnasio', value: plan.gimnasio ? plan.gimnasio.nombre : 'Sin gimnasio' },
      ],
    },
    {
      title: 'Cupos por franja',
      description: 'Cuántos clientes pueden agendar al mismo tiempo con este plan.',
      fields: [
        {
          label: 'Máx simultáneos',
          value: cupos ?? `${defaultsByTipo[plan.tipo] ?? 1} (default por tipo)`,
        },
        {
          label: 'Tipo de cupo',
          value: estricto
            ? 'Estricto · rechaza si está lleno'
            : 'Flexible · permite solicitud, requiere autorización',
        },
      ],
    },
    {
      title: 'Asignación',
      fields: [
        {
          label: 'Entrenador titular',
          value: plan.entrenador
            ? `${plan.entrenador.nombres} ${plan.entrenador.apellidos}`.trim()
            : 'Plan de la plataforma (sin titular)',
        },
        {
          label: 'Sede default',
          value: plan.sede ? plan.sede.nombre : 'Cualquier sede',
        },
      ],
    },
  ];

  if (plan.descripcion) {
    sections.unshift({
      fields: [{ label: 'Descripción', value: plan.descripcion, fullWidth: true }],
    });
  }

  return (
    <DetailModal
      open
      onClose={onClose}
      title={plan.nombre}
      badge={
        <StatusBadge
          kind={isArchived ? 'cancelado' : 'plan-activo'}
          label={isArchived ? 'Archivado' : 'Activo'}
        />
      }
      sections={sections}
      actions={
        <>
          <Btn variant="secondary" full onClick={onClose}>Cerrar</Btn>
          {!isArchived && canAssign && (
            <Btn variant="outline" onClick={onAssign}>Asignar a usuario</Btn>
          )}
          <Btn onClick={onEdit}>Editar</Btn>
        </>
      }
    />
  );
}

function PlanRow({
  plan,
  onView,
  onEdit,
  onAssign,
  onArchive,
  busy,
  canAssign,
}: {
  plan: PlanCatalogo;
  onView: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onArchive: () => void;
  busy: boolean;
  canAssign: boolean;
}) {
  const isArchived = plan.estado === 'archived';
  return (
    <li>
      <Card padding={0}>
        {/* Área clickeable que abre detalle. Los botones del footer
            se mantienen como acciones explícitas. */}
        <button
          type="button"
          onClick={onView}
          className="w-full text-left p-4 rounded-t-2xl hover:bg-surface-2/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label={`Ver detalle de ${plan.nombre}`}
        >
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
        </button>

        <div className="flex flex-wrap gap-2 px-4 pb-4 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Btn>
          {!isArchived && (
            <>
              {canAssign && (
                <Btn variant="outline" size="sm" onClick={onAssign} disabled={busy}>
                  Asignar a usuario
                </Btn>
              )}
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
