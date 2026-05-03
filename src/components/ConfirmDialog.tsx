import { useCallback, useState, type ReactNode } from 'react';
import { Btn } from './Btn';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: IconName;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Hook para reemplazar window.confirm() con un dialog estilizado.
 *
 * Uso:
 *   const { confirm, dialog } = useConfirmDialog();
 *   const ok = await confirm({ title: '...', message: '...' });
 *   if (ok) { ... }
 *
 * Renderiza {dialog} en el JSX del componente que usa el hook.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (confirmed: boolean) => {
      request?.resolve(confirmed);
      setRequest(null);
    },
    [request]
  );

  const dialog = (
    <Modal open={!!request} onClose={() => close(false)} title={request?.title}>
      {request && (
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={[
                'w-10 h-10 rounded-xl border flex items-center justify-center flex-none',
                request.variant === 'danger'
                  ? 'bg-err/10 border-err/25 text-err-fg'
                  : 'bg-accent/10 border-accent/25 text-accent',
              ].join(' ')}
            >
              <Icon name={request.icon ?? (request.variant === 'danger' ? 'x' : 'check')} size={18} />
            </div>
            <div className="min-w-0 text-sm leading-relaxed text-fg-2">{request.message}</div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Btn type="button" variant="secondary" onClick={() => close(false)} full>
              {request.cancelLabel ?? 'Cancelar'}
            </Btn>
            <Btn
              type="button"
              variant={request.variant === 'danger' ? 'danger' : 'primary'}
              onClick={() => close(true)}
              full
            >
              {request.confirmLabel ?? 'Confirmar'}
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );

  return { confirm, dialog };
}
