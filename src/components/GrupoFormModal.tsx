import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Field } from './Field';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { useApiMutation, useApiQuery } from '../lib/useApiQuery';
import { useSession } from '../lib/store/session';

const COLOR_PALETTE = [
  '#C8FF3D', // Lime (brand)
  '#7AC7FF', // Cyan
  '#FF8FB1', // Pink
  '#FFB02E', // Amber
  '#7DE08D', // Mint
  '#B68FFF', // Purple
  '#FF6B6B', // Coral
  '#5DD4D4', // Teal
  '#FFD700', // Gold
];

interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  entrenador_id: string;
  sede_id?: string;
  tipo: 'semipersonalizado' | 'grupal';
  capacidad_max: number | string;
  color: string;
}

interface GrupoForm {
  nombre: string;
  descripcion: string;
  tipo: 'semipersonalizado' | 'grupal';
  capacidadMax: string;
  color: string;
  sedeId: string;
  entrenadorId: string;
}

interface OptionLite {
  id: string;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
}

interface Props {
  open: boolean;
  initialGrupo?: Grupo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GrupoFormModal({ open, initialGrupo, onClose, onSaved }: Props) {
  const isEdit = !!initialGrupo;
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';

  const create = useApiMutation('createGrupo');
  const update = useApiMutation('updateGrupo');

  const { data: trainers } = useApiQuery<OptionLite[]>(
    'adminListTrainers',
    {},
    { enabled: open && isAdmin }
  );
  const { data: sedes } = useApiQuery<OptionLite[]>(
    'adminListSedes',
    {},
    { enabled: open && isAdmin }
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GrupoForm>({
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipo: 'semipersonalizado',
      capacidadMax: '',
      color: COLOR_PALETTE[0],
      sedeId: '',
      entrenadorId: '',
    },
  });

  const watchedColor = watch('color');
  const watchedTipo = watch('tipo');

  useEffect(() => {
    if (open) {
      reset({
        nombre: initialGrupo?.nombre ?? '',
        descripcion: initialGrupo?.descripcion ?? '',
        tipo: initialGrupo?.tipo ?? 'semipersonalizado',
        capacidadMax: initialGrupo?.capacidad_max
          ? String(initialGrupo.capacidad_max)
          : '',
        color: initialGrupo?.color ?? COLOR_PALETTE[0],
        sedeId: initialGrupo?.sede_id ?? '',
        entrenadorId: initialGrupo?.entrenador_id ?? '',
      });
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialGrupo]);

  // capacidad opcional — el usuario decide si poner un límite o dejar sin
  void watchedTipo; void setValue;

  async function onSubmit(values: GrupoForm) {
    const payload: Record<string, unknown> = {
      nombre: values.nombre,
      descripcion: values.descripcion,
      tipo: values.tipo,
      capacidadMax: Number(values.capacidadMax) || 5,
      color: values.color,
      sedeId: values.sedeId || undefined,
    };
    if (isAdmin && !isEdit) {
      payload.entrenadorId = values.entrenadorId || undefined;
    }
    try {
      if (isEdit && initialGrupo) {
        await update.mutate({ grupoId: initialGrupo.id, ...payload });
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
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar grupo' : 'Nuevo grupo'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <Field
          label="Nombre del grupo"
          placeholder="Ej. Crossfit Mañana, Funcional 6 AM..."
          error={errors.nombre?.message}
          {...register('nombre', { required: 'Nombre requerido' })}
        />

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            {...register('descripcion')}
            rows={2}
            placeholder="Para qué nivel, enfoque..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Tipo
            </label>
            <select
              {...register('tipo')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="semipersonalizado">Semipersonalizado</option>
              <option value="grupal">Grupal</option>
            </select>
          </div>
          <Field
            label="Capacidad máxima (opcional)"
            type="number"
            min="0"
            max="200"
            placeholder="Sin límite"
            hint="Vacío = ilimitado. Solo limita cuántos miembros caben en el grupo."
            error={errors.capacidadMax?.message}
            {...register('capacidadMax')}
          />
        </div>

        {isAdmin && !isEdit && (
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Entrenador titular
            </label>
            <select
              {...register('entrenadorId', { required: 'Selecciona un entrenador' })}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">— Elige —</option>
              {trainers?.map((t) => (
                <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>
              ))}
            </select>
            {errors.entrenadorId && (
              <p className="text-err-fg text-[12px] mt-1">{errors.entrenadorId.message}</p>
            )}
          </div>
        )}

        {isAdmin && (
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Sede (opcional)
            </label>
            <select
              {...register('sedeId')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">Sin sede específica</option>
              {sedes?.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Color del grupo
          </label>
          <p className="text-[12px] text-fg-3 mb-3">
            Aparece en los agendamientos del calendario para identificar al grupo de un vistazo.
          </p>
          <div className="grid grid-cols-9 gap-2">
            {COLOR_PALETTE.map((c) => (
              <ColorChip
                key={c}
                color={c}
                checked={watchedColor === c}
                register={register('color')}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface-2 border border-line-2 rounded-xl p-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Preview
          </div>
          <div
            className="rounded-lg p-2 text-[13px] font-medium"
            style={{
              background: hexWithAlpha(watchedColor, 0.2),
              border: `1px solid ${hexWithAlpha(watchedColor, 0.5)}`,
              color: lightenForText(watchedColor),
            }}
          >
            06:30 · {watch('nombre') || 'Mi grupo'} · 60 min
          </div>
        </div>

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">{error.message}</div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={submitting}>Cancelar</Btn>
          <Btn type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear grupo'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function ColorChip({
  color,
  checked,
  register,
}: {
  color: string;
  checked: boolean;
  register: ReturnType<ReturnType<typeof useForm<GrupoForm>>['register']>;
}) {
  return (
    <label
      className={[
        'aspect-square rounded-full cursor-pointer transition-all flex items-center justify-center',
        checked ? 'ring-2 ring-fg ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105',
      ].join(' ')}
      style={{ background: color }}
    >
      <input {...register} type="radio" value={color} className="sr-only" />
      {checked && <Icon name="check" size={12} color="#0B1208" strokeWidth={3} />}
    </label>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = String(hex || '#C8FF3D').replace('#', '');
  if (h.length !== 6) return `rgba(200,255,61,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lightenForText(hex: string): string {
  const h = String(hex || '#C8FF3D').replace('#', '');
  if (h.length !== 6) return '#D8FF6E';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.35);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
