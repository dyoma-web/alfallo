import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Icon, type IconName } from '../components/Icon';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: IconName;
  iteration?: string;
}

export function ComingSoonPage(props: ComingSoonProps) {
  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
          {props.title}
        </h1>
        <Card padding={32}>
          <div className="text-center">
            <Icon
              name={props.icon ?? 'clock'}
              size={32}
              color="#6B746A"
              className="mx-auto mb-4"
            />
            <h2 className="font-display text-lg font-semibold mb-2">Próximamente</h2>
            <p className="text-fg-2 text-sm leading-relaxed max-w-sm mx-auto">
              {props.description}
            </p>
            {props.iteration && (
              <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mt-4">
                Llega en {props.iteration}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// ── Páginas concretas que reusan ComingSoonPage ───────────────────────────

export function CalendarPlaceholder() {
  return (
    <ComingSoonPage
      title="Calendario"
      icon="cal"
      description="Aquí verás todas tus sesiones organizadas por día, semana o mes."
      iteration="Iter 5 · Lote C"
    />
  );
}

export function BookingPlaceholder() {
  return (
    <ComingSoonPage
      title="Agendar"
      icon="plus"
      description="Selecciona entrenador, fecha y hora. La sesión queda solicitada y tu entrenador la confirma."
      iteration="Iter 5 · Lote C"
    />
  );
}

export default ComingSoonPage;
