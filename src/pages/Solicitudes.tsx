import { useState } from 'react';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge, type StatusKind } from '../components/StatusBadge';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';
import { formatRelative, formatDateTime } from '../lib/datetime';
import { SolicitudFormModal } from '../components/SolicitudFormModal';
import { Modal } from '../components/Modal';

interface Solicitante {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

interface Solicitud {
  id: string;
  tipo: 'crear_gimnasio' | 'crear_sede' | 'cambio_plan';
  user_id: string;
  target_id: string;
  datos: Record<string, unknown>;
  estado: 'pending' | 'approved' | 'rejected';
  resuelta_por: string;
  resuelta_at_utc: string;
  motivo_resolucion?: string;
  created_at: string;
  solicitante: Solicitante | null;
  resuelto_por_user: Solicitante | null;
}

const TIPO_LABEL: Record<string, string> = {
  crear_gimnasio: 'Nuevo gimnasio',
  crear_sede: 'Nueva sede',
  cambio_plan: 'Cambio de plan global',
};

const ESTADO_BADGE: Record<string, StatusKind> = {
  pending: 'pendiente',
  approved: 'completado',
  rejected: 'rechazado',
};

export default function Solicitudes() {
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isTrainer = role === 'trainer';

  const [showCreate, setShowCreate] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('pending');
  const [resolving, setResolving] = useState<Solicitud | null>(null);

  const { data, error, loading, refetch } = useApiQuery<Solicitud[]>(
    'listSolicitudes',
    { estado: filterEstado || undefined },
    { deps: [filterEstado] }
  );

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
              {isAdmin ? 'Solicitudes' : 'Mis solicitudes'}
            </h1>
            <p className="text-fg-3 text-[12px] mt-0.5">
              {isAdmin
                ? 'Revisa y resuelve solicitudes de profesionales.'
                : 'Pide la creacion de gimnasios, sedes o cambios en planes globales.'}
            </p>
          </div>
          {isTrainer && (
            <Btn icon="plus" onClick={() => setShowCreate(true)}>Nueva solicitud</Btn>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <FilterChip active={filterEstado === 'pending'} onClick={() => setFilterEstado('pending')}>
            Pendientes
          </FilterChip>
          <FilterChip active={filterEstado === 'approved'} onClick={() => setFilterEstado('approved')}>
            Aprobadas
          </FilterChip>
          <FilterChip active={filterEstado === 'rejected'} onClick={() => setFilterEstado('rejected')}>
            Rechazadas
          </FilterChip>
          <FilterChip active={filterEstado === ''} onClick={() => setFilterEstado('')}>
            Todas
          </FilterChip>
        </div>

        {loading && <div className="bg-surface border border-line rounded-2xl h-24 animate-pulse" />}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {data && data.length === 0 && !loading && (
          <Card padding={32}>
            <div className="text-center">
              <Icon name="msg" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2 mb-3">
                {isAdmin && filterEstado === 'pending'
                  ? 'Sin solicitudes pendientes. Bien manejado.'
                  : 'Sin solicitudes en este estado.'}
              </p>
              {isTrainer && filterEstado === 'pending' && (
                <Btn icon="plus" onClick={() => setShowCreate(true)}>Crear una solicitud</Btn>
              )}
            </div>
          </Card>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((s) => (
              <SolicitudRow
                key={s.id}
                solicitud={s}
                isAdmin={isAdmin}
                onResolve={() => setResolving(s)}
              />
            ))}
          </ul>
        )}
      </div>

      {isTrainer && (
        <SolicitudFormModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmitted={() => { setShowCreate(false); void refetch(); }}
        />
      )}

      {isAdmin && resolving && (
        <ResolveModal
          solicitud={resolving}
          onClose={() => setResolving(null)}
          onResolved={() => { setResolving(null); void refetch(); }}
        />
      )}
    </AppShell>
  );
}

function SolicitudRow({
  solicitud,
  isAdmin,
  onResolve,
}: {
  solicitud: Solicitud;
  isAdmin: boolean;
  onResolve: () => void;
}) {
  const datos = solicitud.datos || {};
  const summary = solicitud.tipo === 'crear_gimnasio'
    ? `${(datos as { nombre?: string }).nombre ?? ''} (${(datos as { sedes?: unknown[] }).sedes?.length ?? 0} sedes)`
    : solicitud.tipo === 'cambio_plan'
      ? `${(datos as { planNombre?: string }).planNombre ?? 'Plan global'}`
      : `${(datos as { nombre?: string }).nombre ?? ''}`;

  return (
    <li>
      <Card padding={16}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-none">
            <Icon name="building" size={18} color="#C8FF3D" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{TIPO_LABEL[solicitud.tipo]}</span>
              <span className="text-fg-2 text-[13px]">· {summary}</span>
            </div>
            {solicitud.solicitante && isAdmin && (
              <div className="text-fg-3 text-[12px] mt-0.5">
                Por: {solicitud.solicitante.nombres} {solicitud.solicitante.apellidos}
              </div>
            )}
            <div className="text-fg-3 text-[11px] mt-1">
              {formatRelative(solicitud.created_at)}
              {solicitud.estado !== 'pending' && solicitud.resuelto_por_user && (
                <span> · resuelta por {solicitud.resuelto_por_user.nombres}</span>
              )}
            </div>
            {solicitud.motivo_resolucion && (
              <div className="text-fg-2 text-[12px] mt-1 italic">
                "{solicitud.motivo_resolucion}"
              </div>
            )}
            {solicitud.tipo === 'cambio_plan' && (
              <div className="text-fg-2 text-[12px] mt-1">
                {(datos as { motivo?: string }).motivo}
              </div>
            )}
          </div>

          <StatusBadge kind={ESTADO_BADGE[solicitud.estado] ?? 'pendiente'} />
        </div>

        {isAdmin && solicitud.estado === 'pending' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-line">
            <Btn size="sm" onClick={onResolve}>Revisar y resolver</Btn>
          </div>
        )}
      </Card>
    </li>
  );
}

