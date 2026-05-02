import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Tamaño máximo. md (default) ≈ 420px, lg ≈ 560px */
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          'relative w-full bg-surface border-t md:border border-line',
          'rounded-t-2xl md:rounded-2xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          maxWidth,
        ].join(' ')}
      >
        {title && (
          <header className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
            <h2 id="modal-title" className="font-display text-lg font-semibold tracking-[-0.02em]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-full hover:bg-surface-2 flex items-center justify-center text-fg-2 hover:text-fg transition-colors"
            >
              <Icon name="x" size={16} strokeWidth={2} />
            </button>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
