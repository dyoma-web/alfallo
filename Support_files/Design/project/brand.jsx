// brand.jsx — Al Fallo brand foundations + UI primitives
// Exports (to window): Logo, Repmark, Palette, TypeSpec, Components, StatusBadge, Icon, Card, Btn, theme

const theme = {
  bg: '#0F1410',
  surface: '#171D17',
  surface2: '#1F2620',
  line: 'rgba(255,255,255,0.08)',
  line2: 'rgba(255,255,255,0.14)',
  fg: '#F2F4EF',
  fg2: '#A8B0A4',
  fg3: '#6B746A',
  accent: '#C8FF3D',         // lime — energy
  accentInk: '#0B1208',
  warn: '#FFB02E',
  err:  '#FF5C5C',
  ok:   '#7DE08D',
  info: '#7AC7FF',
  font: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  display: '"Geist", "Inter", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// ──────────────────────────────────────────────────────────
// Repmark — abstract chevron stack suggesting progression /
// "al fallo" peak rep. Two stacked chevrons + a baseline.
// ──────────────────────────────────────────────────────────
function Repmark({ size = 32, color = theme.accent, ink = theme.bg, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={ink}/>
      <path d="M7 19 L16 11 L25 19" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter"/>
      <path d="M7 25 L16 17 L25 25" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45"/>
    </svg>
  );
}

// Repmark without container — for headers, on-tile usage
function RepmarkBare({ size = 24, color = theme.accent, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style} aria-hidden="true">
      <path d="M7 19 L16 11 L25 19" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter"/>
      <path d="M7 25 L16 17 L25 25" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45"/>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// Logo — wordmark "alfallo" lowercase, slash separator
// ──────────────────────────────────────────────────────────
function Logo({ size = 28, color = theme.fg, accent = theme.accent, mark = true, style = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.36, ...style }}>
      {mark && <Repmark size={size * 1.25} color={accent} ink="transparent" />}
      <span style={{
        fontFamily: theme.display, fontWeight: 700, fontSize: size,
        letterSpacing: '-0.04em', color, lineHeight: 1, display: 'inline-flex', alignItems: 'baseline',
      }}>
        al<span style={{ color: accent }}>/</span>fallo
      </span>
    </div>
  );
}

