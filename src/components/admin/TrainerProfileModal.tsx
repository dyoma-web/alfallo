import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { Icon } from '../Icon';
import { useApiQuery, useApiMutation } from '../../lib/useApiQuery';

type CategoriaProfesional = 'entrenador' | 'fisio' | 'evaluador' | 'nutricionista' | 'otro';

const CATEGORIA_LABEL: Record<CategoriaProfesional, string> = {
  entrenador: 'Entrenador',
  fisio: 'Fisioterapeuta',
  evaluador: 'Evaluador',
  nutricionista: 'Nutricionista',
  otro: 'Otra',
};

interface TrainerProfile {
  user_id: string;
  perfil_profesional?: string;
  habilidades?: string;
  tipos_entrenamiento?: string;
  certificaciones?: string;
  visibilidad_default?: string;
  meta_economica_mensual?: number | string;
  meta_usuarios_activos?: number | string;
  categoria_profesional?: string;
  tipo_profesional?: string;
  franja_trabajo?: Partial<Record<DayKey, string[]>>;
}

interface ProfileForm {
  categoriaProfesional: CategoriaProfesional;
  tipoProfesional: string;
  perfilProfesional: string;
  habilidades: string;
  tiposEntrenamiento: string;
  certificaciones: string;
  visibilidadDefault: 'nombres_visibles' | 'solo_franjas';
  metaEconomicaMensual: string;
  metaUsuariosActivos: string;
}

interface Props {
  open: boolean;
  trainerId: string | null;
  trainerName?: string;
  onClose: () => void;
  onSaved: () => void;
}

type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

interface WorkRange {
  from: string;
  to: string;
}

const DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'lun', label: 'Lunes', short: 'L' },
  { key: 'mar', label: 'Martes', short: 'M' },
  { key: 'mie', label: 'Miercoles', short: 'X' },
  { key: 'jue', label: 'Jueves', short: 'J' },
  { key: 'vie', label: 'Viernes', short: 'V' },
  { key: 'sab', label: 'Sabado', short: 'S' },
  { key: 'dom', label: 'Domingo', short: 'D' },
];

const EMPTY_WORK_WINDOW: Record<DayKey, WorkRange[]> = {
  lun: [],
  mar: [],
  mie: [],
  jue: [],
  vie: [],
  sab: [],
  dom: [],
};

