import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useApiMutation } from '../../lib/useApiQuery';

interface Sede {
  id: string;
  nombre: string;
  codigo_interno?: string;
  direccion?: string;
  ciudad?: string;
  barrio?: string;
  telefono?: string;
  responsable?: string;
  capacidad?: number | string;
  observaciones?: string;
  servicios?: string;
  reglas?: string;
  estado?: string;
}

interface SedeForm {
  nombre: string;
  codigoInterno: string;
  direccion: string;
  ciudad: string;
  barrio: string;
  telefono: string;
  responsable: string;
  capacidad: string;
  observaciones: string;
  servicios: string;
  reglas: string;
}

interface Props {
  open: boolean;
  initialSede?: Sede | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SedeFormModal({ open, initialSede, onClose, onSaved }: Props) {
  const isEdit = !!initialSede;
  const create = useApiMutation('adminCreateSede');
  const update = useApiMutation('adminUpdateSede');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SedeForm>({
    defaultValues: {
      nombre: '',
      codigoInterno: '',
      direccion: '',
      ciudad: '',
      barrio: '',
      telefono: '',
      responsable: '',
      capacidad: '',
      observaciones: '',
      servicios: '',
      reglas: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: initialSede?.nombre ?? '',
        codigoInterno: initialSede?.codigo_interno ?? '',
        direccion: initialSede?.direccion ?? '',
        ciudad: initialSede?.ciudad ?? '',
        barrio: initialSede?.barrio ?? '',
        telefono: initialSede?.telefono ?? '',
        responsable: initialSede?.responsable ?? '',
        capacidad: initialSede?.capacidad ? String(initialSede.capacidad) : '',
        observaciones: initialSede?.observaciones ?? '',
        servicios: initialSede?.servicios ?? '',
        reglas: initialSede?.reglas ?? '',
      });
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSede]);

  async function onSubmit(values: SedeForm) {
    const payload = {
      ...values,
      capacidad: values.capacidad ? Number(values.capacidad) : undefined,
    };
    try {
      if (isEdit && initialSede) {
        await update.mutate({ sedeId: initialSede.id, ...payload });
      } else {
        await create.mutate(payload);
      }
      onSaved();
    } catch {
      /* error en hook */
    }
  }

  if (!open) return null;
  const error = create.error || update.error;
  const submitting = create.loading || update.loading;

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Editar sede' : 'Crear sede'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nombre"
            placeholder="Ej. Sede Norte"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'Nombre requerido' })}
          />
          <Field
            label="Código interno (opcional)"
            placeholder="NOR-01"
            {...register('codigoInterno')}
          />
        </div>

        <Field
          label="Dirección"
          placeholder="Cra 11 # 90-50"
          {...register('direccion')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ciudad" placeholder="Bogotá" {...register('ciudad')} />
          <Field label="Barrio (opcional)" placeholder="Chicó" {...register('barrio')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Teléfono"
            type="tel"
            placeholder="6011234567"
            {...register('telefono')}
          />
          <Field label="Responsable" placeholder="Nombre del responsable" {...register('responsable')} />
        </div>

        <Field
          label="Capacidad (personas simultáneas)"
          type="number"
          min="0"
          placeholder="50"
          {...register('capacidad')}
        />

        <Field
          label="Servicios (separados por comas)"
          placeholder="pesas, cardio, funcional, piscina"
          hint="Ej: pesas,cardio,funcional"
          {...register('servicios')}
        />

        <div>
          <label
            htmlFor="reglas"
            className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2"
          >
            Reglas operativas (opcional)
          </label>
          <textarea
            id="reglas"
            {...register('reglas')}
            rows={2}
            placeholder="Toalla obligatoria, limpiar equipos..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        <div>
          <label
            htmlFor="obs"
            className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2"
          >
            Observaciones (opcional)
          </label>
          <textarea
            id="obs"
            {...register('observaciones')}
            rows={2}
            placeholder="Notas internas..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">
            {error.message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={submitting}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear sede'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
