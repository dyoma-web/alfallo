import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { useApiQuery } from '../lib/useApiQuery';
import { formatRelative, formatDateTime } from '../lib/datetime';

interface AuditEntry {
  id: string;
  createdAt: string;
  userId: string;
  userName: string;
  accion: string;
  entidad: string;
  entidadId: string;
  resultado: 'ok' | 'error' | 'denied';
  errorMsg?: string;
  ip?: string;
  userAgent?: string;
}

interface AuditData {
  items: AuditEntry[];
  totalReturned: number;
  totalMatch: number;
}

const RESULTADO_LABEL: Record<string, string> = {
  ok: 'OK',
  error: 'Error',
  denied: 'Denegado',
};

const RESULTADO_COLOR: Record<string, string> = {
  ok: '#A6EDB1',
  error: '#FF8E8E',
  denied: '#FFC97A',
};

export default function AdminAuditLog() {
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterResultado, setFilterResultado] = useState('');

  const { data, error, loading, refetch } = useApiQuery<AuditData>(
    'adminListAuditLog',
    {
      entidad: filterEntidad || undefined,
      resultado: filterResultado || undefined,
      limit: 200,
    },
    { deps: [filterEntidad, filterResultado] }
  );

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              Auditoría
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              Registro inmutable de toda escritura en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-[12px] text-fg-2 hover:text-fg flex items-center gap-1.5"
            disabled={loading}
          >
            <Icon name="rep" size={14} />
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={filterEntidad}
            onChange={(e) => setFilterEntidad(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface-2 border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
          >
            <option value="">Todas las entidades</option>
            <option value="usuario">Usuarios</option>
            <option value="agendamiento">Agendamientos</option>
            <option value="sesion">Sesiones</option>
            <option value="sede">Sedes</option>
            <option value="planes_catalogo">Planes catálogo</option>
            <option value="planes_usuario">Planes usuario</option>
            <option value="entrenadores_perfil">Perfiles trainer</option>
          </select>
          <select
            value={filterResultado}
            onChange={(e) => setFilterResultado(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface-2 border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
          >
            <option value="">Todos los resultados</option>
            <option value="ok">OK</option>
            <option value="error">Errores</option>
            <option value="denied">Denegados</option>
          </select>
        </div>

        {data && (
          <div className="text-[12px] text-fg-3 mb-3 px-1">
            Mostrando {data.totalReturned} de {data.totalMatch} registros
            {data.totalMatch > data.totalReturned && ' · Mostrando los más recientes'}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="bg-surface border border-line rounded-2xl h-16 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-16 animate-pulse" />
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && data.items.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="shield" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2">Sin registros con estos filtros.</p>
            </div>
          </Card>
        )}

        {data && data.items.length > 0 && (
          <ul className="space-y-1.5">
            {data.items.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <li>
      <Card padding={12}>
        <div className="flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-1.5 flex-none"
            style={{ background: RESULTADO_COLOR[entry.resultado] }}
            title={RESULTADO_LABEL[entry.resultado]}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium text-sm">{entry.accion}</span>
              {entry.entidad && (
                <span className="text-[11px] font-mono text-fg-3">
                  {entry.entidad}
                  {entry.entidadId && `:${entry.entidadId.slice(0, 8)}…`}
                </span>
              )}
            </div>
            <div className="text-fg-2 text-[12px] mt-0.5 truncate">
              {entry.userName || (entry.userId ? entry.userId.slice(0, 8) + '…' : 'Sistema')}
              {entry.errorMsg && (
                <span className="text-err-fg ml-2">· {entry.errorMsg}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-none">
            <div className="text-[11px] text-fg-3" title={formatDateTime(entry.createdAt)}>
              {formatRelative(entry.createdAt)}
            </div>
          </div>
        </div>
      </Card>
    </li>
  );
}
