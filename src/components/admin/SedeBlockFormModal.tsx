import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useApiMutation } from '../../lib/useApiQuery';

interface SedeOption {
  id: string;
  nombre?: string;
  ciudad?: string;
}

interface FormData {
  sedeId: string;
  motivo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

interface Props {
  open: boolean;
  sedes: SedeOption[];
  initialSedeId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

export function SedeBlockFormModal({
  open,
  sedes,
  initialSedeId,
  onClose,
  onSaved,
}: Props) {
  const create = useApiMutation('createSedeBlock');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      sedeId: '',
      motivo: '',
      fecha: '',
      horaInicio: '09:00',
      horaFin: '12:00',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      sedeId: initialSedeId || '',
      motivo: '',
      fecha: dateStr(new Date()),
      horaInicio: '09:00',
      horaFin: '12:00',
    });
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSedeId]);

  async function onSubmit(values: FormData) {
    const desdeUtc = new Date(`${values.fecha}T${values.horaInicio}:00`).toISOString();
    const hastaUtc = new Date(`${values.fecha}T${values.horaFin}:00`).toISOString();
    if (new Date(hastaUtc) <= new Date(desdeUtc)) return;

    try {
      await create.mutate({
        sedeId: values.sedeId,
        motivo: values.motivo || 'Sede bloqueada',
        desdeUtc,
        hastaUtc,
      });
      onSaved();
    } catch {
      /* error en hook */
    }
  }

  if (!open) return null;

  return (
    <Modal open onClose={onClose} title="Bloquear sede" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <div>
          <label htmlFor="sedeId" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Sede
          </label>
          <select
            id="sedeId"
            {...register('sedeId', { required: 'Sede requerida' })}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="">Selecciona una sede</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ciudad ? `${s.nombre} · ${s.ciudad}` : (s.nombre ?? s.id)}
              </option>
            ))}
          </select>
          {errors.sedeId && (
            <p className="text-err-fg text-[12px] mt-1.5">{errors.sedeId.message}</p>
          )}
        </div>

        <Field
          label="Motivo"
          placeholder="Ej. Mantenimiento, evento privado, cierre temporal"
          error={errors.motivo?.message}
          {...register('motivo', { required: 'Motivo requerido' })}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field
            label="Fecha"
            type="date"
            className="[color-scheme:dark]"
            error={errors.fecha?.message}
            {...register('fecha', { required: 'Fecha requerida' })}
          />
          <Field
            label="Desde"
            type="time"
            step={1800}
            className="[color-scheme:dark]"
            {...register('horaInicio', { required: 'Requerido' })}
          />
          <Field
            label="Hasta"
            type="time"
            step={1800}
            className="[color-scheme:dark]"
            {...register('horaFin', { required: 'Requerido' })}
          />
        </div>

        {create.error && (
          <div role="alert" className="text-err-fg text-[13px]">{create.error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={create.loading}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={create.loading}>
            {create.loading ? 'Guardando...' : 'Bloquear sede'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