function LogoCompact({ size = 40, accent = theme.accent, ink = theme.bg }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25, background: ink,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      <RepmarkBare size={size * 0.62} color={accent} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Icons — minimal stroke set, 24px grid
// ──────────────────────────────────────────────────────────
const ICONS = {
  home:    'M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z',
  cal:     'M5 6 H19 V20 H5 Z M5 10 H19 M9 4 V8 M15 4 V8',
  plus:    'M12 5 V19 M5 12 H19',
  bolt:    'M13 3 L5 13 H11 L9 21 L17 11 H11 Z',
  user:    'M12 12 a4 4 0 1 0 0 -8 a4 4 0 0 0 0 8 Z M4 21 c1 -4 5 -6 8 -6 s7 2 8 6',
  bell:    'M6 17 V11 a6 6 0 1 1 12 0 V17 L20 19 H4 Z M10 21 H14',
  chart:   'M4 20 H20 M7 20 V12 M12 20 V6 M17 20 V14',
  flame:   'M12 3 c2 4 -2 5 0 9 c0 0 4 -2 4 -5 c2 4 1 7 -1 9 c-2 2 -7 2 -8 -2 c-1 -3 1 -5 1 -7 c2 1 1 3 1 3 c0 -3 2 -5 3 -7 Z',
  check:   'M5 12 L10 17 L20 7',
  x:       'M6 6 L18 18 M18 6 L6 18',
  arrow:   'M5 12 H19 M13 6 L19 12 L13 18',
  search:  'M11 4 a7 7 0 1 1 0 14 a7 7 0 0 1 0 -14 Z M16 16 L21 21',
  settings:'M12 9 a3 3 0 1 0 0 6 a3 3 0 0 0 0 -6 Z M12 3 V5 M12 19 V21 M5 12 H3 M21 12 H19 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M5.6 18.4 L7 17 M17 7 L18.4 5.6',
  list:    'M4 6 H20 M4 12 H20 M4 18 H20',
  heart:   'M12 20 C5 15 3 11 3 8 a4 4 0 0 1 9 -2 a4 4 0 0 1 9 2 c0 3 -2 7 -9 12 Z',
  trophy:  'M8 4 H16 V11 a4 4 0 0 1 -8 0 Z M5 5 V8 a3 3 0 0 0 3 3 M19 5 V8 a3 3 0 0 1 -3 3 M9 16 H15 M10 20 H14 M12 16 V20',
  mapPin:  'M12 21 c5 -6 7 -10 7 -13 a7 7 0 1 0 -14 0 c0 3 2 7 7 13 Z M12 11 a3 3 0 1 0 0 -6 a3 3 0 0 0 0 6 Z',
  clock:   'M12 21 a9 9 0 1 0 0 -18 a9 9 0 0 0 0 18 Z M12 7 V12 L15.5 14',
  filter:  'M4 5 H20 L14 13 V20 L10 18 V13 Z',
  group:   'M9 12 a3 3 0 1 0 0 -6 a3 3 0 0 0 0 6 Z M16 13 a2.5 2.5 0 1 0 0 -5 a2.5 2.5 0 0 0 0 5 Z M3 20 c0 -3 3 -5 6 -5 s6 2 6 5 M14 20 c0 -2 2 -4 4 -4 s4 2 4 4',
  dot:     'M12 13 a1 1 0 1 0 0 -2 a1 1 0 0 0 0 2 Z',
  msg:     'M4 5 H20 V17 H13 L8 21 V17 H4 Z',
  shield:  'M12 3 L20 6 V12 c0 5 -4 8 -8 9 c-4 -1 -8 -4 -8 -9 V6 Z',
  edit:    'M4 20 H8 L20 8 L16 4 L4 16 Z',
  camera:  'M5 7 H8 L10 5 H14 L16 7 H19 V19 H5 Z M12 17 a4 4 0 1 0 0 -8 a4 4 0 0 0 0 8 Z',
  building:'M5 21 V4 H13 V21 M13 9 H19 V21 M9 8 H9.01 M9 12 H9.01 M9 16 H9.01 M16 13 H16.01 M16 17 H16.01',
  rep:     'M7 14 L12 9 L17 14 M7 19 L12 14 L17 19',
  play:    'M8 5 V19 L19 12 Z',
  more:    'M5 12 h.01 M12 12 h.01 M19 12 h.01',
};

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.6, fill = 'none', style = {} }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', ...style }} aria-hidden="true">
      <path d={d}/>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// Status badge — semantic states for plans + sessions
