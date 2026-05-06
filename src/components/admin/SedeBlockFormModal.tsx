import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useConfirmDialog } from '../ConfirmDialog';
import { useToast } from '../Toast';
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

export interface SedeBlock {
  ruleId: string;
  titulo: string;
  entityId: string;
  sedeName?: string;
  descripcion?: string;
  start: string;
  end: string;
}

interface Props {
  open: boolean;
  sedes: SedeOption[];
  initialSedeId?: string;
  initialBlock?: SedeBlock | null;
  onClose: () => void;
  onSaved: () => void;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

export function SedeBlockFormModal({
  open,
  sedes,
  initialSedeId,
  initialBlock,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!initialBlock;
  const create = useApiMutation('createSedeBlock');
  const update = useApiMutation('updateSedeBlock');
  const remove = useApiMutation('deleteSedeBlock');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();
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
    const start = initialBlock ? new Date(initialBlock.start) : new Date();
    const end = initialBlock ? new Date(initialBlock.end) : null;
    reset({
      sedeId: initialBlock?.entityId || initialSedeId || '',
      motivo: initialBlock?.descripcion || '',
      fecha: dateStr(start),
      horaInicio: initialBlock ? timeStr(start) : '09:00',
      horaFin: end ? timeStr(end) : '12:00',
    });
    create.reset();
    update.reset();
    remove.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSedeId, initialBlock]);

  async function onSubmit(values: FormData) {
    const desdeUtc = new Date(`${values.fecha}T${values.horaInicio}:00`).toISOString();
    const hastaUtc = new Date(`${values.fecha}T${values.horaFin}:00`).toISOString();
    if (new Date(hastaUtc) <= new Date(desdeUtc)) return;

    try {
      const payload = {
        sedeId: values.sedeId,
        motivo: values.motivo || 'Sede bloqueada',
        desdeUtc,
        hastaUtc,
      };
      if (isEdit && initialBlock) {
        await update.mutate({ id: initialBlock.ruleId, ...payload });
      } else {
        await create.mutate(payload);
      }
      onSaved();
    } catch {
      /* error en hook */
    }
  }

  async function onDelete() {
    if (!initialBlock) return;
    const ok = await confirm({
      title: 'Eliminar bloqueo',
      message: 'La sede volverá a estar disponible en esa franja. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await remove.mutate({ id: initialBlock.ruleId });
      toast({ title: 'Bloqueo eliminado', tone: 'success' });
      onSaved();
    } catch (e) {
      toast({
        title: 'No se pudo eliminar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  if (!open) return null;
  const error = create.error || update.error || remove.error;
  const loading = create.loading || update.loading || remove.loading;

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Editar bloqueo de sede' : 'Bloquear sede'} size="lg">
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

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">{error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <Btn variant="danger" onClick={onDelete} disabled={loading}>
              Eliminar
            </Btn>
          )}
          <Btn variant="secondary" full onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Bloquear sede'}
          </Btn>
        </div>
      </form>
      {confirmDialog}
    </Modal>
  );
}

function timeStr(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
