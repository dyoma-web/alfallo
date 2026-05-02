import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useApiMutation } from '../../lib/useApiQuery';

interface Gimnasio {
  id: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  pais?: string;
  verificado?: boolean | string;
  estado?: string;
}

interface GymForm {
  nombre: string;
  descripcion: string;
  logoUrl: string;
  pais: string;
  verificado: boolean;
}

interface Props {
  open: boolean;
  initialGym?: Gimnasio | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GimnasioFormModal({ open, initialGym, onClose, onSaved }: Props) {
  const isEdit = !!initialGym;
  const create = useApiMutation('adminCreateGimnasio');
  const update = useApiMutation('adminUpdateGimnasio');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GymForm>({
    defaultValues: { nombre: '', descripcion: '', logoUrl: '', pais: 'Colombia', verificado: false },
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: initialGym?.nombre ?? '',
        descripcion: initialGym?.descripcion ?? '',
        logoUrl: initialGym?.logo_url ?? '',
        pais: initialGym?.pais ?? 'Colombia',
        verificado: initialGym?.verificado === true || initialGym?.verificado === 'TRUE',
      });
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialGym]);

  async function onSubmit(values: GymForm) {
    const payload: Record<string, unknown> = { ...values };
    try {
      if (isEdit && initialGym) {
        await update.mutate({ gimnasioId: initialGym.id, ...payload });
      } else {
        await create.mutate(payload);
      }
      onSaved();
    } catch { /* error en hook */ }
  }

  if (!open) return null;
  const error = create.error || update.error;
  const submitting = create.loading || update.loading;

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Editar gimnasio' : 'Nuevo gimnasio'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <Field
          label="Nombre"
          placeholder="Ej. Bodytech, SmartFit, Stark..."
          error={errors.nombre?.message}
          {...register('nombre', { required: 'Nombre requerido' })}
        />

        <div>
          <label htmlFor="desc" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            id="desc"
            {...register('descripcion')}
            rows={2}
            placeholder="Cadena de gimnasios con presencia en..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="País"
            placeholder="Colombia"
            {...register('pais')}
          />
          <Field
            label="URL del logo (opcional)"
            placeholder="https://..."
            {...register('logoUrl')}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            {...register('verificado')}
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded accent-accent flex-none cursor-pointer"
          />
          <span className="text-[13px] text-fg-2 leading-relaxed">
            <strong>Marca verificada</strong>. Activa esta opción solo si el dueño legal de la
            marca ha confirmado el registro en la plataforma.
          </span>
        </label>

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">{error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={submitting}>Cancelar</Btn>
          <Btn type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear gimnasio'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
