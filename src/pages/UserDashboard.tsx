import { Link } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { useApiQuery } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';
import {
  formatDate,
  formatTime,
  formatRelative,
  greeting,
} from '../lib/datetime';

interface NextSession {
  id: string;
  fechaInicioUtc: string;
  duracionMin: number;
  tipo: string;
  estado: string;
  entrenador: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  sede: { id: string; nombre: string; ciudad: string } | null;
}

interface ActivePlan {
  id: string;
  nombre: string;
  tipo: string;
  sesionesRestantes: number;
  sesionesTotales: number;
  sesionesConsumidas: number;
  fechaVencimientoUtc: string;
  diasRestantes: number;
  estadoVisual: string;
}

interface AlertItem {
  id: string;
  tipo: string;
  severidad: 'info' | 'warn' | 'error';
  titulo: string;
  descripcion?: string;
  accion_url?: string;
  created_at: string;
}

interface UserDashboardData {
  proximoEntrenamiento: NextSession | null;
  planActivo: ActivePlan | null;
  racha: number;
  sesionesCompletadas: number;
  alertasNoLeidas: number;
  alertas: AlertItem[];
}

export default function UserDashboard() {
  const user = useSession((s) => s.user);
  const { data, error, loading } = useApiQuery<UserDashboardData>('getUserDashboard');

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
            {greeting()}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            {user?.nombres ?? 'Bienvenido'}.
          </h1>
        </div>

        {loading && (
          <div className="space-y-4">
            <SkeletonCard height={160} />
            <SkeletonCard height={120} />
          </div>
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5 mb-4">
            <div className="flex items-start gap-3">
              <Icon name="x" size={18} color="#FF8E8E" strokeWidth={2} />
              <div>
                <p className="text-err-fg font-medium">No pudimos cargar tu dashboard</p>
                <p className="text-fg-2 text-sm mt-1">{error.message}</p>
              </div>
            </div>
          </Card>
        )}

        {data && (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <NextSessionCard
              session={data.proximoEntrenamiento}
              className="md:col-span-2"
            />

            <PlanCard plan={data.planActivo} />

            <KpiGrid racha={data.racha} sesionesCompletadas={data.sesionesCompletadas} />

            <AlertsPreviewCard
              alertas={data.alertas}
              total={data.alertasNoLeidas}
              className="md:col-span-2"
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────

function NextSessionCard({
  session,
  className = '',
}: {
  session: NextSession | null;
  className?: string;
}) {
  if (!session) {
    return (
      <Card padding={24} className={className}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Próximo entrenamiento
            </div>
            <p className="text-fg-2">No tienes sesiones agendadas.</p>
            <p className="text-fg-3 text-sm mt-1">Empieza por agendar la próxima.</p>
          </div>
          <Link to="/agendar">
            <Btn icon="plus" size="lg">Agendar sesión</Btn>
          </Link>
        </div>
      </Card>
    );
  }

  const trainerName = session.entrenador
    ? `${session.entrenador.nombres} ${session.entrenador.apellidos}`.trim()
    : 'Por confirmar';

  return (
    <Card padding={24} className={className}>
      <div className="flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="flex items-start gap-4">
          <div className="text-center flex-none">
            <div className="font-display text-3xl md:text-4xl font-bold tracking-[-0.03em] leading-none">
              {formatTime(session.fechaInicioUtc)}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mt-1.5">
              {session.duracionMin} min
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1">
              {formatDate(session.fechaInicioUtc)} · {formatRelative(session.fechaInicioUtc)}
            </div>
            <div className="font-medium text-base capitalize">
              {session.tipo} · {trainerName}
            </div>
            {session.sede && (
              <div className="text-fg-2 text-sm mt-1 flex items-center gap-1.5">
                <Icon name="mapPin" size={12} color="currentColor" />
                {session.sede.nombre} · {session.sede.ciudad}
              </div>
            )}
            <div className="mt-2">
              <StatusBadge kind={session.estado as 'confirmado'} />
            </div>
          </div>
        </div>
        <Link to={`/calendario`} className="flex-none">
          <Btn variant="secondary" size="md">Ver calendario</Btn>
        </Link>
      </div>
    </Card>
  );
}

function PlanCard({ plan }: { plan: ActivePlan | null }) {
  if (!plan) {
    return (
      <Card padding={20}>
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
          Mi plan
        </div>
        <p className="text-fg-2">No tienes un plan activo.</p>
        <p className="text-fg-3 text-sm mt-1">
          Pide al equipo que te asigne uno para empezar.
        </p>
      </Card>
    );
  }

  const pct = Math.round((plan.sesionesConsumidas / Math.max(1, plan.sesionesTotales)) * 100);

  return (
    <Card padding={20}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
          Mi plan
        </div>
        <StatusBadge kind={plan.estadoVisual as 'plan-activo'} />
      </div>

      <div className="font-medium text-base mb-1">{plan.nombre}</div>

      <div className="flex items-baseline gap-2 mt-3 mb-2">
        <div className="font-display text-3xl font-bold tracking-[-0.03em]">
          {plan.sesionesRestantes}
        </div>
        <div className="text-fg-2 text-sm">/ {plan.sesionesTotales} restantes</div>
      </div>

      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-fg-3 text-sm mt-3 flex items-center gap-1.5">
        <Icon name="clock" size={12} />
        Vence {formatRelative(plan.fechaVencimientoUtc)}
      </div>

      <Link to="/mi-plan" className="block mt-4">
        <Btn variant="secondary" size="sm" full>Ver detalle</Btn>
      </Link>
    </Card>
  );
}

function KpiGrid({
  racha,
  sesionesCompletadas,
}: {
  racha: number;
  sesionesCompletadas: number;
}) {
  return (
    <Card padding={20}>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-4">
        Tu progreso
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="flame" size={14} color="#FFB02E" strokeWidth={2} />
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
              Racha
            </span>
          </div>
          <div className="font-display text-3xl font-bold tracking-[-0.03em]">{racha}</div>
          <div className="text-fg-3 text-[12px] mt-0.5">
            sesion{racha === 1 ? '' : 'es'} consecutivas
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="trophy" size={14} color="#C8FF3D" strokeWidth={2} />
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
              Total
            </span>
          </div>
          <div className="font-display text-3xl font-bold tracking-[-0.03em]">
            {sesionesCompletadas}
          </div>
          <div className="text-fg-3 text-[12px] mt-0.5">sesiones completadas</div>
        </div>
      </div>
    </Card>
  );
}

function AlertsPreviewCard({
  alertas,
  total,
  className = '',
}: {
  alertas: AlertItem[];
  total: number;
  className?: string;
}) {
  return (
    <Card padding={20} className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
          Alertas {total > 0 && <span className="text-warn ml-1">({total})</span>}
        </div>
        <Link
          to="/alertas"
          className="text-[12px] text-fg-2 hover:text-fg underline-offset-2 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {alertas.length === 0 ? (
        <p className="text-fg-2 text-sm">Sin alertas pendientes.</p>
      ) : (
        <ul className="space-y-2.5">
          {alertas.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-none"
                style={{
                  background:
                    a.severidad === 'error'
                      ? '#FF5C5C'
                      : a.severidad === 'warn'
                      ? '#FFB02E'
                      : '#7AC7FF',
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{a.titulo}</div>
                {a.descripcion && (
                  <div className="text-fg-2 text-[13px] mt-0.5">{a.descripcion}</div>
                )}
                <div className="text-fg-3 text-[11px] mt-1">
                  {formatRelative(a.created_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SkeletonCard({ height }: { height: number }) {
  return (
    <div
      className="bg-surface border border-line rounded-2xl animate-pulse"
      style={{ height }}
    />
  );
}
