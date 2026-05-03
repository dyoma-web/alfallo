import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/**
 * Header consistente para páginas internas: título, descripción opcional,
 * acciones a la derecha, métricas opcionales en grid.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={['mb-6', className].filter(Boolean).join(' ')}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-accent mb-1">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-fg">
            {title}
          </h1>
          {description && (
            <p className="text-fg-3 text-sm leading-relaxed mt-1.5">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>

      {meta && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {meta}
        </div>
      )}
    </header>
  );
}

interface PageMetricProps {
  label: string;
  value: string | number;
  tone?: 'default' | 'accent' | 'warn';
}

export function PageMetric({ label, value, tone = 'default' }: PageMetricProps) {
  const valueClass =
    tone === 'accent' ? 'text-accent' : tone === 'warn' ? 'text-warn' : 'text-fg';
  return (
    <div className="rounded-xl border border-line bg-surface/70 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3">
        {label}
      </div>
      <div className={['font-display text-xl font-semibold tracking-[-0.02em]', valueClass].join(' ')}>
        {value}
      </div>
    </div>
  );
}
