import type { ReactNode } from 'react';
import { Modal } from './Modal';

export interface DetailField {
  label: string;
  value: ReactNode;
  /** Ocupa toda la fila, no la mitad. Útil para descripciones largas. */
  fullWidth?: boolean;
}

export interface DetailSection {
  title?: string;
  description?: string;
  fields: DetailField[];
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Badge o chip que aparece junto al título (ej. estado, tipo). */
  badge?: ReactNode;
  sections: DetailSection[];
  /** Children libres entre secciones y acciones (ej. progreso, listas). */
  children?: ReactNode;
  /** Footer con botones (ej. Cerrar, Editar). */
  actions?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Modal de detalle reusable. Patrón: click en card → ver detalle (lectura),
 * separado de "editar" que sigue siendo botón explícito.
 *
 * Cada entidad admin arma sus propias `sections` y `actions`.
 */
export function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  badge,
  sections,
  children,
  actions,
  size = 'lg',
}: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      <div className="px-5 py-5 space-y-5">
        {/* Header con subtítulo y badge */}
        {(subtitle || badge) && (
          <div className="flex items-start justify-between gap-3 -mt-2">
            {subtitle && (
              <p className="text-fg-2 text-sm leading-relaxed">{subtitle}</p>
            )}
            {badge}
          </div>
        )}

        {/* Secciones de campos */}
        {sections.map((section, idx) => (
          <section key={section.title ?? `s${idx}`} className="space-y-3">
            {section.title && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
                  {section.title}
                </h3>
                {section.description && (
                  <p className="text-[12px] text-fg-3 mt-1">{section.description}</p>
                )}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {section.fields.map((f, i) => (
                <div
                  key={`${section.title ?? idx}-${i}`}
                  className={f.fullWidth ? 'col-span-2' : ''}
                >
                  <dt className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3">
                    {f.label}
                  </dt>
                  <dd className="text-fg mt-0.5">
                    {f.value === '' || f.value === null || f.value === undefined ? (
                      <span className="text-fg-3">—</span>
                    ) : (
                      f.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {children}

        {actions && (
          <div className="flex gap-2 pt-3 border-t border-line">
            {actions}
          </div>
        )}
      </div>
    </Modal>
  );
}
