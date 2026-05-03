import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Btn } from './Btn';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

interface LoadingStateProps {
  rows?: number;
  height?: number;
  className?: string;
}

export function LoadingState({ rows = 2, height = 88, className = '' }: LoadingStateProps) {
  return (
    <div className={['space-y-3', className].filter(Boolean).join(' ')}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="bg-surface border border-line rounded-2xl animate-pulse"
          style={{ height }}
        />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'No pudimos cargar esta vista',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <Card padding={20} className={['border-err/25 bg-err/5', className].filter(Boolean).join(' ')}>
      <div className="flex items-start gap-3">
        <Icon name="x" size={18} color="#FF8E8E" strokeWidth={2.2} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-err-fg font-medium">{title}</p>
          <p className="text-fg-2 text-sm mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <div className="mt-4">
              <Btn variant="secondary" size="sm" onClick={onRetry}>
                Reintentar
              </Btn>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: IconName;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon = 'list',
  title,
  description,
  action,
  className = '',
  children,
}: EmptyStateProps) {
  const button = action ? (
    <Btn size="md" icon={action.icon} onClick={action.onClick}>
      {action.label}
    </Btn>
  ) : null;

  return (
    <Card padding={32} className={className}>
      <div className="text-center max-w-sm mx-auto">
        <div className="mx-auto mb-4 w-11 h-11 rounded-full bg-surface-2 border border-line-2 flex items-center justify-center">
          <Icon name={icon} size={22} color="#6B746A" />
        </div>
        <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p className="text-fg-2 text-sm leading-relaxed mt-2">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {button && (
          <div className="mt-5">
            {action?.to ? <Link to={action.to}>{button}</Link> : button}
          </div>
        )}
      </div>
    </Card>
  );
}
