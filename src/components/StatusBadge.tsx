const STATUS = {
  'plan-activo':   { label: 'Plan activo',           dot: '#7DE08D', bg: 'rgba(125,224,141,0.10)', fg: '#A6EDB1' },
  'plan-vence':    { label: 'Por vencer',            dot: '#FFB02E', bg: 'rgba(255,176,46,0.10)',  fg: '#FFC97A' },
  'plan-vencido':  { label: 'Plan vencido',          dot: '#FF5C5C', bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  'confirmado':    { label: 'Confirmado',            dot: '#C8FF3D', bg: 'rgba(200,255,61,0.10)',  fg: '#D8FF6E' },
  'pendiente':     { label: 'Pendiente',             dot: '#FFB02E', bg: 'rgba(255,176,46,0.10)',  fg: '#FFC97A' },
  'pactado':       { label: 'Pactado',               dot: '#7AC7FF', bg: 'rgba(122,199,255,0.10)', fg: '#A8D9FF' },
  'completado':    { label: 'Completado',            dot: '#7DE08D', bg: 'rgba(125,224,141,0.10)', fg: '#A6EDB1' },
  'cancelado':     { label: 'Cancelado',             dot: '#6B746A', bg: 'rgba(168,176,164,0.08)', fg: '#B8C0B4' },
  'no-asistido':   { label: 'No asistió',            dot: '#FF5C5C', bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  'autorizacion':  { label: 'Requiere autorización', dot: '#FFB02E', bg: 'rgba(255,176,46,0.10)',  fg: '#FFC97A' },
  'rechazado':     { label: 'Rechazado',             dot: '#FF5C5C', bg: 'rgba(255,92,92,0.10)',   fg: '#FF8E8E' },
  'fuera-ventana': { label: 'Fuera de ventana',      dot: '#6B746A', bg: 'rgba(168,176,164,0.08)', fg: '#B8C0B4' },
} as const;

export type StatusKind = keyof typeof STATUS;

interface StatusBadgeProps {
  kind: StatusKind;
  label?: string;
  className?: string;
}

export function StatusBadge({ kind, label, className = '' }: StatusBadgeProps) {
  const s = STATUS[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap leading-none ${className}`}
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot, boxShadow: `0 0 0 2px ${s.bg}` }}
      />
      {label ?? s.label}
    </span>
  );
}
