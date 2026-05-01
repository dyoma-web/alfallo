import type { CSSProperties } from 'react';
import { theme } from '../theme';

interface RepmarkProps {
  size?: number;
  color?: string;
  ink?: string;
  className?: string;
}

export function Repmark({ size = 32, color = theme.accent, ink = theme.bg, className }: RepmarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={ink} />
      <path d="M7 19 L16 11 L25 19" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M7 25 L16 17 L25 25" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
    </svg>
  );
}

export function RepmarkBare({
  size = 24,
  color = theme.accent,
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M7 19 L16 11 L25 19" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M7 25 L16 17 L25 25" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  color?: string;
  accent?: string;
  mark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Logo({
  size = 28,
  color = theme.fg,
  accent = theme.accent,
  mark = true,
  className,
  style,
}: LogoProps) {
  return (
    <div
      className={`inline-flex items-center ${className ?? ''}`}
      style={{ gap: size * 0.36, ...style }}
    >
      {mark && <Repmark size={size * 1.25} color={accent} ink="transparent" />}
      <span
        className="font-display font-bold inline-flex items-baseline leading-none"
        style={{
          fontSize: size,
          letterSpacing: '-0.04em',
          color,
        }}
      >
        al<span style={{ color: accent }}>/</span>fallo
      </span>
    </div>
  );
}

export function LogoCompact({
  size = 40,
  accent = theme.accent,
  ink = theme.bg,
}: {
  size?: number;
  accent?: string;
  ink?: string;
}) {
  return (
    <div
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: ink,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <RepmarkBare size={size * 0.62} color={accent} />
    </div>
  );
}
