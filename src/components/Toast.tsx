import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type ToastTone = 'success' | 'error' | 'info';

interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
}

interface ToastItem extends ToastInput {
  id: number;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE: Record<ToastTone, { icon: IconName; color: string; border: string; bg: string }> = {
  success: { icon: 'check', color: 'text-ok-fg', border: 'border-ok/25', bg: 'bg-ok/10' },
  error:   { icon: 'x',     color: 'text-err-fg', border: 'border-err/25', bg: 'bg-err/10' },
  info:    { icon: 'bell',  color: 'text-accent', border: 'border-accent/25', bg: 'bg-accent/10' },
};

let nextId = 1;

/**
 * Provider de toasts globales. Reemplaza alert() y mensajes inline para
 * confirmaciones cortas. Auto-dismiss en 4.2s.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = nextId++;
    const item: ToastItem = { id, tone: input.tone ?? 'success', ...input };
    setItems((current) => [item, ...current].slice(0, 4));
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed right-3 top-16 z-[60] flex w-[calc(100vw-24px)] max-w-sm flex-col gap-2 md:right-5"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tone = TONE[item.tone];
  return (
    <div
      className={[
        'rounded-2xl border bg-surface/95 p-3 shadow-xl backdrop-blur',
        tone.border,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className={['mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full', tone.bg, tone.color].join(' ')}>
          <Icon name={tone.icon} size={15} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-fg">{item.title}</div>
          {item.message && <div className="mt-0.5 text-[12px] leading-relaxed text-fg-2">{item.message}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-fg-3 hover:bg-surface-2 hover:text-fg"
        >
          <Icon name="x" size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
