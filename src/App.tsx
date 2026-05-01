import type { ReactNode } from 'react';
import { Btn, Card, Icon, type IconName, StatusBadge, type StatusKind, Logo, LogoCompact, Repmark } from './components';

const STATUS_KINDS: StatusKind[] = [
  'plan-activo', 'plan-vence', 'plan-vencido',
  'confirmado', 'pendiente', 'pactado', 'completado',
  'cancelado', 'no-asistido', 'autorizacion', 'rechazado', 'fuera-ventana',
];

const PALETTE = [
  { name: 'Ink',         hex: '#0F1410', use: 'Background' },
  { name: 'Surface',     hex: '#171D17', use: 'Cards' },
  { name: 'Surface 2',   hex: '#1F2620', use: 'Elevated' },
  { name: 'Lime 500',    hex: '#C8FF3D', use: 'Accent · Action' },
  { name: 'Lime 700',    hex: '#9CCC1C', use: 'Hover · Press' },
  { name: 'Foreground',  hex: '#F2F4EF', use: 'Body text' },
  { name: 'FG Muted',    hex: '#A8B0A4', use: 'Secondary' },
  { name: 'FG Faint',    hex: '#6B746A', use: 'Tertiary' },
];

const SEMANTIC = [
  { name: 'Success', hex: '#7DE08D', note: 'Confirmado · Completado · Plan activo' },
  { name: 'Warning', hex: '#FFB02E', note: 'Pendiente · Por vencer · Autorización' },
  { name: 'Error',   hex: '#FF5C5C', note: 'Vencido · Rechazado · No asistió' },
  { name: 'Info',    hex: '#7AC7FF', note: 'Pactado · Avisos' },
];

