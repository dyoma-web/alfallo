import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Modal } from './Modal';
import { Field } from './Field';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { useApiMutation, useApiQuery } from '../lib/useApiQuery';

type Tipo = 'crear_gimnasio' | 'crear_sede';

interface SedeForm {
  nombre: string;
  direccion: string;
  ciudad: string;
}

interface FormData {
  tipo: Tipo;
  // crear_gimnasio
  gymNombre: string;
  gymDescripcion: string;
  gymPais: string;
  sedes: SedeForm[];
  // crear_sede
  sedeGimnasioId: string;
  sedeNombre: string;
  sedeDireccion: string;
  sedeCiudad: string;
  sedeTelefono: string;
}

interface GymOption {
  id: string;
  nombre: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SolicitudFormModal({ open, onClose, onSubmitted }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const submit = useApiMutation('createSolicitud');
  const { data: gimnasios } = useApiQuery<GymOption[]>('listGimnasiosPublic', {}, { enabled: open });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      tipo: 'crear_gimnasio',
      gymNombre: '',
      gymDescripcion: '',
      gymPais: 'Colombia',
      sedes: [{ nombre: '', direccion: '', ciudad: '' }],
      sedeGimnasioId: '',
      sedeNombre: '',
      sedeDireccion: '',
      sedeCiudad: '',
      sedeTelefono: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'sedes' });
  const tipo = watch('tipo');

  useEffect(() => {
    if (open) {
      reset();
      setSubmitted(false);
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: FormData) {
    let payload: { tipo: Tipo; datos: Record<string, unknown> };
    if (values.tipo === 'crear_gimnasio') {
      payload = {
        tipo: 'crear_gimnasio',
        datos: {
          nombre: values.gymNombre,
          descripcion: values.gymDescripcion,
          pais: values.gymPais,
          sedes: values.sedes.filter((s) => s.nombre),
        },
      };
    } else {
      payload = {
        tipo: 'crear_sede',
        datos: {
          gimnasioId: values.sedeGimnasioId,
          nombre: values.sedeNombre,
          direccion: values.sedeDireccion,
          ciudad: values.sedeCiudad,
          telefono: values.sedeTelefono,
        },
      };
    }

    try {
      await submit.mutate(payload as unknown as Record<string, unknown>);
      setSubmitted(true);
    } catch { /* */ }
  }

  if (!open) return null;

  if (submitted) {
    return (
      <Modal open onClose={() => { onSubmitted(); onClose(); }} title="Solicitud enviada">
        <div className="px-5 py-5 space-y-4">
          <div className="p-3 rounded-xl bg-ok/10 border border-ok/25 text-ok-fg text-[13px] flex items-start gap-2">
            <Icon name="check" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
            <span>
              Tu solicitud quedó registrada. El equipo de administración la revisará y te
              notificará la decisión.
            </span>
          </div>
          <Btn full onClick={() => { onSubmitted(); onClose(); }}>Listo</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Solicitar nuevo gimnasio o sede" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Tipo de solicitud
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TipoChip value="crear_gimnasio" current={tipo} register={register('tipo')}>
              Nuevo gimnasio
            </TipoChip>
            <TipoChip value="crear_sede" current={tipo} register={register('tipo')}>
              Nueva sede de gimnasio existente
            </TipoChip>
          </div>
        </div>

        {tipo === 'crear_gimnasio' && (
          <>
            <Field
              label="Nombre del gimnasio"
              placeholder="Ej. Bodytech, SmartFit..."
              error={errors.gymNombre?.message}
              {...register('gymNombre', { required: 'Nombre requerido' })}
            />
            <div>
              <label htmlFor="gymDesc" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                id="gymDesc"
                {...register('gymDescripcion')}
                rows={2}
                placeholder="Cadena de gimnasios..."
                className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
              />
            </div>
            <Field label="País" placeholder="Colombia" {...register('gymPais')} />

            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Sedes (mínimo 1)
              </div>
              <div className="space-y-3">
                {fields.map((f, i) => (
                  <div key={f.id} className="bg-surface-2 border border-line rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-fg-2">Sede {i + 1}</div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="text-[12px] text-err-fg hover:text-err"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <Field
                      label="Nombre de la sede"
                      placeholder="Sede Norte"
                      error={errors.sedes?.[i]?.nombre?.message}
                      {...register(`sedes.${i}.nombre` as const, { required: 'Requerido' })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Field
                        label="Dirección"
                        placeholder="Cra 11 # 90-50"
                        {...register(`sedes.${i}.direccion` as const)}
                      />
                      <Field
                        label="Ciudad"
                        placeholder="Bogotá"
                        {...register(`sedes.${i}.ciudad` as const)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => append({ nombre: '', direccion: '', ciudad: '' })}
                className="text-[12px] text-accent hover:underline underline-offset-2 mt-2"
              >
                + Agregar otra sede
              </button>
            </div>
          </>
        )}

        {tipo === 'crear_sede' && (
          <>
            <div>
              <label htmlFor="sgym" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Gimnasio existente
              </label>
              <select
                id="sgym"
                {...register('sedeGimnasioId', { required: 'Selecciona un gimnasio' })}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
              >
                <option value="">— Elige un gimnasio —</option>
                {gimnasios?.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
              {errors.sedeGimnasioId && (
                <p className="text-err-fg text-[12px] mt-1">{errors.sedeGimnasioId.message}</p>
              )}
              <p className="text-[12px] text-fg-3 mt-1.5">
                ¿No aparece tu gimnasio? Cambia a "Nuevo gimnasio" arriba.
              </p>
            </div>
            <Field
              label="Nombre de la sede"
              placeholder="Ej. Sede Chapinero"
              error={errors.sedeNombre?.message}
              {...register('sedeNombre', { required: 'Nombre requerido' })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Dirección" {...register('sedeDireccion')} />
              <Field label="Ciudad" placeholder="Bogotá" {...register('sedeCiudad')} />
            </div>
            <Field label="Teléfono" type="tel" {...register('sedeTelefono')} />
          </>
        )}

        {submit.error && (
          <div role="alert" className="text-err-fg text-[13px]">{submit.error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={submit.loading}>Cancelar</Btn>
          <Btn type="submit" full disabled={submit.loading}>
            {submit.loading ? 'Enviando...' : 'Enviar solicitud'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function TipoChip({
  value,
  current,
  register,
  children,
}: {
  value: Tipo;
  current: Tipo;
  register: ReturnType<ReturnType<typeof useForm<FormData>>['register']>;
  children: React.ReactNode;
}) {
  const checked = current === value;
  return (
    <label
      className={[
        'p-3 rounded-xl border cursor-pointer text-center text-[13px] transition-colors',
        checked
          ? 'bg-accent/10 border-accent/40 text-accent'
          : 'bg-surface-2 border-line-2 text-fg-2 hover:border-line-2',
      ].join(' ')}
    >
      <input {...register} type="radio" value={value} className="sr-only" />
      <div className="font-medium">{children}</div>
    </label>
  );
}
