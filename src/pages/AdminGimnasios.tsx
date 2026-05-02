import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { GimnasioFormModal } from '../components/admin/GimnasioFormModal';

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
  const { data, error, loading, refetch } = useApiQuery<Gimnasio[]>('adminListGimnasios');
  const update = useApiMutation('adminUpdateGimnasio');

  async function archive(id: string) {
    if (!window.confirm('¿Archivar este gimnasio? Las sedes asociadas se mantienen.')) return;
    try {
      await update.mutate({ gimnasioId: id, estado: 'archived' });
      void refetch();
    } catch { /* */ }
  }
  async function reactivate(id: string) {
    try {
      await update.mutate({ gimnasioId: id, estado: 'active' });
      void refetch();
    } catch { /* */ }
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
    </AppShell>
  );
}

function GimnasioRow({
  gym,
  onEdit,
  onArchive,
  onReactivate,
  busy,
}: {
  gym: Gimnasio;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  busy: boolean;
}) {
  const isArchived = gym.estado === 'archived';
  const verificado = gym.verificado === true || gym.verificado === 'TRUE';

  return (
    <li>
      <Card padding={16}>
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

        <div className="flex gap-2 mt-3 pt-3 border-t border-line">
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
