import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  full?: boolean;
  children?: ReactNode;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-[52px] px-5 text-[15px] gap-2',
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-accent text-accent-ink border-transparent hover:bg-accent-press',
  secondary: 'bg-surface-2 text-fg border-line-2 hover:bg-surface',
  ghost:     'bg-transparent text-fg border-transparent hover:bg-surface',
  danger:    'bg-err/10 text-err-fg border-err/25 hover:bg-err/20',
  outline:   'bg-transparent text-fg border-line-2 hover:bg-surface',
};

export function Btn({
  variant = 'primary',
  size = 'md',
  icon,
  full = false,
  children,
  className = '',
  ...rest
}: BtnProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button
      className={[
        'inline-flex items-center justify-center',
        'rounded-full border font-semibold tracking-tight',
        'transition-transform duration-100 active:scale-[0.985]',
        'focus-ring',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        full ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} strokeWidth={2} />}
      {children}
    </button>
  );
}
