import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: number;
  children: ReactNode;
}

export function Card({ padding = 16, children, className = '', style, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface border border-line rounded-2xl text-fg ${className}`}
      style={{ padding, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
