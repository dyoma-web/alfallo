import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { Icon } from '../Icon';
import { useApiQuery, useApiMutation } from '../../lib/useApiQuery';

interface TrainerProfile {
  user_id: string;
  perfil_profesional?: string;
  habilidades?: string;
  tipos_entrenamiento?: string;
  certificaciones?: string;
  visibilidad_default?: string;
  meta_economica_mensual?: number | string;
  meta_usuarios_activos?: number | string;
}

interface ProfileForm {
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

export function TrainerProfileModal({ open, trainerId, trainerName, onClose, onSaved }: Props) {
  const { data: existing, loading: loadingProfile, refetch } = useApiQuery<{ profile: TrainerProfile | null }>(
    'adminGetTrainerProfile',
    { userId: trainerId ?? '' },
    { enabled: open && !!trainerId, deps: [trainerId, open] }
  );
  const upsert = useApiMutation('adminUpsertTrainerProfile');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
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
        perfilProfesional: p?.perfil_profesional ?? '',
        habilidades: p?.habilidades ?? '',
        tiposEntrenamiento: p?.tipos_entrenamiento ?? '',
        certificaciones: p?.certificaciones ?? '',
        visibilidadDefault: (p?.visibilidad_default as 'nombres_visibles' | 'solo_franjas') ?? 'solo_franjas',
        metaEconomicaMensual: String(p?.meta_economica_mensual ?? '0'),
        metaUsuariosActivos: String(p?.meta_usuarios_activos ?? '0'),
      });
    }
    if (!open) setSavedAt(null);
  }, [open, existing, reset]);

  async function onSubmit(values: ProfileForm) {
    if (!trainerId) return;
    try {
      await upsert.mutate({
        userId: trainerId,
        perfilProfesional: values.perfilProfesional,
        habilidades: values.habilidades.split(',').map((s) => s.trim()).filter(Boolean),
        tiposEntrenamiento: values.tiposEntrenamiento.split(',').map((s) => s.trim()).filter(Boolean),
        certificaciones: values.certificaciones,
        visibilidadDefault: values.visibilidadDefault,
        metaEconomicaMensual: Number(values.metaEconomicaMensual) || 0,
        metaUsuariosActivos: Number(values.metaUsuariosActivos) || 0,
      });
      setSavedAt(Date.now());
      void refetch();
      onSaved();
    } catch { /* */ }
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
