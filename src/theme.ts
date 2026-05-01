/**
 * Design tokens — espejo del config de Tailwind.
 * Úsalo cuando necesites un color en JS (ej. SVGs, estilos inline dinámicos).
 * Para clases utilitarias, prefiere las clases de Tailwind: bg-ink, text-fg, etc.
 */
export const theme = {
  bg: '#0F1410',
  surface: '#171D17',
  surface2: '#1F2620',
  line: 'rgba(255,255,255,0.08)',
  line2: 'rgba(255,255,255,0.14)',
  fg: '#F2F4EF',
  fg2: '#A8B0A4',
  fg3: '#6B746A',
  accent: '#C8FF3D',
  accentInk: '#0B1208',
  accentPress: '#9CCC1C',
  warn: '#FFB02E',
  err: '#FF5C5C',
  errFg: '#FF8E8E',
  ok: '#7DE08D',
  okFg: '#A6EDB1',
  info: '#7AC7FF',
  infoFg: '#A8D9FF',
} as const;

export type Theme = typeof theme;
