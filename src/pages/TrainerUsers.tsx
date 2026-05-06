import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery } from '../lib/useApiQuery';
import { formatRelative } from '../lib/datetime';

interface UserListItem {
  id: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  foto_url?: string;
  estado: string;
  accessKind?: 'assigned' | 'professional' | 'shared_sede';
  sharedSedes?: Array<{ id: string; nombre: string; principal?: boolean }>;
  planActivo: {
    nombre: string;
    sesionesRestantes: number;
    sesionesTotales: number;
    fechaVencimientoUtc: string;
    diasRestantes: number;
    estadoVisual: StatusKind;
  } | null;
  proximaSesionUtc: string | null;
  proximaSesionEstado: string | null;
}

export default function TrainerUsers() {
  const [search, setSearch] = useState('');
  const { data, error, loading } = useApiQuery<UserListItem[]>('listMyUsers');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter((u) => {
      const fullName = `${u.nombres} ${u.apellidos}`.toLowerCase();
      const nick = (u.nick || '').toLowerCase();
      return fullName.includes(q) || nick.includes(q);
    });
  }, [data, search]);

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
          Mis usuarios
        </h1>

        <div className="mb-5">
          <div className="relative">
            <Icon
              name="search"
              size={16}
              color="#6B746A"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="search"
              placeholder="Buscar por nombre o nick..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="bg-surface border border-line rounded-2xl h-24 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-24 animate-pulse" />
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
              <p className="text-fg-2">
                {search.trim() ? 'Sin resultados.' : 'No tienes usuarios asignados todavía.'}
              </p>
            </div>
          </Card>
        )}

        {data && filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function UserRow({ user }: { user: UserListItem }) {
  const initials =
    (user.nombres?.charAt(0) ?? '').toUpperCase() +
    (user.apellidos?.charAt(0) ?? '').toUpperCase();

  return (
    <li>
      <Link
        to={`/usuarios/${user.id}`}
        className="block bg-surface border border-line hover:border-line-2 rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center flex-none">
            <span className="font-display text-sm font-bold" style={{ color: '#0B1208' }}>
              {initials || '·'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm">
                {user.nombres} {user.apellidos}
              </span>
              {user.nick && (
                <span className="text-fg-3 text-[12px]">@{user.nick}</span>
              )}
              {user.accessKind === 'shared_sede' && (
                <span
                  title="Solo lectura · este afiliado solo aparece por compartir sede contigo. No puedes agendarlo ni agregarlo a tus grupos."
                  className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-fg-3/10 text-fg-3 border border-fg-3/20"
                >
                  Solo lectura · sede compartida
                </span>
              )}
              {user.accessKind === 'professional' && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  Profesional asignado
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {user.planActivo ? (
                <span className="text-[12px] text-fg-2 flex items-center gap-1">
                  <Icon name="shield" size={11} color="currentColor" />
                  {user.planActivo.sesionesRestantes}/{user.planActivo.sesionesTotales} ·{' '}
                  vence {formatRelative(user.planActivo.fechaVencimientoUtc)}
                </span>
              ) : (
                <span className="text-[12px] text-fg-3">Sin plan activo</span>
              )}

              {user.proximaSesionUtc && (
                <span className="text-[12px] text-fg-2 flex items-center gap-1">
                  <Icon name="cal" size={11} color="currentColor" />
                  {formatRelative(user.proximaSesionUtc)}
                </span>
              )}
              {user.accessKind === 'shared_sede' && user.sharedSedes && user.sharedSedes.length > 0 && (
                <span className="text-[12px] text-fg-3 flex items-center gap-1">
                  <Icon name="mapPin" size={11} color="currentColor" />
                  {user.sharedSedes.map((s) => s.nombre).filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {user.planActivo && (
              <StatusBadge kind={user.planActivo.estadoVisual} />
            )}
            <Icon name="arrow" size={14} color="#6B746A" />
          </div>
        </div>
      </Link>
    </li>
  );
}
