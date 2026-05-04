import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';
import { GrupoFormModal } from '../components/GrupoFormModal';
import { Modal } from '../components/Modal';
import { DetailModal, type DetailSection } from '../components/DetailModal';

interface Member {
  id: string;
  user_id: string;
  fecha_ingreso_utc: string;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    nick?: string;
  } | null;
}

interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  entrenador_id: string;
  sede_id?: string;
  tipo: 'semipersonalizado' | 'grupal';
  capacidad_max: number | string;
  color: string;
  estado: string;
  entrenador?: { id: string; nombres: string; apellidos: string } | null;
  miembros: Member[];
  miembrosCount: number;
}

export default function Grupos() {
  const role = useSession((s) => s.role);
  const isClient = role === 'client';

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Grupo | null>(null);
  const [viewing, setViewing] = useState<Grupo | null>(null);
  const [managingMembers, setManagingMembers] = useState<Grupo | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Grupo[]>('listGrupos');

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              Grupos
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              {isClient
                ? 'Grupos a los que perteneces.'
                : 'Grupos de entrenamiento. Cada uno tiene un color que pinta los agendamientos de sus miembros.'}
            </p>
          </div>
          {!isClient && (
            <Btn icon="plus" onClick={() => setShowCreate(true)}>Nuevo grupo</Btn>
          )}
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
              <Icon name="group" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">
                {isClient
                  ? 'No perteneces a ningún grupo todavía.'
                  : 'Crea tu primer grupo para empezar a clasificar tus clientes.'}
              </p>
              {!isClient && (
                <Btn icon="plus" onClick={() => setShowCreate(true)}>Crear primer grupo</Btn>
              )}
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((g) => (
              <GrupoRow
                key={g.id}
                grupo={g}
                isClient={isClient}
                onView={() => setViewing(g)}
                onEdit={() => setEditing(g)}
                onManage={() => setManagingMembers(g)}
              />
            ))}
          </ul>
        )}
      </div>

      {!isClient && (
        <GrupoFormModal
          open={showCreate || !!editing}
          initialGrupo={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); void refetch(); }}
        />
      )}

      {managingMembers && (
        <ManageMembersModal
          grupo={managingMembers}
          onClose={() => setManagingMembers(null)}
          onChanged={() => { void refetch(); }}
        />
      )}

      <GrupoDetailModal
        grupo={viewing}
        isClient={isClient}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(viewing); setViewing(null); }}
        onManage={() => { setManagingMembers(viewing); setViewing(null); }}
      />
    </AppShell>
  );
}

function GrupoDetailModal({
  grupo,
  isClient,
  onClose,
  onEdit,
  onManage,
}: {
  grupo: Grupo | null;
  isClient: boolean;
  onClose: () => void;
  onEdit: () => void;
  onManage: () => void;
}) {
  if (!grupo) return null;
  const cap = Number(grupo.capacidad_max) || 0;
  const capText = cap > 0
    ? `${grupo.miembrosCount}/${cap} miembros`
    : `${grupo.miembrosCount} miembro${grupo.miembrosCount === 1 ? '' : 's'} · sin límite de capacidad`;

  const sections: DetailSection[] = [
    {
      title: 'Información',
      fields: [
        { label: 'Tipo', value: grupo.tipo },
        { label: 'Capacidad', value: capText },
        {
          label: 'Color',
          value: (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded-full border border-line-2"
                style={{ background: grupo.color }}
                aria-hidden
              />
              <span className="font-mono text-[12px]">{grupo.color}</span>
            </span>
          ),
        },
        {
          label: 'Entrenador titular',
          value: grupo.entrenador
            ? `${grupo.entrenador.nombres} ${grupo.entrenador.apellidos}`.trim()
            : '',
        },
      ],
    },
  ];

  if (grupo.descripcion) {
    sections.unshift({
      fields: [{ label: 'Descripción', value: grupo.descripcion, fullWidth: true }],
    });
  }

  // Lista compacta de miembros (primeros 5)
  const memberPreview = grupo.miembros.slice(0, 5);
  const more = grupo.miembros.length - memberPreview.length;

  return (
    <DetailModal
      open
      onClose={onClose}
      title={grupo.nombre}
      sections={sections}
      actions={
        <>
          <Btn variant="secondary" full onClick={onClose}>Cerrar</Btn>
          {!isClient && (
            <>
              <Btn variant="outline" onClick={onManage}>Miembros</Btn>
              <Btn onClick={onEdit}>Editar</Btn>
            </>
          )}
        </>
      }
    >
      {memberPreview.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
            Miembros {grupo.miembros.length > 0 && `(${grupo.miembros.length})`}
          </h3>
          <ul className="space-y-1.5">
            {memberPreview.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-none text-[10px] font-bold"
                  style={{ color: '#0B1208' }}
                  aria-hidden
                >
                  {(m.usuario?.nombres?.charAt(0) ?? '').toUpperCase()}
                  {(m.usuario?.apellidos?.charAt(0) ?? '').toUpperCase()}
                </span>
                <span className="text-fg-2">
                  {m.usuario ? `${m.usuario.nombres} ${m.usuario.apellidos}` : '—'}
                </span>
              </li>
            ))}
            {more > 0 && (
              <li className="text-fg-3 text-[12px] pl-9">
                y {more} más…
              </li>
            )}
          </ul>
        </section>
      )}
    </DetailModal>
  );
}

