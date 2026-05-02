import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, id, type = 'text', name, className = '', ...rest }, ref) => {
    const fieldId = id ?? name ?? Math.random().toString(36).slice(2);
    const errorId = error ? `${fieldId}-error` : undefined;
    const hintId = hint ? `${fieldId}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3"
        >
          {label}
        </label>
        <input
          {...rest}
          ref={ref}
          id={fieldId}
          name={name}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={[
            'w-full h-11 px-3.5 rounded-xl',
            'bg-surface-2 border text-fg placeholder:text-fg-3',
            'focus:outline-none transition-colors',
            error
              ? 'border-err/50 focus:border-err/80'
              : 'border-line-2 focus:border-accent/60',
            className,
          ].join(' ')}
        />
        {hint && !error && (
          <p id={hintId} className="text-[12px] text-fg-3">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-[12px] text-err-fg flex items-start gap-1"
          >
            <Icon name="x" size={12} strokeWidth={2.5} className="mt-0.5 flex-none" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);
Field.displayName = 'Field';
