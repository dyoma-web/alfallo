import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { formatRelative } from '../lib/datetime';

interface AlertItem {
  id: string;
  tipo: string;
  severidad: 'info' | 'warn' | 'error';
  titulo: string;
  descripcion?: string;
  accion_url?: string;
  leida: boolean;
  created_at: string;
}

interface AlertsData {
  items: AlertItem[];
  totalUnread: number;
}

export default function Alerts() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, error, loading, refetch } = useApiQuery<AlertsData>(
    'listAlerts',
    { onlyUnread: filter === 'unread', limit: 100 },
    { deps: [filter] }
  );

  const markRead = useApiMutation<{ ok: boolean }>('markAlertRead');
  const markAll = useApiMutation<{ count: number }>('markAllAlertsRead');

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutate({ alertId: id });
      void refetch();
    } catch {
      /* ya capturado por el hook */
    }
  }

  async function handleMarkAll() {
    try {
      await markAll.mutate();
      void refetch();
    } catch {
      /* ya capturado */
    }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Alertas
          </h1>
          {data && data.totalUnread > 0 && (
            <Btn
              variant="secondary"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAll.loading}
            >
              {markAll.loading ? 'Marcando...' : 'Marcar todas como leídas'}
            </Btn>
          )}
        </div>

        <div className="flex gap-2 mb-5">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas
          </FilterChip>
          <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')}>
            No leídas {data && data.totalUnread > 0 && `(${data.totalUnread})`}
          </FilterChip>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
            <div className="bg-surface border border-line rounded-2xl h-20 animate-pulse" />
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
              <Icon name="bell" size={28} color="#6B746A" className="mx-auto mb-3" />
              <p className="text-fg-2">
                {filter === 'unread' ? 'No tienes alertas sin leer.' : 'Sin alertas todavía.'}
              </p>
            </div>
          </Card>
        )}

        {data && data.items.length > 0 && (
          <ul className="space-y-2">
            {data.items.map((a) => (
              <AlertRow key={a.id} alert={a} onMarkRead={handleMarkRead} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function AlertRow({
  alert,
  onMarkRead,
}: {
  alert: AlertItem;
  onMarkRead: (id: string) => void;
}) {
  const dotColor =
    alert.severidad === 'error'
      ? '#FF5C5C'
      : alert.severidad === 'warn'
      ? '#FFB02E'
      : '#7AC7FF';

  return (
    <li>
      <Card
        padding={16}
        className={alert.leida ? 'opacity-60' : ''}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-2 flex-none"
            style={{ background: dotColor }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium text-sm">{alert.titulo}</div>
              <div className="text-fg-3 text-[11px] flex-none">
                {formatRelative(alert.created_at)}
              </div>
            </div>
            {alert.descripcion && (
              <p className="text-fg-2 text-[13px] mt-1 leading-relaxed">
                {alert.descripcion}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              {alert.accion_url && (
                <Link
                  to={alert.accion_url.startsWith('/') ? alert.accion_url : `/${alert.accion_url}`}
                  className="text-[12px] text-accent hover:underline underline-offset-2"
                >
                  Ver detalle →
                </Link>
              )}
              {!alert.leida && (
                <button
                  type="button"
                  onClick={() => onMarkRead(alert.id)}
                  className="text-[12px] text-fg-3 hover:text-fg-2 underline-offset-2 hover:underline"
                >
                  Marcar como leída
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </li>
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
        'px-3.5 py-1.5 rounded-full text-sm border transition-colors',
        active
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-transparent border-line-2 text-fg-2 hover:text-fg hover:bg-surface',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
