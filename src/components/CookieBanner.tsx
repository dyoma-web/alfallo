import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Btn } from './Btn';
import { Icon } from './Icon';

const STORAGE_KEY = 'alfallo.cookies_acknowledged';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const ack = localStorage.getItem(STORAGE_KEY);
      if (!ack) setVisible(true);
    } catch {
      // Privacy mode con storage bloqueado — no mostramos banner para no romper UX
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignorar */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de almacenamiento local"
      className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-40 bg-surface border border-line-2 rounded-2xl shadow-xl p-4"
    >
      <div className="flex items-start gap-3">
        <Icon name="shield" size={18} color="#C8FF3D" className="mt-0.5 flex-none" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm">Aviso técnico</div>
          <p className="text-fg-2 text-[12px] leading-relaxed mt-1">
            Al Fallo guarda en tu navegador información mínima para mantener tu sesión
            iniciada. No usamos cookies de seguimiento ni publicidad.{' '}
            <Link
              to="/politica-datos"
              className="text-accent underline-offset-2 hover:underline whitespace-nowrap"
            >
              Saber más
            </Link>
          </p>
          <div className="mt-3">
            <Btn size="sm" onClick={dismiss}>
              Entendido
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
