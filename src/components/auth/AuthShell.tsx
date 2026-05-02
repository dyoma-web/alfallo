import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Card } from '../Card';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-5 md:px-8 pt-6">
        <Link to="/" aria-label="Inicio Al Fallo">
          <Logo size={24} />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <Card padding={28} className="md:!p-9">
            <div className="mb-6">
              <h1 className="font-display text-2xl md:text-[28px] font-semibold tracking-[-0.02em] leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-fg-2 mt-2 leading-relaxed">{subtitle}</p>
              )}
            </div>
            {children}
          </Card>
          {footer && <div className="mt-4 text-center">{footer}</div>}
        </div>
      </main>

      <footer className="px-5 py-5 text-center">
        <p className="text-[11px] text-fg-3">
          <Link to="/politica-datos" className="hover:text-fg-2 underline-offset-2 hover:underline">
            Política de Datos
          </Link>
          {' · '}
          <Link to="/terminos" className="hover:text-fg-2 underline-offset-2 hover:underline">
            Términos
          </Link>
          {' · '}
          Al Fallo opera bajo Ley 1581/2012
        </p>
      </footer>
    </div>
  );
}
