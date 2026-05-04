import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { GimnasioFormModal } from '../components/admin/GimnasioFormModal';
import { DetailModal, type DetailSection } from '../components/DetailModal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

interface Gimnasio {
  id: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  pais?: string;
  verificado?: boolean | string;
  estado?: string;
  sedesCount?: number;
}

export default function AdminGimnasios() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Gimnasio | null>(null);
  const [viewing, setViewing] = useState<Gimnasio | null>(null);
  const { data, error, loading, refetch } = useApiQuery<Gimnasio[]>('adminListGimnasios');
  const update = useApiMutation('adminUpdateGimnasio');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

  async function archive(id: string) {
    const ok = await confirm({
      title: 'Archivar gimnasio',
      message: 'Las sedes asociadas se mantienen activas. El gimnasio dejará de aparecer en listados nuevos.',
      confirmLabel: 'Archivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await update.mutate({ gimnasioId: id, estado: 'archived' });
      toast({ title: 'Gimnasio archivado', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo archivar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }
  async function reactivate(id: string) {
    try {
      await update.mutate({ gimnasioId: id, estado: 'active' });
      toast({ title: 'Gimnasio reactivado', tone: 'success' });
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
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              Gimnasios
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              Cadenas o marcas que agrupan varias sedes.
            </p>
          </div>
          <Btn icon="plus" onClick={() => setShowCreate(true)}>Nuevo gimnasio</Btn>
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
              <Icon name="building" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">
                Sin gimnasios todavía. Las sedes pueden existir sin gimnasio (independientes).
              </p>
              <Btn icon="plus" onClick={() => setShowCreate(true)}>Crear primero</Btn>
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((g) => (
              <GimnasioRow
                key={g.id}
                gym={g}
                onView={() => setViewing(g)}
                onEdit={() => setEditing(g)}
                onArchive={() => archive(g.id)}
                onReactivate={() => reactivate(g.id)}
                busy={update.loading}
              />
            ))}
          </ul>
        )}
      </div>

      <GimnasioFormModal
        open={showCreate || !!editing}
        initialGym={editing}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        onSaved={() => { setShowCreate(false); setEditing(null); void refetch(); }}
      />

      <GimnasioDetailModal
        gym={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(viewing); setViewing(null); }}
      />

      {confirmDialog}
    </AppShell>
  );
}

function GimnasioDetailModal({
  gym,
  onClose,
  onEdit,
}: {
  gym: Gimnasio | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!gym) return null;
  const isArchived = gym.estado === 'archived';
  const verificado = gym.verificado === true || gym.verificado === 'TRUE';

  const sections: DetailSection[] = [
    {
      title: 'Información',
      fields: [
        { label: 'Nombre', value: gym.nombre },
        { label: 'País', value: gym.pais ?? '' },
        {
          label: 'Sedes registradas',
          value: `${gym.sedesCount ?? 0} sede${gym.sedesCount === 1 ? '' : 's'}`,
        },
        {
          label: 'Marca verificada',
          value: verificado
            ? 'Sí · el dueño legal de la marca confirmó el registro'
            : 'No verificada',
        },
      ],
    },
  ];

  if (gym.descripcion) {
    sections.unshift({
      fields: [{ label: 'Descripción', value: gym.descripcion, fullWidth: true }],
    });
  }

  if (gym.logo_url) {
    sections.push({
      title: 'Logo',
      fields: [
        {
          label: 'URL',
          value: (
            <a
              href={gym.logo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline break-all"
            >
              {gym.logo_url}
            </a>
          ),
          fullWidth: true,
        },
      ],
    });
  }

  return (
    <DetailModal
      open
      onClose={onClose}
      title={gym.nombre}
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
          <Btn onClick={onEdit}>Editar</Btn>
        </>
      }
    />
  );
}

function GimnasioRow({
  gym,
  onView,
  onEdit,
  onArchive,
  onReactivate,
  busy,
}: {
  gym: Gimnasio;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  busy: boolean;
}) {
  const isArchived = gym.estado === 'archived';
  const verificado = gym.verificado === true || gym.verificado === 'TRUE';

  return (
    <li>
      <Card padding={0}>
        <button
          type="button"
          onClick={onView}
          className="w-full text-left p-4 rounded-t-2xl hover:bg-surface-2/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label={`Ver detalle de ${gym.nombre}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center flex-none">
              {gym.logo_url ? (
                <img src={gym.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Icon name="building" size={18} color="#A8B0A4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{gym.nombre}</span>
                {verificado && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30"
                    title="Marca verificada por su dueño"
                  >
                    ✓ verificado
                  </span>
                )}
                {gym.pais && (
                  <span className="text-fg-3 text-[12px]">{gym.pais}</span>
                )}
              </div>
              {gym.descripcion && (
                <p className="text-fg-2 text-[12px] mt-0.5 line-clamp-1">{gym.descripcion}</p>
              )}
              <div className="text-[11px] text-fg-3 mt-1">
                {gym.sedesCount ?? 0} sede{gym.sedesCount === 1 ? '' : 's'}
              </div>
            </div>

            <StatusBadge
              kind={isArchived ? 'cancelado' : 'plan-activo'}
              label={isArchived ? 'Archivado' : 'Activo'}
            />
          </div>
        </button>

        <div className="flex gap-2 px-4 pb-4 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>Editar</Btn>
          {isArchived ? (
            <Btn variant="outline" size="sm" onClick={onReactivate} disabled={busy}>Reactivar</Btn>
          ) : (
            <Btn variant="ghost" size="sm" onClick={onArchive} disabled={busy}>Archivar</Btn>
          )}
        </div>
      </Card>
    </li>
  );
}