const ICON_SAMPLES: IconName[] = [
  'home', 'cal', 'plus', 'bolt', 'user', 'bell',
  'chart', 'flame', 'check', 'x', 'arrow', 'search',
  'settings', 'list', 'heart', 'trophy', 'mapPin', 'clock',
  'filter', 'group', 'msg', 'shield', 'edit', 'camera',
  'building', 'rep', 'play', 'more',
];

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-fg">
      <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 md:py-14">
        <header className="mb-12 flex items-center justify-between gap-4 flex-wrap">
          <Logo size={32} />
          <span className="text-[11px] font-mono text-fg-3 uppercase tracking-[0.14em]">
            Brand Foundation · v0.1
          </span>
        </header>

        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-tight mb-3">
            Constancia hasta el progreso.
          </h1>
          <p className="text-fg-2 text-lg max-w-xl leading-relaxed">
            Esta es la galería de componentes de la Iteración 2. Verifica que la
            identidad visual de Al Fallo se aplicó correctamente antes de empezar
            las features.
          </p>
        </div>

        <Section title="Logo lockups">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <ShowcaseTile><Logo size={28} /></ShowcaseTile>
            <ShowcaseTile light><Logo size={28} color="#0F1410" accent="#0F1410" /></ShowcaseTile>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ShowcaseTile small>
              <LogoCompact size={56} />
              <Eyebrow>App icon</Eyebrow>
            </ShowcaseTile>
            <ShowcaseTile small>
              <Repmark size={48} />
              <Eyebrow>Símbolo</Eyebrow>
            </ShowcaseTile>
            <ShowcaseTile small>
              <Logo size={18} mark={false} />
              <Eyebrow>Wordmark</Eyebrow>
            </ShowcaseTile>
          </div>
        </Section>

        <Section title="Paleta núcleo">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PALETTE.map(p => (
              <Card key={p.hex} padding={0} className="overflow-hidden">
                <div className="h-16 border-b border-line" style={{ background: p.hex }} />
                <div className="p-3">
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] font-mono text-fg-3 mt-0.5">{p.hex}</div>
                  <div className="text-[11px] text-fg-2 mt-1">{p.use}</div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Paleta semántica">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEMANTIC.map(s => (
              <Card key={s.hex} padding={12}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg" style={{ background: s.hex }} />
                  <div>
                    <div className="text-xs font-semibold">{s.name}</div>
                    <div className="text-[10px] font-mono text-fg-3">{s.hex}</div>
                  </div>
                </div>
                <div className="text-[11px] text-fg-2 mt-2 leading-snug">{s.note}</div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Tipografía">
          <Card>
            <div className="space-y-4">
              <TypeRow eyebrow="Display · Geist 700"
                       sample="Entrena con propósito."
                       cls="font-display text-4xl font-bold tracking-[-0.03em]" />
              <TypeRow eyebrow="Heading · Geist 600"
                       sample="Tu próximo entrenamiento"
                       cls="font-display text-2xl font-semibold tracking-[-0.02em]" />
              <TypeRow eyebrow="Body · Inter 400"
                       sample="Hoy tienes 1 sesión confirmada con Andrea a las 6:30 AM."
                       cls="font-sans text-[15px]" />
              <TypeRow eyebrow="UI · Inter 600"
                       sample="Sesiones restantes · 6 / 12"
                       cls="font-sans text-[13px] font-semibold" />
              <TypeRow eyebrow="Eyebrow · Geist Mono 500"
                       sample="PRÓXIMO ENTRENAMIENTO"
                       cls="font-mono text-[11px] font-medium uppercase tracking-[0.14em]" last />
            </div>
          </Card>
        </Section>

        <Section title="Botones">
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              <Btn>Agendar sesión</Btn>
              <Btn variant="secondary">Ver plan</Btn>
              <Btn variant="outline">Filtrar</Btn>
              <Btn variant="ghost">Cancelar</Btn>
              <Btn variant="danger" icon="x">Cancelar sesión</Btn>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Btn size="sm" icon="plus">Pequeño</Btn>
              <Btn size="md" icon="plus">Mediano</Btn>
              <Btn size="lg" icon="plus">Grande</Btn>
            </div>
          </Card>
        </Section>

        <Section title="Estados de plan & sesión">
          <Card>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_KINDS.map(kind => (
                <StatusBadge key={kind} kind={kind} />
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Iconografía">
          <Card>
            <div className="grid grid-cols-7 md:grid-cols-14 gap-3 text-fg-2">
              {ICON_SAMPLES.map(n => (
                <div key={n} className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Icon name={n} size={18} />
                  </div>
                  <span className="text-[9px] font-mono text-fg-3 truncate max-w-full">{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Voz y tono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { eyebrow: 'Eslogan', text: 'Constancia hasta el progreso.' },
              { eyebrow: 'Bienvenida', text: 'Hola Ana. Hoy toca empujar un poco.' },
              { eyebrow: 'Confirmación', text: 'Listo. Nos vemos el martes a las 6:30.' },
              { eyebrow: 'Alerta amable', text: 'Tu plan vence en 3 días. ¿Renovamos juntos?' },
              { eyebrow: 'Estado vacío', text: 'Aún no tienes sesiones esta semana. Empieza por agendar la próxima.' },
              { eyebrow: 'Error', text: 'No pudimos guardar. Revisa la conexión y vuelve a intentar.' },
            ].map(l => (
              <Card key={l.eyebrow}>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">{l.eyebrow}</div>
                <div className="font-display text-lg font-medium tracking-[-0.015em] leading-snug">"{l.text}"</div>
              </Card>
            ))}
          </div>
        </Section>

        <footer className="mt-16 pt-6 border-t border-line text-center">
          <p className="text-xs text-fg-3">
            Al Fallo · MVP · piloto colombiano · Iteración 2 ·{' '}
            <a href="https://github.com/dyoma-web/alfallo" className="text-accent hover:underline">
              github.com/dyoma-web/alfallo
            </a>
          </p>
          <p className="text-[10px] text-fg-3 mt-2">
            Operado bajo Ley 1581/2012 · Las marcas mencionadas pertenecen a sus dueños.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function ShowcaseTile({
  children,
  light = false,
  small = false,
}: {
  children: ReactNode;
  light?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-2xl flex flex-col items-center justify-center gap-2',
        small ? 'p-4 min-h-[110px]' : 'p-7 min-h-[120px]',
        light ? 'bg-fg' : 'bg-surface border border-line',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-fg-3 mt-1">
      {children}
    </span>
  );
}

function TypeRow({
  eyebrow,
  sample,
  cls,
  last = false,
}: {
  eyebrow: string;
  sample: string;
  cls: string;
  last?: boolean;
}) {
  return (
    <div className={`pb-3 ${last ? '' : 'border-b border-line'}`}>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">{eyebrow}</div>
      <div className={cls}>{sample}</div>
    </div>
  );
}