function GrupoRow({
  grupo,
  isClient,
  onView,
  onEdit,
  onManage,
}: {
  grupo: Grupo;
  isClient: boolean;
  onView: () => void;
  onEdit: () => void;
  onManage: () => void;
}) {
  return (
    <li>
      <Card padding={0}>
        <button
          type="button"
          onClick={onView}
          className="w-full text-left p-4 rounded-t-2xl hover:bg-surface-2/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label={`Ver detalle de ${grupo.nombre}`}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex-none border-2"
              style={{
                background: hexWithAlpha(grupo.color, 0.2),
                borderColor: hexWithAlpha(grupo.color, 0.6),
              }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{grupo.nombre}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-fg-3">
                  {grupo.tipo}
                </span>
              </div>
              {grupo.descripcion && (
                <p className="text-fg-2 text-[12px] mt-0.5 line-clamp-1">{grupo.descripcion}</p>
              )}
              <div className="text-fg-3 text-[12px] mt-1">
                {Number(grupo.capacidad_max) > 0
                  ? `${grupo.miembrosCount}/${grupo.capacidad_max} miembros`
                  : `${grupo.miembrosCount} miembro${grupo.miembrosCount === 1 ? '' : 's'} · sin límite`}
                {grupo.entrenador && (
                  <span> · {grupo.entrenador.nombres} {grupo.entrenador.apellidos}</span>
                )}
              </div>
            </div>
          </div>
        </button>

        {!isClient && (
          <div className="flex gap-2 px-4 pb-4 pt-3 border-t border-line">
            <Btn variant="secondary" size="sm" onClick={onManage}>
              Miembros ({grupo.miembrosCount})
            </Btn>
            <Btn variant="outline" size="sm" onClick={onEdit}>Editar</Btn>
          </div>
        )}
      </Card>
    </li>
  );
}

interface UserOption {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

function ManageMembersModal({
  grupo,
  onClose,
  onChanged,
}: {
  grupo: Grupo;
  onClose: () => void;
  onChanged: () => void;
}) {
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: members, refetch } = useApiQuery<Member[]>(
    'listGrupoMembers',
    { grupoId: grupo.id }
  );

  const { data: trainerUsers } = useApiQuery<UserOption[]>(
    'listMyUsers',
    {},
    { enabled: !isAdmin }
  );
  // Sin filtro de estado: incluye pending/active. Los pending también pueden
  // pertenecer a un grupo aunque todavía no hayan activado su cuenta.
  const { data: allClients } = useApiQuery<UserOption[]>(
    'adminListUsers',
    { rol: 'client' },
    { enabled: isAdmin }
  );

  const candidates = isAdmin ? allClients : trainerUsers;

  const addMember = useApiMutation('addGrupoMember');
  const removeMember = useApiMutation('removeGrupoMember');

  // Filtrar candidatos: que NO sean ya miembros activos
  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  const filteredCandidates = (candidates ?? []).filter((u) => !memberIds.has(u.id));

  async function handleAdd() {
    if (!selectedUserId) return;
    try {
      await addMember.mutate({ grupoId: grupo.id, userId: selectedUserId });
      setSelectedUserId('');
      void refetch();
      onChanged();
    } catch { /* error */ }
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm('¿Quitar este miembro del grupo?')) return;
    try {
      await removeMember.mutate({ memberId });
      void refetch();
      onChanged();
    } catch { /* */ }
  }

  return (
    <Modal open onClose={onClose} title={`Miembros · ${grupo.nombre}`} size="lg">
      <div className="px-5 py-5 space-y-4">
        {/* Add member */}
        {(Number(grupo.capacidad_max) === 0 || (members?.length ?? 0) < Number(grupo.capacidad_max)) && (
          <div className="bg-surface-2 border border-line rounded-xl p-3">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Agregar cliente
            </div>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg bg-surface border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
              >
                <option value="">— Elige cliente —</option>
                {filteredCandidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombres} {u.apellidos}
                  </option>
                ))}
              </select>
              <Btn
                size="sm"
                onClick={handleAdd}
                disabled={!selectedUserId || addMember.loading}
              >
                Agregar
              </Btn>
            </div>
            {addMember.error && (
              <p className="text-err-fg text-[12px] mt-2">{addMember.error.message}</p>
            )}
          </div>
        )}

        {/* Members list */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Miembros ({members?.length ?? 0}{Number(grupo.capacidad_max) > 0 ? `/${grupo.capacidad_max}` : ''})
          </div>
          {!members || members.length === 0 ? (
            <p className="text-fg-2 text-sm py-3 text-center">Sin miembros todavía.</p>
          ) : (
            <ul className="space-y-1.5">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 bg-surface-2 border border-line rounded-xl p-2.5"
                >
                  <div
                    className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-none"
                    aria-hidden
                  >
                    <span className="font-display text-[10px] font-bold" style={{ color: '#0B1208' }}>
                      {(m.usuario?.nombres?.charAt(0) ?? '').toUpperCase()}
                      {(m.usuario?.apellidos?.charAt(0) ?? '').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      {m.usuario?.nombres} {m.usuario?.apellidos}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    disabled={removeMember.loading}
                    className="text-[12px] text-fg-3 hover:text-err-fg disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Btn full variant="secondary" onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = String(hex || '#C8FF3D').replace('#', '');
  if (h.length !== 6) return `rgba(200,255,61,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
