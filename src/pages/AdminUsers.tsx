import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { UserFormModal } from '../components/admin/UserFormModal';
import { formatRelative } from '../lib/datetime';

interface UserListItem {
  id: string;
  email: string;
  rol: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  cedula?: string;
  celular?: string;
  estado: string;
  entrenador_asignado_id?: string;
  last_login_at?: string;
  hasTrainerProfile?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  trainer: 'Entrenador',
  client: 'Cliente',
};

const ESTADO_BADGE: Record<string, StatusKind> = {
  active: 'plan-activo',
  pending: 'pendiente',
  suspended: 'plan-vencido',
  archived: 'cancelado',
};

const ESTADO_LABEL: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  suspended: 'Suspendido',
  archived: 'Archivado',
};

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const suspend = useApiMutation('adminSuspendUser');
  const reactivate = useApiMutation('adminReactivateUser');
  const resend = useApiMutation<{ activationLink: string }>('adminResendActivation');
  const [resentLink, setResentLink] = useState<string | null>(null);

  const { data, error, loading, refetch } = useApiQuery<UserListItem[]>(
    'adminListUsers',
    { rol: filterRole || undefined, estado: filterEstado || undefined },
    { deps: [filterRole, filterEstado] }
  );

  // Si llega con ?nuevo=1, abrir modal de crear
  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setShowCreate(true);
      const next = new URLSearchParams(searchParams);
      next.delete('nuevo');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter((u) => {
      const haystack = [u.nombres, u.apellidos, u.nick, u.email].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search]);

  async function handleSuspend(id: string) {
    if (!window.confirm('¿Suspender este usuario? Se cerrarán sus sesiones activas.')) return;
    try {
      await suspend.mutate({ userId: id });
      void refetch();
    } catch {
      /* error en hook */
    }
  }

  async function handleReactivate(id: string) {
    try {
      await reactivate.mutate({ userId: id });
      void refetch();
    } catch {
      /* error en hook */
    }
  }

  async function handleResend(id: string) {
    try {
      const r = await resend.mutate({ userId: id });
      setResentLink(r.activationLink);
    } catch {
      /* error */
    }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Usuarios
          </h1>
          <Btn icon="plus" onClick={() => setShowCreate(true)}>
            Crear usuario
          </Btn>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex-1 min-w-[220px] relative">
            <Icon
              name="search"
              size={16}
              color="#6B746A"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="search"
              placeholder="Buscar por nombre, nick, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="">Todos los roles</option>
            <option value="client">Clientes</option>
            <option value="trainer">Entrenadores</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>

        {data && (
          <div className="text-[12px] text-fg-3 mb-3 px-1">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && filtered.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="group" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2">Sin resultados.</p>
            </div>
          </Card>
        )}

        {data && filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onEdit={() => setEditingUser(u)}
                onSuspend={() => handleSuspend(u.id)}
                onReactivate={() => handleReactivate(u.id)}
                onResend={() => handleResend(u.id)}
                busy={suspend.loading || reactivate.loading || resend.loading}
              />
            ))}
          </ul>
        )}
      </div>

      <UserFormModal
        open={showCreate || !!editingUser}
        initialUser={editingUser}
        onClose={() => {
          setShowCreate(false);
          setEditingUser(null);
        }}
        onSaved={() => {
          setShowCreate(false);
          setEditingUser(null);
          void refetch();
        }}
      />

      {resentLink && (
        <ResendLinkModal link={resentLink} onClose={() => setResentLink(null)} />
      )}
    </AppShell>
  );
}

function UserRow({
  user,
  onEdit,
  onSuspend,
  onReactivate,
  onResend,
  busy,
}: {
  user: UserListItem;
  onEdit: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onResend: () => void;
  busy: boolean;
}) {
  const initials =
    (user.nombres?.charAt(0) ?? '').toUpperCase() +
    (user.apellidos?.charAt(0) ?? '').toUpperCase();
  const isPending = user.estado === 'pending';
  const isSuspended = user.estado === 'suspended';

  return (
    <li>
      <Card padding={16}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-none">
            <span className="font-display text-xs font-bold" style={{ color: '#0B1208' }}>
              {initials || '·'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {user.nombres} {user.apellidos}
              </span>
              {user.nick && <span className="text-fg-3 text-[12px]">@{user.nick}</span>}
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3">
                {ROLE_LABEL[user.rol] ?? user.rol}
              </span>
            </div>
            <div className="text-fg-2 text-[12px] mt-0.5 truncate">{user.email}</div>
            {user.last_login_at && (
              <div className="text-fg-3 text-[11px] mt-0.5">
                Último login {formatRelative(user.last_login_at)}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge
              kind={ESTADO_BADGE[user.estado] ?? 'cancelado'}
              label={ESTADO_LABEL[user.estado] ?? user.estado}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Btn>
          {isPending && (
            <Btn variant="outline" size="sm" onClick={onResend} disabled={busy}>
              Reenviar invitación
            </Btn>
          )}
          {isSuspended ? (
            <Btn variant="outline" size="sm" onClick={onReactivate} disabled={busy}>
              Reactivar
            </Btn>
          ) : user.estado === 'active' ? (
            <Btn variant="ghost" size="sm" onClick={onSuspend} disabled={busy}>
              Suspender
            </Btn>
          ) : null}
        </div>
      </Card>
    </li>
  );
}

function ResendLinkModal({ link, onClose }: { link: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative max-w-md w-full" padding={20}>
        <div className="font-display text-lg font-semibold mb-3">Invitación reenviada</div>
        <p className="text-fg-2 text-sm mb-3">
          Se envió un nuevo correo con enlace de activación. Aquí está el link por si lo
          necesitas:
        </p>
        <div className="bg-surface-2 border border-line-2 rounded-xl p-3 text-[12px] font-mono break-all text-fg-2 mb-3">
          {link}
        </div>
        <div className="flex gap-2">
          <Btn
            variant="secondary"
            full
            onClick={() => navigator.clipboard?.writeText(link)}
          >
            Copiar
          </Btn>
          <Btn full onClick={onClose}>
            Listo
          </Btn>
        </div>
      </Card>
    </div>
  );
}
