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
  cupos_max_simultaneos?: number | string;
  cupos_estricto?: boolean | string;
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
  cuposMaxSimultaneos: string;
  cuposEstricto: boolean;
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
      cuposMaxSimultaneos: '1',
      cuposEstricto: true,
    },
  });

  useEffect(() => {
    if (open) {
      const tipoVal = ((initialPlan?.tipo as PlanForm['tipo']) ?? 'personalizado');
      const defaultCap = tipoVal === 'semipersonalizado' ? '5'
        : tipoVal === 'grupal' ? '15' : '1';
      reset({
        nombre: initialPlan?.nombre ?? '',
        descripcion: initialPlan?.descripcion ?? '',
        tipo: tipoVal,
        numSesiones: initialPlan?.num_sesiones ? String(initialPlan.num_sesiones) : '10',
        precio: initialPlan?.precio ? String(initialPlan.precio) : '',
        moneda: initialPlan?.moneda ?? 'COP',
        vigenciaDias: initialPlan?.vigencia_dias ? String(initialPlan.vigencia_dias) : '60',
        entrenadorId: initialPlan?.entrenador_id ?? '',
        sedeId: initialPlan?.sede_id ?? '',
        cuposMaxSimultaneos: initialPlan?.cupos_max_simultaneos
          ? String(initialPlan.cupos_max_simultaneos) : defaultCap,
        cuposEstricto: initialPlan?.cupos_estricto != null
          ? (initialPlan.cupos_estricto === true || initialPlan.cupos_estricto === 'TRUE')
          : (tipoVal === 'personalizado'),
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
      cuposMaxSimultaneos: Math.max(1, Number(values.cuposMaxSimultaneos) || 1),
      cuposEstricto: values.cuposEstricto,
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

        {/* Cupos por franja: cuántos clientes pueden agendar al mismo tiempo */}
        <div className="pt-3 border-t border-line space-y-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
              Cupos por franja horaria
            </div>
            <p className="text-[12px] text-fg-3 mt-1">
              Cuántos clientes con este plan pueden agendar al mismo tiempo con el mismo entrenador.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Máximo simultáneos"
              type="number"
              min="1"
              hint="1 para personalizado, 5 para semi, 15 para grupal (típicos)"
              {...register('cuposMaxSimultaneos', { required: true })}
            />
            <label className="flex items-start gap-3 cursor-pointer mt-7 md:mt-0">
              <input
                type="checkbox"
                {...register('cuposEstricto')}
                className="mt-0.5 w-4 h-4 rounded accent-accent flex-none cursor-pointer"
              />
              <div>
                <div className="text-[13px] font-medium text-fg-2">Cupo estricto</div>
                <div className="text-[12px] text-fg-3 leading-snug">
                  Si está activo, no se permiten más solicitudes una vez lleno. Si está apagado,
                  el cliente puede pedir agendar y el entrenador decide.
                </div>
              </div>
            </label>
          </div>
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
