import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Field } from './Field';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { useConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import { useApiMutation } from '../lib/useApiQuery';

type RecurrenceType = 'none' | 'daily' | 'weekly';
type RecurrenceEnd = 'never' | 'until';

interface FormData {
  titulo: string;
  descripcion: string;
  fecha: string;          // YYYY-MM-DD
  horaInicio: string;     // HH:MM
  horaFin: string;        // HH:MM
  recurrence: RecurrenceType;
  intervalo: string;      // numérico como string para input
  endType: RecurrenceEnd;
  fechaFinRecurrencia: string;
}

interface ExistingRule {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio_utc: string;
  fecha_fin_utc: string;
  recurrence: RecurrenceType;
  dias_semana?: string;
  intervalo?: number | string;
  fecha_fin_recurrencia?: string;
}

interface Props {
  open: boolean;
  initialRule?: ExistingRule | null;
  onClose: () => void;
  onSaved: () => void;
}

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // 0=Dom

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function timeStr(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

export function UnavailabilityFormModal({ open, initialRule, onClose, onSaved }: Props) {
  const isEdit = !!initialRule;
  const create = useApiMutation('createUnavailability');
  const update = useApiMutation('updateUnavailability');
  const remove = useApiMutation('deleteUnavailability');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const toast = useToast();

  // Días seleccionados (0=Dom, 1=Lun, ..., 6=Sáb)
  const [selectedDows, setSelectedDows] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      titulo: '',
      descripcion: '',
      fecha: '',
      horaInicio: '09:00',
      horaFin: '12:00',
      recurrence: 'none',
      intervalo: '1',
      endType: 'never',
      fechaFinRecurrencia: '',
    },
  });

  const recurrence = watch('recurrence');
  const endType = watch('endType');

  useEffect(() => {
    if (!open) return;
    if (initialRule) {
      const inicio = new Date(initialRule.fecha_inicio_utc);
      const fin = new Date(initialRule.fecha_fin_utc);
      const dows = String(initialRule.dias_semana || '')
        .split(',').map(Number).filter((n) => !isNaN(n));
      setSelectedDows(dows.length ? dows : [inicio.getDay()]);
      reset({
        titulo: initialRule.titulo,
        descripcion: initialRule.descripcion ?? '',
        fecha: dateStr(inicio),
        horaInicio: timeStr(inicio),
        horaFin: timeStr(fin),
        recurrence: initialRule.recurrence,
        intervalo: String(initialRule.intervalo || 1),
        endType: initialRule.fecha_fin_recurrencia ? 'until' : 'never',
        fechaFinRecurrencia: initialRule.fecha_fin_recurrencia
          ? dateStr(new Date(initialRule.fecha_fin_recurrencia))
          : '',
      });
    } else {
      const today = new Date();
      setSelectedDows([today.getDay()]);
      reset({
        titulo: '',
        descripcion: '',
        fecha: dateStr(today),
        horaInicio: '09:00',
        horaFin: '12:00',
        recurrence: 'none',
        intervalo: '1',
        endType: 'never',
        fechaFinRecurrencia: '',
      });
    }
    create.reset();
    update.reset();
    remove.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialRule]);

  function toggleDow(d: number) {
    setSelectedDows((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function onSubmit(values: FormData) {
    if (values.recurrence === 'weekly' && selectedDows.length === 0) {
      toast({
        title: 'Selecciona al menos un día',
        message: 'La recurrencia semanal necesita marcar los días que aplican.',
        tone: 'error',
      });
      return;
    }

    const fechaInicioUtc = new Date(`${values.fecha}T${values.horaInicio}:00`).toISOString();
    const fechaFinUtc = new Date(`${values.fecha}T${values.horaFin}:00`).toISOString();

    if (new Date(fechaFinUtc) <= new Date(fechaInicioUtc)) {
      toast({
        title: 'Hora inválida',
        message: 'La hora fin debe ser posterior a la hora inicio.',
        tone: 'error',
      });
      return;
    }

    const fechaFinRecurrenciaUtc =
      values.recurrence !== 'none' && values.endType === 'until' && values.fechaFinRecurrencia
        ? new Date(`${values.fechaFinRecurrencia}T23:59:59`).toISOString()
        : '';

    const payload: Record<string, unknown> = {
      titulo: values.titulo,
      descripcion: values.descripcion,
      fechaInicioUtc,
      fechaFinUtc,
      recurrence: values.recurrence,
      intervalo: Number(values.intervalo) || 1,
      diasSemana: values.recurrence === 'weekly' ? selectedDows : [],
      fechaFinRecurrenciaUtc,
    };

    try {
      if (isEdit && initialRule) {
        await update.mutate({ id: initialRule.id, ...payload });
      } else {
        await create.mutate(payload);
      }
      onSaved();
    } catch { /* error en hook */ }
  }

  async function onDelete() {
    if (!initialRule) return;
    const ok = await confirm({
      title: 'Eliminar franja',
      message: 'La franja de no-disponibilidad se borra junto con todas sus repeticiones futuras.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await remove.mutate({ id: initialRule.id });
      toast({ title: 'Franja eliminada', tone: 'success' });
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
  const submitting = create.loading || update.loading || remove.loading;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar franja' : 'Nueva franja de no-disponibilidad'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <Field
          label="Título"
          placeholder="Ej. Vacaciones, Almuerzo, Reunión..."
          error={errors.titulo?.message}
          {...register('titulo', { required: 'Título requerido' })}
        />

        <div>
          <label htmlFor="ud" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            id="ud"
            {...register('descripcion')}
            rows={2}
            placeholder="Notas adicionales..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

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

        {/* Recurrencia */}
        <div className="pt-3 border-t border-line">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Repetición
          </div>
          <div className="grid grid-cols-3 gap-2">
            <RecurrenceChip value="none" current={recurrence} register={register('recurrence')}>
              Sola vez
            </RecurrenceChip>
            <RecurrenceChip value="daily" current={recurrence} register={register('recurrence')}>
              Diario
            </RecurrenceChip>
            <RecurrenceChip value="weekly" current={recurrence} register={register('recurrence')}>
              Semanal
            </RecurrenceChip>
          </div>
        </div>

        {recurrence !== 'none' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label={recurrence === 'daily' ? 'Cada N días' : 'Cada N semanas'}
                type="number"
                min="1"
                max="52"
                hint="1 = todos, 2 = cada dos, etc."
                {...register('intervalo')}
              />
            </div>

            {recurrence === 'weekly' && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                  Días de la semana
                </label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDow(i)}
                      className={[
                        'w-9 h-9 rounded-full text-[12px] font-medium transition-colors border',
                        selectedDows.includes(i)
                          ? 'bg-accent text-accent-ink border-accent'
                          : 'bg-surface-2 text-fg-2 border-line-2 hover:border-line-2',
                      ].join(' ')}
                      aria-pressed={selectedDows.includes(i)}
                      aria-label={label}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Termina
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="never" {...register('endType')} className="accent-accent" />
                  <span className="text-[13px] text-fg-2">Nunca</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="until" {...register('endType')} className="accent-accent" />
                  <span className="text-[13px] text-fg-2">El día</span>
                  <input
                    type="date"
                    {...register('fechaFinRecurrencia')}
                    disabled={endType !== 'until'}
                    className="h-8 px-2 rounded-lg bg-surface-2 border border-line-2 text-fg text-[13px] [color-scheme:dark] disabled:opacity-40"
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">{error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <Btn variant="danger" onClick={onDelete} disabled={submitting}>
              <Icon name="x" size={14} strokeWidth={2.5} /> Eliminar
            </Btn>
          )}
          <Btn variant="secondary" full onClick={onClose} disabled={submitting}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear franja'}
          </Btn>
        </div>
      </form>
      {confirmDialog}
    </Modal>
  );
}

function RecurrenceChip({
  value,
  current,
  register,
  children,
}: {
  value: RecurrenceType;
  current: RecurrenceType;
  register: ReturnType<ReturnType<typeof useForm<FormData>>['register']>;
  children: React.ReactNode;
}) {
  const checked = current === value;
  return (
    <label
      className={[
        'p-2.5 rounded-xl border cursor-pointer text-center text-[13px] transition-colors',
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
