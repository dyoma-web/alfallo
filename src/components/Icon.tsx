const ICONS = {
  home:     'M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z',
  cal:      'M5 6 H19 V20 H5 Z M5 10 H19 M9 4 V8 M15 4 V8',
  plus:     'M12 5 V19 M5 12 H19',
  bolt:     'M13 3 L5 13 H11 L9 21 L17 11 H11 Z',
  user:     'M12 12 a4 4 0 1 0 0 -8 a4 4 0 0 0 0 8 Z M4 21 c1 -4 5 -6 8 -6 s7 2 8 6',
  bell:     'M6 17 V11 a6 6 0 1 1 12 0 V17 L20 19 H4 Z M10 21 H14',
  chart:    'M4 20 H20 M7 20 V12 M12 20 V6 M17 20 V14',
  flame:    'M12 3 c2 4 -2 5 0 9 c0 0 4 -2 4 -5 c2 4 1 7 -1 9 c-2 2 -7 2 -8 -2 c-1 -3 1 -5 1 -7 c2 1 1 3 1 3 c0 -3 2 -5 3 -7 Z',
  check:    'M5 12 L10 17 L20 7',
  x:        'M6 6 L18 18 M18 6 L6 18',
  arrow:    'M5 12 H19 M13 6 L19 12 L13 18',
  search:   'M11 4 a7 7 0 1 1 0 14 a7 7 0 0 1 0 -14 Z M16 16 L21 21',
  settings: 'M12 9 a3 3 0 1 0 0 6 a3 3 0 0 0 0 -6 Z M12 3 V5 M12 19 V21 M5 12 H3 M21 12 H19 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M5.6 18.4 L7 17 M17 7 L18.4 5.6',
  list:     'M4 6 H20 M4 12 H20 M4 18 H20',
  heart:    'M12 20 C5 15 3 11 3 8 a4 4 0 0 1 9 -2 a4 4 0 0 1 9 2 c0 3 -2 7 -9 12 Z',
  trophy:   'M8 4 H16 V11 a4 4 0 0 1 -8 0 Z M5 5 V8 a3 3 0 0 0 3 3 M19 5 V8 a3 3 0 0 1 -3 3 M9 16 H15 M10 20 H14 M12 16 V20',
  mapPin:   'M12 21 c5 -6 7 -10 7 -13 a7 7 0 1 0 -14 0 c0 3 2 7 7 13 Z M12 11 a3 3 0 1 0 0 -6 a3 3 0 0 0 0 6 Z',
  clock:    'M12 21 a9 9 0 1 0 0 -18 a9 9 0 0 0 0 18 Z M12 7 V12 L15.5 14',
  filter:   'M4 5 H20 L14 13 V20 L10 18 V13 Z',
  group:    'M9 12 a3 3 0 1 0 0 -6 a3 3 0 0 0 0 6 Z M16 13 a2.5 2.5 0 1 0 0 -5 a2.5 2.5 0 0 0 0 5 Z M3 20 c0 -3 3 -5 6 -5 s6 2 6 5 M14 20 c0 -2 2 -4 4 -4 s4 2 4 4',
  dot:      'M12 13 a1 1 0 1 0 0 -2 a1 1 0 0 0 0 2 Z',
  msg:      'M4 5 H20 V17 H13 L8 21 V17 H4 Z',
  shield:   'M12 3 L20 6 V12 c0 5 -4 8 -8 9 c-4 -1 -8 -4 -8 -9 V6 Z',
  edit:     'M4 20 H8 L20 8 L16 4 L4 16 Z',
  camera:   'M5 7 H8 L10 5 H14 L16 7 H19 V19 H5 Z M12 17 a4 4 0 1 0 0 -8 a4 4 0 0 0 0 8 Z',
  building: 'M5 21 V4 H13 V21 M13 9 H19 V21 M9 8 H9.01 M9 12 H9.01 M9 16 H9.01 M16 13 H16.01 M16 17 H16.01',
  rep:      'M7 14 L12 9 L17 14 M7 19 L12 14 L17 19',
  play:     'M8 5 V19 L19 12 Z',
  more:     'M5 12 h.01 M12 12 h.01 M19 12 h.01',
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
}

export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.6,
  fill = 'none',
  className,
}: IconProps) {
  const d = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none' }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
