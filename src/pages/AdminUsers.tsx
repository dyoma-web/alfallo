import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { UserFormModal } from '../components/admin/UserFormModal';
import { TrainerProfileModal } from '../components/admin/TrainerProfileModal';
import { DetailModal, type DetailSection } from '../components/DetailModal';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatRelative, formatShortDate } from '../lib/datetime';

interface SedeRef {
  id: string;
  nombre: string;
  ciudad?: string;
  gimnasio_id?: string | null;
}

interface GymRef {
  id: string;
  nombre: string;
}

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
  created_at?: string;
  hasTrainerProfile?: boolean;
  sedes?: SedeRef[];
  gimnasios?: GymRef[];
}

type GroupBy = 'none' | 'rol' | 'sede' | 'gimnasio';

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
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [trainerProfileFor, setTrainerProfileFor] = useState<UserListItem | null>(null);
  const [viewing, setViewing] = useState<UserListItem | null>(null);

  const suspend = useApiMutation('adminSuspendUser');
  const reactivate = useApiMutation('adminReactivateUser');
  const resend = useApiMutation<{ activationLink: string }>('adminResendActivation');
  const [resentLink, setResentLink] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

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
    const ok = await confirm({
      title: 'Suspender usuario',
      message: 'Se cerrarán sus sesiones activas y no podrá iniciar sesión hasta reactivarlo.',
      confirmLabel: 'Suspender',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await suspend.mutate({ userId: id });
      toast({ title: 'Usuario suspendido', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo suspender',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  async function handleReactivate(id: string) {
    try {
      await reactivate.mutate({ userId: id });
      toast({ title: 'Usuario reactivado', tone: 'success' });
      void refetch();
    } catch (e) {
      toast({
        title: 'No se pudo reactivar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  async function handleResend(id: string) {
    try {
      const r = await resend.mutate({ userId: id });
      setResentLink(r.activationLink);
    } catch (e) {
      toast({
        title: 'No se pudo reenviar la invitación',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
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
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            title="Agrupar por"
          >
            <option value="none">Sin agrupar</option>
            <option value="rol">Agrupar por rol</option>
            <option value="gimnasio">Agrupar por gimnasio</option>
            <option value="sede">Agrupar por sede</option>
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

        {data && filtered.length > 0 && groupBy === 'none' && (
          <ul className="space-y-2">
            {filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onView={() => setViewing(u)}
                onEdit={() => setEditingUser(u)}
                onSuspend={() => handleSuspend(u.id)}
                onReactivate={() => handleReactivate(u.id)}
                onResend={() => handleResend(u.id)}
                onTrainerProfile={u.rol === 'trainer' ? () => setTrainerProfileFor(u) : undefined}
                busy={suspend.loading || reactivate.loading || resend.loading}
              />
            ))}
          </ul>
        )}

        {data && filtered.length > 0 && groupBy !== 'none' && (
          <GroupedUsers
            users={filtered}
            groupBy={groupBy}
            onView={(u) => setViewing(u)}
            onEdit={(u) => setEditingUser(u)}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
            onResend={handleResend}
            onTrainerProfile={(u) => setTrainerProfileFor(u)}
            busy={suspend.loading || reactivate.loading || resend.loading}
          />
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

      <TrainerProfileModal
        open={!!trainerProfileFor}
        trainerId={trainerProfileFor?.id ?? null}
        trainerName={trainerProfileFor
          ? `${trainerProfileFor.nombres} ${trainerProfileFor.apellidos}`.trim()
          : undefined}
        onClose={() => setTrainerProfileFor(null)}
        onSaved={() => { /* keep open after save */ }}
      />

      <UserDetailModal
        user={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditingUser(viewing); setViewing(null); }}
        onTrainerProfile={() => { setTrainerProfileFor(viewing); setViewing(null); }}
        onSuspend={async () => {
          if (!viewing) return;
          await handleSuspend(viewing.id);
          setViewing(null);
        }}
        onReactivate={async () => {
          if (!viewing) return;
          await handleReactivate(viewing.id);
          setViewing(null);
        }}
        onResend={async () => {
          if (!viewing) return;
          await handleResend(viewing.id);
          setViewing(null);
        }}
        busy={suspend.loading || reactivate.loading || resend.loading}
      />

      {resentLink && (
        <ResendLinkModal link={resentLink} onClose={() => setResentLink(null)} />
      )}

      {confirmDialog}
    </AppShell>
  );
}

function UserDetailModal({
  user,
  onClose,
  onEdit,
  onTrainerProfile,
  onSuspend,
  onReactivate,
  onResend,
  busy,
}: {
  user: UserListItem | null;
  onClose: () => void;
  onEdit: () => void;
  onTrainerProfile: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onResend: () => void;
  busy: boolean;
}) {
  if (!user) return null;
  const isPending = user.estado === 'pending';
  const isSuspended = user.estado === 'suspended';
  const isActive = user.estado === 'active';

  const sections: DetailSection[] = [
    {
      title: 'Identidad',
      fields: [
        { label: 'Nombre completo', value: `${user.nombres} ${user.apellidos}`.trim() },
        { label: 'Nick', value: user.nick ? `@${user.nick}` : '' },
        { label: 'Correo', value: user.email },
        { label: 'Cédula', value: user.cedula ?? '' },
        { label: 'Celular', value: user.celular ?? '' },
        { label: 'Rol', value: ROLE_LABEL[user.rol] ?? user.rol },
      ],
    },
    {
      title: 'Estado de cuenta',
      fields: [
        {
          label: 'Estado',
          value: ESTADO_LABEL[user.estado] ?? user.estado,
        },
        {
          label: 'Creada',
          value: user.created_at ? formatShortDate(user.created_at) : '',
        },
        {
          label: 'Último login',
          value: user.last_login_at
            ? formatRelative(user.last_login_at)
            : 'Nunca',
        },
      ],
    },
  ];

  // Asignaciones (gimnasios + sedes) si las hay
  const hasAssignments = (user.gimnasios && user.gimnasios.length > 0)
    || (user.sedes && user.sedes.length > 0);
  if (hasAssignments) {
    const fields: DetailSection['fields'] = [];
    if (user.gimnasios && user.gimnasios.length > 0) {
      fields.push({
        label: 'Gimnasios',
        value: (
          <div className="flex flex-wrap gap-1">
            {user.gimnasios.map((g) => (
              <span
                key={g.id}
                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20"
              >
                {g.nombre}
              </span>
            ))}
          </div>
        ),
        fullWidth: true,
      });
    }
    if (user.sedes && user.sedes.length > 0) {
      fields.push({
        label: 'Sedes',
        value: (
          <div className="flex flex-wrap gap-1">
            {user.sedes.map((s) => (
              <span
                key={s.id}
                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-line text-fg-2"
              >
                {s.nombre}
                {s.ciudad ? ` · ${s.ciudad}` : ''}
              </span>
            ))}
          </div>
        ),
        fullWidth: true,
      });
    }
    sections.push({ title: 'Asignaciones', fields });
  }

  if (user.rol === 'trainer') {
    sections.push({
      fields: [
        {
          label: 'Perfil profesional',
          value: user.hasTrainerProfile
            ? 'Configurado · usa el botón "Perfil profesional" para ver/editar'
            : 'Sin configurar · usa el botón "Perfil profesional" para crearlo',
          fullWidth: true,
        },
      ],
    });
  }

  return (
    <DetailModal
      open
      onClose={onClose}
      title={`${user.nombres} ${user.apellidos}`.trim()}
      subtitle={user.email}
      badge={
        <StatusBadge
          kind={ESTADO_BADGE[user.estado] ?? 'cancelado'}
          label={ESTADO_LABEL[user.estado] ?? user.estado}
        />
      }
      sections={sections}
      actions={
        <>
          <Btn variant="secondary" full onClick={onClose}>Cerrar</Btn>
          {user.rol === 'trainer' && (
            <Btn variant="outline" onClick={onTrainerProfile} disabled={busy}>
              Perfil profesional
            </Btn>
          )}
          {isPending && (
            <Btn variant="outline" onClick={onResend} disabled={busy}>
              Reenviar invitación
            </Btn>
          )}
          {isSuspended && (
            <Btn variant="outline" onClick={onReactivate} disabled={busy}>
              Reactivar
            </Btn>
          )}
          {isActive && (
            <Btn variant="ghost" onClick={onSuspend} disabled={busy}>
              Suspender
            </Btn>
          )}
          <Btn onClick={onEdit} disabled={busy}>Editar</Btn>
        </>
      }
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Vista agrupada
// ──────────────────────────────────────────────────────────────────────────

function GroupedUsers({
  users,
  groupBy,
  onView,
  onEdit,
  onSuspend,
  onReactivate,
  onResend,
  onTrainerProfile,
  busy,
}: {
  users: UserListItem[];
  groupBy: GroupBy;
  onView: (u: UserListItem) => void;
  onEdit: (u: UserListItem) => void;
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  onResend: (id: string) => void;
  onTrainerProfile: (u: UserListItem) => void;
  busy: boolean;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; users: UserListItem[] }>();
    const noneKey = '__none__';

    for (const u of users) {
      if (groupBy === 'rol') {
        const k = u.rol;
        if (!map.has(k)) map.set(k, { label: ROLE_LABEL[k] ?? k, users: [] });
        map.get(k)!.users.push(u);
      } else if (groupBy === 'gimnasio') {
        const gyms = u.gimnasios ?? [];
        if (gyms.length === 0) {
          if (!map.has(noneKey)) map.set(noneKey, { label: 'Sin gimnasio', users: [] });
          map.get(noneKey)!.users.push(u);
        } else {
          for (const g of gyms) {
            const k = g.id;
            if (!map.has(k)) map.set(k, { label: g.nombre, users: [] });
            map.get(k)!.users.push(u);
          }
        }
      } else if (groupBy === 'sede') {
        const sedes = u.sedes ?? [];
        if (sedes.length === 0) {
          if (!map.has(noneKey)) map.set(noneKey, { label: 'Sin sede asignada', users: [] });
          map.get(noneKey)!.users.push(u);
        } else {
          for (const s of sedes) {
            const k = s.id;
            const lbl = s.ciudad ? `${s.nombre} · ${s.ciudad}` : s.nombre;
            if (!map.has(k)) map.set(k, { label: lbl, users: [] });
            map.get(k)!.users.push(u);
          }
        }
      }
    }

    // Convertir a array ordenado: "Sin..." al final
    const arr = Array.from(map.entries()).map(([k, v]) => ({ key: k, ...v }));
    arr.sort((a, b) => {
      if (a.key === '__none__') return 1;
      if (b.key === '__none__') return -1;
      return a.label.localeCompare(b.label);
    });
    return arr;
  }, [users, groupBy]);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
              {g.label}
            </h2>
            <span className="text-[11px] text-fg-3">
              {g.users.length} {g.users.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>
          <ul className="space-y-2">
            {g.users.map((u) => (
              <UserRow
                key={u.id + g.key}
                user={u}
                onView={() => onView(u)}
                onEdit={() => onEdit(u)}
                onSuspend={() => onSuspend(u.id)}
                onReactivate={() => onReactivate(u.id)}
                onResend={() => onResend(u.id)}
                onTrainerProfile={u.rol === 'trainer' ? () => onTrainerProfile(u) : undefined}
                busy={busy}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UserRow({
  user,
  onView,
  onEdit,
  onSuspend,
  onReactivate,
  onResend,
  onTrainerProfile,
  busy,
}: {
  user: UserListItem;
  onView: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onResend: () => void;
  onTrainerProfile?: () => void;
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
        <button
          type="button"
          onClick={onView}
          className="w-full text-left -m-1 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={`Ver detalle de ${user.nombres} ${user.apellidos}`}
        >
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
              {(user.gimnasios && user.gimnasios.length > 0) || (user.sedes && user.sedes.length > 0) ? (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {user.gimnasios?.slice(0, 2).map((g) => (
                    <span
                      key={'g' + g.id}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20"
                    >
                      {g.nombre}
                    </span>
                  ))}
                  {user.sedes?.slice(0, 2).map((s) => (
                    <span
                      key={'s' + s.id}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-fg-2 border border-line"
                    >
                      {s.nombre}
                    </span>
                  ))}
                  {((user.gimnasios?.length ?? 0) + (user.sedes?.length ?? 0)) > 4 && (
                    <span className="text-[10px] text-fg-3">+más</span>
                  )}
                </div>
              ) : null}
              {user.last_login_at && (
                <div className="text-fg-3 text-[11px] mt-1">
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
        </button>

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <Btn variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Btn>
          {isPending && (
            <Btn variant="outline" size="sm" onClick={onResend} disabled={busy}>
              Reenviar invitación
            </Btn>
          )}
          {user.rol === 'trainer' && onTrainerProfile && (
            <Btn variant="outline" size="sm" onClick={onTrainerProfile} disabled={busy}>
              Perfil profesional
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