// ──────────────────────────────────────────────────────────
const STATUS = {
  // Plan
  'plan-activo':    { label: 'Plan activo',     dot: theme.ok,    bg: 'rgba(125,224,141,0.10)', fg: '#A6EDB1' },
  'plan-vence':     { label: 'Por vencer',      dot: theme.warn,  bg: 'rgba(255,176,46,0.10)',  fg: '#FFC97A' },
  'plan-vencido':   { label: 'Plan vencido',    dot: theme.err,   bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  // Session
  'confirmado':     { label: 'Confirmado',      dot: theme.accent,bg: 'rgba(200,255,61,0.10)',  fg: '#D8FF6E' },
  'pendiente':      { label: 'Pendiente',       dot: theme.warn,  bg: 'rgba(255,176,46,0.10)',  fg: '#FFC97A' },
  'pactado':        { label: 'Pactado',         dot: theme.info,  bg: 'rgba(122,199,255,0.10)', fg: '#A8D9FF' },
  'completado':     { label: 'Completado',      dot: theme.ok,    bg: 'rgba(125,224,141,0.10)', fg: '#A6EDB1' },
  'cancelado':      { label: 'Cancelado',       dot: theme.fg3,   bg: 'rgba(168,176,164,0.08)', fg: '#B8C0B4' },
  'no-asistido':    { label: 'No asistió',      dot: theme.err,   bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  'autorizacion':   { label: 'Requiere autorización', dot: theme.warn, bg: 'rgba(255,176,46,0.10)', fg: '#FFC97A' },
  'rechazado':      { label: 'Rechazado',       dot: theme.err,   bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  'fuera-ventana':  { label: 'Fuera de ventana',dot: theme.fg3,   bg: 'rgba(168,176,164,0.08)', fg: '#B8C0B4' },
};

function StatusBadge({ kind, label, style = {} }) {
  const s = STATUS[kind] || { label: label || kind, dot: theme.fg2, bg: 'rgba(255,255,255,0.06)', fg: theme.fg2 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px 4px 7px', borderRadius: 999, background: s.bg, color: s.fg,
      fontFamily: theme.font, fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
      lineHeight: 1, whiteSpace: 'nowrap', ...style,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.dot, boxShadow: `0 0 0 2px ${s.bg}` }}/>
      {label || s.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// Card / Btn primitives
// ──────────────────────────────────────────────────────────
function Card({ children, style = {}, padding = 16, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 16,
      padding, color: theme.fg, ...style,
    }}>{children}</div>
  );
}

function Btn({ children, variant = 'primary', size = 'md', icon, onClick, style = {}, full }) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 40, px: 16, fs: 14 },
    lg: { h: 52, px: 20, fs: 15 },
  };
  const s = sizes[size];
  const variants = {
    primary:    { bg: theme.accent, fg: theme.accentInk, bd: 'transparent' },
    secondary:  { bg: theme.surface2, fg: theme.fg, bd: theme.line2 },
    ghost:      { bg: 'transparent', fg: theme.fg, bd: 'transparent' },
    danger:     { bg: 'rgba(255,92,92,0.10)', fg: '#FF8E8E', bd: 'rgba(255,92,92,0.25)' },
    outline:    { bg: 'transparent', fg: theme.fg, bd: theme.line2 },
  }[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`, gap: 8,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: variants.bg, color: variants.fg, border: `1px solid ${variants.bd}`,
      borderRadius: 999, fontFamily: theme.font, fontSize: s.fs, fontWeight: 600,
      letterSpacing: '-0.01em', cursor: 'pointer', width: full ? '100%' : 'auto',
      transition: 'transform .12s, opacity .12s', ...style,
    }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.985)'}
       onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
       onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} color="currentColor" strokeWidth={2}/>}
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// Brand foundation cards (for the design canvas)
// ──────────────────────────────────────────────────────────
function Palette() {
  const stops = [
    { name: 'Ink',     hex: '#0F1410', use: 'Background' },
    { name: 'Surface', hex: '#171D17', use: 'Cards' },
    { name: 'Surface 2', hex: '#1F2620', use: 'Elevated' },
    { name: 'Lime 500', hex: '#C8FF3D', use: 'Accent · Action' },
    { name: 'Lime 700', hex: '#9CCC1C', use: 'Hover · Press' },
    { name: 'Foreground', hex: '#F2F4EF', use: 'Body text' },
    { name: 'FG Muted', hex: '#A8B0A4', use: 'Secondary' },
    { name: 'FG Faint', hex: '#6B746A', use: 'Tertiary' },
  ];
  const semantic = [
    { name: 'Success',  hex: theme.ok,   note: 'Confirmado · Completado · Plan activo' },
    { name: 'Warning',  hex: theme.warn, note: 'Pendiente · Por vencer · Autorización' },
    { name: 'Error',    hex: theme.err,  note: 'Vencido · Rechazado · No asistió' },
    { name: 'Info',     hex: theme.info, note: 'Pactado · Avisos' },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Núcleo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {stops.map(s => (
            <div key={s.hex} style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 64, background: s.hex, borderBottom: `1px solid ${theme.line}` }}/>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: theme.font, fontSize: 12, fontWeight: 600, color: theme.fg }}>{s.name}</div>
                <div style={{ fontFamily: theme.mono, fontSize: 10, color: theme.fg3, marginTop: 2 }}>{s.hex}</div>
                <div style={{ fontFamily: theme.font, fontSize: 11, color: theme.fg2, marginTop: 4 }}>{s.use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Semántica</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {semantic.map(s => (
            <div key={s.hex} style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.hex }}/>
                <div>
                  <div style={{ fontFamily: theme.font, fontSize: 12, fontWeight: 600, color: theme.fg }}>{s.name}</div>
                  <div style={{ fontFamily: theme.mono, fontSize: 10, color: theme.fg3 }}>{s.hex}</div>
                </div>
              </div>
              <div style={{ fontFamily: theme.font, fontSize: 11, color: theme.fg2, marginTop: 8, lineHeight: 1.4 }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sectionLabel = {
  fontFamily: theme.mono, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.fg3,
};

function TypeSpec() {
  const rows = [
    { sample: 'Entrena con propósito.', font: theme.display, size: 40, weight: 700, ls: '-0.03em', label: 'Display · Geist 700' },
    { sample: 'Tu próximo entrenamiento', font: theme.display, size: 24, weight: 600, ls: '-0.02em', label: 'Heading · Geist 600' },
    { sample: 'Hoy tienes 1 sesión confirmada con Andrea a las 6:30 AM.', font: theme.font, size: 15, weight: 400, ls: '0', label: 'Body · Inter 400' },
    { sample: 'PRÓXIMO ENTRENAMIENTO', font: theme.mono, size: 11, weight: 500, ls: '0.14em', label: 'Eyebrow · Geist Mono 500', upper: true },
    { sample: 'Sesiones restantes · 6 / 12', font: theme.font, size: 13, weight: 600, ls: '-0.005em', label: 'UI · Inter 600' },
  ];
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ paddingBottom: 14, borderBottom: i < rows.length - 1 ? `1px solid ${theme.line}` : 'none' }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>{r.label}</div>
          <div style={{
            fontFamily: r.font, fontSize: r.size, fontWeight: r.weight, letterSpacing: r.ls,
            color: theme.fg, lineHeight: 1.15, textTransform: r.upper ? 'uppercase' : 'none',
          }}>{r.sample}</div>
        </div>
      ))}
    </div>
  );
}

// Logo lockups card
function LogoLockups() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: theme.bg, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
          <Logo size={28} />
        </div>
        <div style={{ background: '#F2F4EF', borderRadius: 14, padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
          <Logo size={28} color="#0F1410" accent="#0F1410" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120 }}>
          <LogoCompact size={56} />
          <div style={{ ...sectionLabel, marginTop: 4 }}>App icon</div>
        </div>
        <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120 }}>
          <Repmark size={48} />
          <div style={{ ...sectionLabel, marginTop: 4 }}>Símbolo</div>
        </div>
        <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120 }}>
          <Logo size={18} mark={false}/>
          <div style={{ ...sectionLabel, marginTop: 4 }}>Wordmark</div>
        </div>
      </div>
    </div>
  );
}

// Components catalog card
function Components() {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Botones</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Btn>Agendar sesión</Btn>
          <Btn variant="secondary">Ver plan</Btn>
          <Btn variant="outline">Filtrar</Btn>
          <Btn variant="ghost">Cancelar</Btn>
          <Btn variant="danger" icon="x">Cancelar sesión</Btn>
        </div>
      </div>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Estados de plan & sesión</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <StatusBadge kind="plan-activo"/>
          <StatusBadge kind="plan-vence"/>
          <StatusBadge kind="plan-vencido"/>
          <StatusBadge kind="confirmado"/>
          <StatusBadge kind="pendiente"/>
          <StatusBadge kind="pactado"/>
          <StatusBadge kind="completado"/>
          <StatusBadge kind="cancelado"/>
          <StatusBadge kind="no-asistido"/>
          <StatusBadge kind="autorizacion"/>
          <StatusBadge kind="fuera-ventana"/>
        </div>
      </div>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Inputs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FakeInput label="Correo" value="ana.morales@correo.co"/>
          <FakeInput label="Contraseña" value="••••••••••" />
          <FakeSelect label="Sede" value="Sede Norte · Cra 11"/>
          <FakeInput label="Buscar usuario" value="" placeholder="Nombre, nick o cédula" icon="search"/>
        </div>
      </div>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Tarjeta de sesión</div>
        <SessionCard
          time="06:30" duration="60 min" trainer="Andrea G." kind="Personalizado"
          sede="Sede Norte" status="confirmado"
        />
      </div>
    </div>
  );
}

function FakeInput({ label, value, placeholder, icon }) {
  return (
    <div>
      <div style={{ ...sectionLabel, marginBottom: 6 }}>{label}</div>
      <div style={{
        height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: theme.surface2, border: `1px solid ${theme.line2}`, borderRadius: 12,
        fontFamily: theme.font, fontSize: 14, color: value ? theme.fg : theme.fg3,
      }}>
        {icon && <Icon name={icon} size={16} color={theme.fg3}/>}
        {value || placeholder}
      </div>
    </div>
  );
}
function FakeSelect({ label, value }) {
  return (
    <div>
      <div style={{ ...sectionLabel, marginBottom: 6 }}>{label}</div>
      <div style={{
        height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: theme.surface2, border: `1px solid ${theme.line2}`, borderRadius: 12,
        fontFamily: theme.font, fontSize: 14, color: theme.fg,
      }}>
        <span>{value}</span>
        <Icon name="arrow" size={16} color={theme.fg3} style={{ transform: 'rotate(90deg)' }}/>
      </div>
    </div>
  );
}

function SessionCard({ time, duration, trainer, kind, sede, status }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 14, alignItems: 'center',
      background: theme.surface2, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 14,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: theme.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: theme.fg, lineHeight: 1 }}>{time}</div>
        <div style={{ fontFamily: theme.mono, fontSize: 10, color: theme.fg3, marginTop: 4 }}>{duration}</div>
      </div>
      <div>
        <div style={{ fontFamily: theme.font, fontSize: 14, fontWeight: 600, color: theme.fg }}>{kind} · {trainer}</div>
        <div style={{ fontFamily: theme.font, fontSize: 12, color: theme.fg2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="mapPin" size={12} color={theme.fg3}/>{sede}
        </div>
      </div>
      <StatusBadge kind={status}/>
    </div>
  );
}

// Voice & messaging card
function VoiceCard() {
  const lines = [
    { eyebrow: 'Eslogan', text: 'Constancia hasta el progreso.' },
    { eyebrow: 'Bienvenida', text: 'Hola Ana. Hoy toca empujar un poco.' },
    { eyebrow: 'Confirmación', text: 'Listo. Nos vemos el martes a las 6:30.' },
    { eyebrow: 'Alerta amable', text: 'Tu plan vence en 3 días. ¿Renovamos juntos?' },
    { eyebrow: 'Estado vacío', text: 'Aún no tienes sesiones esta semana. Empieza por agendar la próxima.' },
    { eyebrow: 'Error', text: 'No pudimos guardar. Revisa la conexión y vuelve a intentar.' },
  ];
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ paddingBottom: 12, borderBottom: i < lines.length - 1 ? `1px solid ${theme.line}` : 'none' }}>
          <div style={{ ...sectionLabel, marginBottom: 6 }}>{l.eyebrow}</div>
          <div style={{ fontFamily: theme.display, fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', color: theme.fg, lineHeight: 1.35 }}>"{l.text}"</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  theme, Logo, LogoCompact, Repmark, RepmarkBare, Icon, StatusBadge, Card, Btn,
  Palette, TypeSpec, LogoLockups, Components, VoiceCard, SessionCard, sectionLabel,
});