function ResolveModal({
  solicitud,
  onClose,
  onResolved,
}: {
  solicitud: Solicitud;
  onClose: () => void;
  onResolved: () => void;
}) {
  const resolve = useApiMutation('resolveSolicitud');
  const [motivo, setMotivo] = useState('');

  const datos = solicitud.datos || {};
  const datosJson = JSON.stringify(datos, null, 2);

  async function decide(accion: 'approve' | 'reject') {
    try {
      await resolve.mutate({ solicitudId: solicitud.id, accion, motivo });
      onResolved();
    } catch { /* */ }
  }

  return (
    <Modal open onClose={onClose} title="Resolver solicitud" size="lg">
      <div className="px-5 py-5 space-y-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            Tipo
          </div>
          <div className="font-medium">{TIPO_LABEL[solicitud.tipo]}</div>
        </div>

        {solicitud.solicitante && (
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              Solicitante
            </div>
            <div className="text-sm">
              {solicitud.solicitante.nombres} {solicitud.solicitante.apellidos} · {solicitud.solicitante.email}
            </div>
            <div className="text-fg-3 text-[12px]">{formatDateTime(solicitud.created_at)}</div>
          </div>
        )}

        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            Datos solicitados
          </div>
          <pre className="text-[11px] font-mono bg-surface-2 border border-line p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all">
            {datosJson}
          </pre>
        </div>

        <div>
          <label htmlFor="resmotivo" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Motivo / nota (opcional)
          </label>
          <textarea
            id="resmotivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Visible para el solicitante..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        {resolve.error && (
          <div role="alert" className="text-err-fg text-[13px]">{resolve.error.message}</div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <p className="text-[12px] text-fg-3">
            {solicitud.tipo === 'cambio_plan'
              ? 'Aprobar marca la solicitud como revisada. Rechazar notifica al solicitante.'
              : 'Aprobar creará automáticamente la entidad. Rechazar notifica al solicitante.'}
          </p>
          <div className="flex gap-2">
            <Btn variant="danger" full onClick={() => decide('reject')} disabled={resolve.loading}>
              {resolve.loading ? '...' : 'Rechazar'}
            </Btn>
            <Btn full onClick={() => decide('approve')} disabled={resolve.loading}>
              {resolve.loading ? '...' : solicitud.tipo === 'cambio_plan' ? 'Marcar revisada' : 'Aprobar y crear'}
            </Btn>
          </div>
          <Btn variant="ghost" full onClick={onClose} disabled={resolve.loading}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3.5 py-1.5 rounded-full text-sm border transition-colors flex-none',
        active
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-transparent border-line-2 text-fg-2 hover:text-fg hover:bg-surface',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