export function TrainerProfileModal({ open, trainerId, trainerName, onClose, onSaved }: Props) {
  const { data: existing, loading: loadingProfile, refetch } = useApiQuery<{ profile: TrainerProfile | null }>(
    'adminGetTrainerProfile',
    { userId: trainerId ?? '' },
    { enabled: open && !!trainerId, deps: [trainerId, open] }
  );
  const upsert = useApiMutation('adminUpsertTrainerProfile');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [workWindow, setWorkWindow] = useState<Record<DayKey, WorkRange[]>>(() => cloneWorkWindow(EMPTY_WORK_WINDOW));
  const [workWindowError, setWorkWindowError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      categoriaProfesional: 'entrenador',
      tipoProfesional: '',
      perfilProfesional: '',
      habilidades: '',
      tiposEntrenamiento: '',
      certificaciones: '',
      visibilidadDefault: 'solo_franjas',
      metaEconomicaMensual: '0',
      metaUsuariosActivos: '0',
    },
  });

  useEffect(() => {
    if (open && existing) {
      const p = existing.profile;
      reset({
        categoriaProfesional: (p?.categoria_profesional as CategoriaProfesional) || 'entrenador',
        tipoProfesional: p?.tipo_profesional ?? '',
        perfilProfesional: p?.perfil_profesional ?? '',
        habilidades: p?.habilidades ?? '',
        tiposEntrenamiento: p?.tipos_entrenamiento ?? '',
        certificaciones: p?.certificaciones ?? '',
        visibilidadDefault: (p?.visibilidad_default as 'nombres_visibles' | 'solo_franjas') ?? 'solo_franjas',
        metaEconomicaMensual: String(p?.meta_economica_mensual ?? '0'),
        metaUsuariosActivos: String(p?.meta_usuarios_activos ?? '0'),
      });
      setWorkWindow(parseWorkWindow(p?.franja_trabajo));
      setWorkWindowError(null);
    }
    if (!open) {
      setSavedAt(null);
      setWorkWindowError(null);
      setWorkWindow(cloneWorkWindow(EMPTY_WORK_WINDOW));
    }
  }, [open, existing, reset]);

  async function onSubmit(values: ProfileForm) {
    if (!trainerId) return;
    const franjaTrabajo = serializeWorkWindow(workWindow);
    const validationError = validateWorkWindow(franjaTrabajo);
    if (validationError) {
      setWorkWindowError(validationError);
      return;
    }
    setWorkWindowError(null);
    try {
      await upsert.mutate({
        userId: trainerId,
        categoriaProfesional: values.categoriaProfesional,
        tipoProfesional: values.tipoProfesional,
        perfilProfesional: values.perfilProfesional,
        habilidades: values.habilidades.split(',').map((s) => s.trim()).filter(Boolean),
        tiposEntrenamiento: values.tiposEntrenamiento.split(',').map((s) => s.trim()).filter(Boolean),
        certificaciones: values.certificaciones,
        visibilidadDefault: values.visibilidadDefault,
        metaEconomicaMensual: Number(values.metaEconomicaMensual) || 0,
        metaUsuariosActivos: Number(values.metaUsuariosActivos) || 0,
        franjaTrabajo,
      });
      setSavedAt(Date.now());
      void refetch();
      onSaved();
    } catch { /* */ }
  }

  function addRange(day: DayKey) {
    setWorkWindow((current) => ({
      ...current,
      [day]: [...current[day], { from: '06:00', to: '12:00' }],
    }));
  }

  function removeRange(day: DayKey, index: number) {
    setWorkWindow((current) => ({
      ...current,
      [day]: current[day].filter((_, i) => i !== index),
    }));
  }

  function updateRange(day: DayKey, index: number, patch: Partial<WorkRange>) {
    setWorkWindow((current) => ({
      ...current,
      [day]: current[day].map((range, i) => (i === index ? { ...range, ...patch } : range)),
    }));
  }

  if (!open) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={trainerName ? `Perfil profesional · ${trainerName}` : 'Perfil profesional'}
      size="lg"
    >
      {loadingProfile ? (
        <div className="px-5 py-8 animate-pulse">
          <div className="h-6 bg-surface-2 rounded mb-3" />
          <div className="h-32 bg-surface-2 rounded" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-5">
          {/* Sección: Categoría */}
          <Section
            title="Categoría profesional"
            description="Define cómo aparece en listados y filtros del admin."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="trainer-categoria"
                  className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1.5"
                >
                  Categoría
                </label>
                <select
                  id="trainer-categoria"
                  {...register('categoriaProfesional')}
                  className="w-full h-11 px-3 rounded-xl bg-surface-2 border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
                >
                  {(Object.keys(CATEGORIA_LABEL) as CategoriaProfesional[]).map((k) => (
                    <option key={k} value={k}>
                      {CATEGORIA_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Tipo / especialidad"
                placeholder="Ej. Fisioterapeuta deportiva, Coach de fuerza..."
                hint="Texto libre. Se muestra debajo del nombre."
                {...register('tipoProfesional')}
              />
            </div>
          </Section>

          {/* Sección: Perfil profesional */}
          <Section title="Información profesional">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Bio / perfil profesional
              </label>
              <textarea
                {...register('perfilProfesional')}
                rows={3}
                placeholder="Entrenador certificado en..."
                className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Habilidades (CSV)"
                placeholder="pesas, cardio, funcional"
                hint="Separadas por comas"
                {...register('habilidades')}
              />
              <Field
                label="Tipos que ofrece"
                placeholder="personalizado, semipersonalizado"
                hint="Separados por comas"
                {...register('tiposEntrenamiento')}
              />
            </div>
            <Field
              label="Certificaciones"
              placeholder="NSCA-CPT 2021, ..."
              {...register('certificaciones')}
            />
          </Section>

          {/* Sección: Visibilidad */}
          <Section
            title="Visibilidad de agenda"
            description="Cómo ven los clientes el calendario público de tu agenda."
          >
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="nombres_visibles"
                  {...register('visibilidadDefault')}
                  className="mt-1 w-4 h-4 accent-accent flex-none cursor-pointer"
                />
                <span className="text-[13px] text-fg-2">
                  <strong>Nombres visibles.</strong> Otros clientes ven el nombre de quién
                  ya agendó (útil para semi/grupal cuando los integrantes se conocen).
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="solo_franjas"
                  {...register('visibilidadDefault')}
                  className="mt-1 w-4 h-4 accent-accent flex-none cursor-pointer"
                />
                <span className="text-[13px] text-fg-2">
                  <strong>Solo franjas.</strong> Solo se muestra cuántos cupos quedan,
                  sin nombres (privacidad).
                </span>
              </label>
            </div>
          </Section>

          {/* Seccion: Franja profesional */}
          <Section
            title="Franja profesional"
            description="Horas en las que el profesional acepta reservas. Si no hay rangos, queda sin restriccion."
          >
            <div className="space-y-2">
              {DAYS.map((day) => {
                const ranges = workWindow[day.key];
                return (
                  <div key={day.key} className="rounded-xl border border-line bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-surface border border-line flex items-center justify-center text-[11px] font-mono text-fg-2">
                          {day.short}
                        </span>
                        <div className="text-sm font-medium">{day.label}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addRange(day.key)}
                        className="w-8 h-8 rounded-lg border border-line bg-surface text-fg-2 hover:text-fg hover:border-accent/40 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        aria-label={`Agregar franja para ${day.label}`}
                        title={`Agregar franja para ${day.label}`}
                      >
                        <Icon name="plus" size={14} strokeWidth={2.3} />
                      </button>
                    </div>

                    {ranges.length === 0 ? (
                      <div className="text-[12px] text-fg-3 mt-2">Sin rangos definidos</div>
                    ) : (
                      <div className="space-y-2 mt-3">
                        {ranges.map((range, index) => (
                          <div key={`${day.key}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                            <label className="block">
                              <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3 mb-1">
                                Inicio
                              </span>
                              <input
                                type="time"
                                value={range.from}
                                onChange={(e) => updateRange(day.key, index, { from: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg bg-surface border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
                              />
                            </label>
                            <label className="block">
                              <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-fg-3 mb-1">
                                Fin
                              </span>
                              <input
                                type="time"
                                value={range.to}
                                onChange={(e) => updateRange(day.key, index, { to: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg bg-surface border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeRange(day.key, index)}
                              className="w-10 h-10 rounded-lg text-fg-3 hover:text-err-fg hover:bg-err/10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-err/30"
                              aria-label={`Eliminar franja de ${day.label}`}
                              title={`Eliminar franja de ${day.label}`}
                            >
                              <Icon name="x" size={15} strokeWidth={2.3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {workWindowError && (
              <div role="alert" className="text-err-fg text-[13px]">
                {workWindowError}
              </div>
            )}
          </Section>

          {/* Sección: Metas */}
          <Section title="Metas mensuales (opcional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Meta económica (COP)"
                type="number"
                min="0"
                placeholder="6000000"
                {...register('metaEconomicaMensual')}
              />
              <Field
                label="Meta de usuarios activos"
                type="number"
                min="0"
                placeholder="20"
                {...register('metaUsuariosActivos')}
              />
            </div>
            <p className="text-[12px] text-fg-3 mt-2">
              Las metas avanzadas con anidación y alarmas llegan en una próxima iteración.
            </p>
          </Section>

          {upsert.error && (
            <div role="alert" className="text-err-fg text-[13px]">
              {upsert.error.message}
            </div>
          )}
          {savedAt && Date.now() - savedAt < 4000 && (
            <div className="text-ok-fg text-[13px] flex items-center gap-1.5">
              <Icon name="check" size={14} strokeWidth={2.5} /> Cambios guardados
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" full onClick={onClose} disabled={upsert.loading}>
              Cerrar
            </Btn>
            <Btn type="submit" full disabled={upsert.loading}>
              {upsert.loading ? 'Guardando...' : 'Guardar cambios'}
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}

function cloneWorkWindow(source: Record<DayKey, WorkRange[]>): Record<DayKey, WorkRange[]> {
  return DAYS.reduce((acc, day) => {
    acc[day.key] = source[day.key].map((range) => ({ ...range }));
    return acc;
  }, {} as Record<DayKey, WorkRange[]>);
}

function parseWorkWindow(value: TrainerProfile['franja_trabajo']): Record<DayKey, WorkRange[]> {
  const base = cloneWorkWindow(EMPTY_WORK_WINDOW);
  if (!value || typeof value !== 'object') return base;
  DAYS.forEach((day) => {
    const ranges = value[day.key];
    if (!Array.isArray(ranges)) return;
    base[day.key] = ranges
      .map((range) => {
        const [from, to] = String(range || '').split('-');
        return { from: normalizeTime(from), to: normalizeTime(to) };
      })
      .filter((range) => range.from && range.to);
  });
  return base;
}

function serializeWorkWindow(workWindow: Record<DayKey, WorkRange[]>): Partial<Record<DayKey, string[]>> {
  const result: Partial<Record<DayKey, string[]>> = {};
  DAYS.forEach((day) => {
    const ranges = workWindow[day.key]
      .map((range) => ({
        from: normalizeTime(range.from),
        to: normalizeTime(range.to),
      }))
      .filter((range) => range.from && range.to)
      .sort((a, b) => a.from.localeCompare(b.from))
      .map((range) => `${range.from}-${range.to}`);
    if (ranges.length > 0) result[day.key] = ranges;
  });
  return result;
}

function validateWorkWindow(workWindow: Partial<Record<DayKey, string[]>>): string | null {
  for (const day of DAYS) {
    const ranges = workWindow[day.key] ?? [];
    for (const range of ranges) {
      const [from, to] = range.split('-');
      if (timeToMinutes(from) >= timeToMinutes(to)) {
        return `Revisa ${day.label}: la hora de fin debe ser posterior a la de inicio.`;
      }
    }
  }
  return null;
}

function normalizeTime(value?: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!m) return '';
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function timeToMinutes(value: string): number {
  const [hh, mm] = normalizeTime(value).split(':').map(Number);
  return hh * 60 + mm;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">{title}</h3>
        {description && (
          <p className="text-[12px] text-fg-3 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
