import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { SedeFormModal } from '../components/admin/SedeFormModal';
import { DetailModal, type DetailSection } from '../components/DetailModal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

interface Sede {
  id: string;
  nombre: string;
  codigo_interno?: string;
  direccion?: string;
  ciudad?: string;
  barrio?: string;
  telefono?: string;
  responsable?: string;
  capacidad?: number | string;
  observaciones?: string;
  servicios?: string;
  reglas?: string;
  gimnasio_id?: string;
  gimnasio?: { id: string; nombre: string } | null;
  estado?: string;
  trainersCount?: number;
  usuariosCount?: number;
}

export default function AdminSedes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [viewing, setViewing] = useState<Sede | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Sede[]>('adminListSedes');
  const update = useApiMutation('adminUpdateSede');
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
      title: 'Archivar sede',
      message: 'Los entrenadores y usuarios quedan asignados al historial. La sede dejará de aparecer en agendamiento.',
      confirmLabel: 'Archivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await update.mutate({ sedeId: id, estado: 'archived' });
      toast({ title: 'Sede archivada', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo archivar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  async function handleReactivate(id: string) {
    try {
      await update.mutate({ sedeId: id, estado: 'active' });
      toast({ title: 'Sede reactivada', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo reactivar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Sedes
          </h1>
          <Btn icon="plus" onClick={() => setShowCreate(true)}>
            Nueva sede
          </Btn>
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
              <Icon name="building" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">No hay sedes registradas todavía.</p>
              <Btn icon="plus" onClick={() => setShowCreate(true)}>
                Crear la primera sede
              </Btn>
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((s) => (
              <SedeRow
                key={s.id}
                sede={s}
                onView={() => setViewing(s)}
                onEdit={() => setEditingSede(s)}
                onArchive={() => handleArchive(s.id)}
                onReactivate={() => handleReactivate(s.id)}
                busy={update.loading}
              />
            ))}
          </ul>
        )}
      </div>

      <SedeFormModal
        open={showCreate || !!editingSede}
        initialSede={editingSede}
        onClose={() => {
          setShowCreate(false);
          setEditingSede(null);
        }}
        onSaved={() => {
          setShowCreate(false);
          setEditingSede(null);
          void refetch();
        }}
      />

      <SedeDetailModal
        sede={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditingSede(viewing); setViewing(null); }}
      />

      {confirmDialog}
    </AppShell>
  );
}

function SedeDetailModal({
  sede,
  onClose,
  onEdit,
}: {
  sede: Sede | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!sede) return null;
  const isArchived = sede.estado === 'archived';

  const ubicacionField =
    sede.direccion || sede.ciudad || sede.barrio
      ? [sede.direccion, sede.barrio, sede.ciudad].filter(Boolean).join(' · ')
      : '';

  const sections: DetailSection[] = [
    {
      title: 'Información',
      fields: [
        { label: 'Nombre', value: sede.nombre },
        { label: 'Código interno', value: sede.codigo_interno ?? '' },
        { label: 'Gimnasio', value: sede.gimnasio?.nombre ?? 'Sede independiente' },
        { label: 'Ubicación', value: ubicacionField, fullWidth: true },
        { label: 'Teléfono', value: sede.telefono ?? '' },
        { label: 'Responsable', value: sede.responsable ?? '' },
        { label: 'Capacidad', value: sede.capacidad ? `${sede.capacidad} personas simultáneas` : '' },
      ],
    },
    {
      title: 'Asignaciones activas',
      fields: [
        {
          label: 'Entrenadores',
          value: `${sede.trainersCount ?? 0} entrenador${sede.trainersCount === 1 ? '' : 'es'}`,
        },
        {
          label: 'Usuarios',
          value: `${sede.usuariosCount ?? 0} usuario${sede.usuariosCount === 1 ? '' : 's'}`,
        },
      ],
    },
  ];

  if (sede.servicios) {
    const services = String(sede.servicios)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (services.length > 0) {
      sections.push({
        title: 'Servicios',
        fields: [
          {
            label: 'Disponibles',
            value: (
              <div className="flex flex-wrap gap-1">
                {services.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-line text-fg-2"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ),
            fullWidth: true,
          },
        ],
      });
    }
  }

  if (sede.reglas) {
    sections.push({
      fields: [{ label: 'Reglas operativas', value: sede.reglas, fullWidth: true }],
    });
  }

  if (sede.observaciones) {
    sections.push({
      fields: [{ label: 'Observaciones internas', value: sede.observaciones, fullWidth: true }],
    });
  }

  return (
    <DetailModal
      open
      onClose={onClose}
      title={sede.nombre}
      badge={
        <StatusBadge
          kind={isArchived ? 'cancelado' : 'plan-activo'}
          label={isArchived ? 'Archivada' : 'Activa'}
        />
      }
      sections={sections}
      actions={
        <>
          <Btn variant="secondary" full onClick={onClose}>Cerrar</Btn>
          <Btn onClick={onEdit}>Editar</Btn>
        </>
      }
    />
  );
}

function SedeRow({
  sede,
  onView,
  onEdit,
  onArchive,
  onReactivate,
  busy,
}: {
  sede: Sede;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  busy: boolean;
}) {
  const isArchived = sede.estado === 'archived';
  return (
    <li>
      <Card padding={16}>
        <button
          type="button"
          onClick={onView}
          className="w-full text-left -m-1 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={`Ver detalle de ${sede.nombre}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center flex-none">
              <Icon name="building" size={18} color="#A8B0A4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{sede.nombre}</span>
                {sede.codigo_interno && (
                  <span className="text-fg-3 text-[12px] font-mono">{sede.codigo_interno}</span>
                )}
                {sede.gimnasio?.nombre && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                    {sede.gimnasio.nombre}
                  </span>
                )}
              </div>
              {sede.direccion && (
                <div className="text-fg-2 text-[12px] mt-0.5 flex items-center gap-1">
                  <Icon name="mapPin" size={11} color="currentColor" />
                  {sede.direccion}{sede.ciudad ? ` · ${sede.ciudad}` : ''}
                </div>
              )}
              <div className="flex gap-3 mt-1 text-[11px] text-fg-3">
                <span>{sede.trainersCount ?? 0} entrenadores</span>
                <span>·</span>
                <span>{sede.usuariosCount ?? 0} usuarios</span>
                {sede.capacidad && (
                  <>
                    <span>·</span>
                    <span>cap. {sede.capacidad}</span>
                  </>
                )}
              </div>
            </div>

            <StatusBadge
              kind={isArchived ? 'cancelado' : 'plan-activo'}
              label={isArchived ? 'Archivada' : 'Activa'}
            />
          </div>
        </button>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Btn>
          {isArchived ? (
            <Btn variant="outline" size="sm" onClick={onReactivate} disabled={busy}>
              Reactivar
            </Btn>
          ) : (
            <Btn variant="ghost" size="sm" onClick={onArchive} disabled={busy}>
              Archivar
            </Btn>
          )}
        </div>
      </Card>
    </li>
  );
}
