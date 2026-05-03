import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Logo } from './Logo';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Catch sincrónico de errores de render en cualquier hijo. Muestra una
 * pantalla recuperable con botón de recarga. Loguea a console solo en dev.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Error inesperado',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-ink text-fg flex items-center justify-center px-5">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Logo size={28} />
          </div>
          <div className="bg-surface border border-line rounded-2xl p-6">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">
              Algo se trabó
            </h1>
            <p className="text-fg-2 text-sm leading-relaxed mt-2">
              La interfaz encontró un error local. Puedes recargar para volver a montar la app.
            </p>
            {this.state.message && (
              <pre className="mt-4 max-h-28 overflow-auto rounded-xl bg-ink border border-line p-3 text-left text-[11px] text-fg-3 whitespace-pre-wrap">
                {this.state.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-press focus-ring"
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
