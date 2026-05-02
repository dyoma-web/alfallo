import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { SedeFormModal } from '../components/admin/SedeFormModal';

interface Sede {
  id: string;
  nombre: string;
  codigo_interno?: string;
  direccion?: string;
  ciudad?: string;
  capacidad?: number | string;
  estado?: string;
  trainersCount?: number;
  usuariosCount?: number;
}

export default function AdminSedes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Sede[]>('adminListSedes');
  const update = useApiMutation('adminUpdateSede');

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
    if (!window.confirm('¿Archivar esta sede? Los entrenadores y usuarios quedan asignados al historial.')) return;
    try {
      await update.mutate({ sedeId: id, estado: 'archived' });
      void refetch();
    } catch { /* error */ }
  }

  async function handleReactivate(id: string) {
    try {
      await update.mutate({ sedeId: id, estado: 'active' });
      void refetch();
    } catch { /* error */ }
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
    </AppShell>
  );
}

function SedeRow({
  sede,
  onEdit,
  onArchive,
  onReactivate,
  busy,
}: {
  sede: Sede;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  busy: boolean;
}) {
  const isArchived = sede.estado === 'archived';
  return (
    <li>
      <Card padding={16}>
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
