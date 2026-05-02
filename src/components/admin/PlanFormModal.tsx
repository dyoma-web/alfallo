import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useApiMutation, useApiQuery } from '../../lib/useApiQuery';

interface PlanCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  num_sesiones: number | string;
  precio: number | string;
  moneda?: string;
  vigencia_dias: number | string;
  entrenador_id?: string;
  sede_id?: string;
  estado?: string;
}

interface PlanForm {
  nombre: string;
  descripcion: string;
  tipo: 'personalizado' | 'semipersonalizado' | 'grupal';
  numSesiones: string;
  precio: string;
  moneda: string;
  vigenciaDias: string;
  entrenadorId: string;
  sedeId: string;
}

interface Props {
  open: boolean;
  initialPlan?: PlanCatalogo | null;
  onClose: () => void;
  onSaved: () => void;
}

interface OptionItem {
  id: string;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
}

export function PlanFormModal({ open, initialPlan, onClose, onSaved }: Props) {
  const isEdit = !!initialPlan;
  const create = useApiMutation('adminCreatePlanCatalogo');
  const update = useApiMutation('adminUpdatePlanCatalogo');
  const { data: trainers } = useApiQuery<OptionItem[]>(
    'adminListTrainers',
    {},
    { enabled: open }
  );
  const { data: sedes } = useApiQuery<OptionItem[]>(
    'adminListSedes',
    {},
    { enabled: open }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>({
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipo: 'personalizado',
      numSesiones: '10',
      precio: '',
      moneda: 'COP',
      vigenciaDias: '60',
      entrenadorId: '',
      sedeId: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: initialPlan?.nombre ?? '',
        descripcion: initialPlan?.descripcion ?? '',
        tipo: ((initialPlan?.tipo as PlanForm['tipo']) ?? 'personalizado'),
        numSesiones: initialPlan?.num_sesiones ? String(initialPlan.num_sesiones) : '10',
        precio: initialPlan?.precio ? String(initialPlan.precio) : '',
        moneda: initialPlan?.moneda ?? 'COP',
        vigenciaDias: initialPlan?.vigencia_dias ? String(initialPlan.vigencia_dias) : '60',
        entrenadorId: initialPlan?.entrenador_id ?? '',
        sedeId: initialPlan?.sede_id ?? '',
      });
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPlan]);

  async function onSubmit(values: PlanForm) {
    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion,
      tipo: values.tipo,
      numSesiones: Number(values.numSesiones),
      precio: Number(values.precio),
      moneda: values.moneda,
      vigenciaDias: Number(values.vigenciaDias),
      entrenadorId: values.entrenadorId || undefined,
      sedeId: values.sedeId || undefined,
    };
    try {
      if (isEdit && initialPlan) {
        await update.mutate({ planId: initialPlan.id, ...payload });
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
    <Modal open onClose={onClose} title={isEdit ? 'Editar plan' : 'Crear plan en catálogo'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <Field
          label="Nombre"
          placeholder="Ej. 10 sesiones personalizadas"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'Nombre requerido' })}
        />

        <div>
          <label htmlFor="tipo" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Tipo
          </label>
          <select
            id="tipo"
            {...register('tipo')}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="personalizado">Personalizado</option>
            <option value="semipersonalizado">Semipersonalizado</option>
            <option value="grupal">Grupal</option>
          </select>
        </div>

        <div>
          <label htmlFor="desc" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            id="desc"
            {...register('descripcion')}
            rows={2}
            placeholder="Describe el plan..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="N° sesiones"
            type="number"
            min="1"
            error={errors.numSesiones?.message}
            {...register('numSesiones', { required: true })}
          />
          <Field
            label="Vigencia (días)"
            type="number"
            min="1"
            error={errors.vigenciaDias?.message}
            {...register('vigenciaDias', { required: true })}
          />
          <Field
            label="Precio"
            type="number"
            min="0"
            placeholder="600000"
            error={errors.precio?.message}
            {...register('precio', { required: 'Precio requerido' })}
          />
        </div>

        <div>
          <label htmlFor="moneda" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Moneda
          </label>
          <select
            id="moneda"
            {...register('moneda')}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="COP">COP — Peso colombiano</option>
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="MXN">MXN — Peso mexicano</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="trainer" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Entrenador titular (opcional)
            </label>
            <select
              id="trainer"
              {...register('entrenadorId')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">Plan de la plataforma</option>
              {trainers?.map((t) => (
                <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sede" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Sede default (opcional)
            </label>
            <select
              id="sede"
              {...register('sedeId')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">Cualquier sede</option>
              {sedes?.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
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
            {submitting ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear plan'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
