import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { useApiMutation, useApiQuery } from '../../lib/useApiQuery';
import { useSession } from '../../lib/store/session';

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
  gimnasio_id?: string;
  alcance?: string;
  area_profesional?: string;
  categoria_profesional?: string;
  price_update_mode?: string;
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
  alcance: 'global' | 'personalizado';
  gimnasioId: string;
  areaProfesional: 'entrenamiento' | 'medica' | 'otra';
  categoriaProfesional: string;
  sedeId: string;
  priceUpdateMode: 'future_only' | 'global';
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

const AREA_OPTIONS = [
  { value: 'entrenamiento', label: 'Area de entrenamiento' },
  { value: 'medica', label: 'Area medica' },
  { value: 'otra', label: 'Otra area' },
] as const;

const CATEGORY_OPTIONS: Record<PlanForm['areaProfesional'], Array<{ value: string; label: string }>> = {
  entrenamiento: [
    { value: 'entrenador_personalizado', label: 'Entrenamiento personalizado' },
    { value: 'profesor_grupal', label: 'Clases grupales' },
    { value: 'otro', label: 'Otro entrenamiento' },
  ],
  medica: [
    { value: 'nutricionista', label: 'Nutricion' },
    { value: 'fisio', label: 'Fisioterapia' },
    { value: 'evaluador', label: 'Evaluacion medica' },
    { value: 'otro', label: 'Otra area medica' },
  ],
  otra: [{ value: 'otro', label: 'Otra categoria' }],
};

export function PlanFormModal({ open, initialPlan, onClose, onSaved }: Props) {
  const isEdit = !!initialPlan;
  const role = useSession((s) => s.role);
  const isAdmin = role === 'admin' || role === 'super_admin';
  const create = useApiMutation('adminCreatePlanCatalogo');
  const update = useApiMutation('adminUpdatePlanCatalogo');
  const { data: sedes } = useApiQuery<OptionItem[]>(
    'adminListSedes',
    {},
    { enabled: open && isAdmin }
  );
  const { data: gimnasios } = useApiQuery<OptionItem[]>(
    'listGimnasiosPublic',
    {},
    { enabled: open }
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
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
      alcance: 'global',
      gimnasioId: '',
      areaProfesional: 'entrenamiento',
      categoriaProfesional: 'entrenador_personalizado',
      sedeId: '',
      priceUpdateMode: 'future_only',
      cuposMaxSimultaneos: '1',
      cuposEstricto: true,
    },
  });
  const area = watch('areaProfesional');

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
        alcance: (initialPlan?.alcance as PlanForm['alcance']) ?? (isAdmin ? 'global' : 'personalizado'),
        gimnasioId: initialPlan?.gimnasio_id ?? '',
        areaProfesional: (initialPlan?.area_profesional as PlanForm['areaProfesional']) ?? 'entrenamiento',
        categoriaProfesional: initialPlan?.categoria_profesional ?? (tipoVal === 'grupal' ? 'profesor_grupal' : 'entrenador_personalizado'),
        sedeId: initialPlan?.sede_id ?? '',
        priceUpdateMode: (initialPlan?.price_update_mode as PlanForm['priceUpdateMode']) ?? 'future_only',
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
  }, [open, initialPlan, isAdmin]);

  async function onSubmit(values: PlanForm) {
    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion,
      tipo: values.tipo,
      numSesiones: Number(values.numSesiones),
      precio: Number(values.precio),
      moneda: values.moneda,
      vigenciaDias: Number(values.vigenciaDias),
      alcance: isAdmin ? values.alcance : 'personalizado',
      gimnasioId: values.gimnasioId || undefined,
      areaProfesional: values.areaProfesional,
      categoriaProfesional: values.categoriaProfesional,
      sedeId: values.sedeId || undefined,
      priceUpdateMode: values.priceUpdateMode,
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
    <Modal open onClose={onClose} title={isEdit ? 'Editar plan' : isAdmin ? 'Crear plan en catalogo' : 'Crear plan personalizado'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <Field
          label="Nombre"
          placeholder="Ej. 10 sesiones personalizadas"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'Nombre requerido' })}
        />

        <div>
          <label htmlFor="alcance" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Alcance
          </label>
          <select
            id="alcance"
            {...register('alcance')}
            disabled={!isAdmin}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60 disabled:opacity-60"
          >
            <option value="global">Global del gimnasio</option>
            <option value="personalizado">Personalizado del profesional</option>
          </select>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="area" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Area profesional
            </label>
            <select
              id="area"
              {...register('areaProfesional')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              {AREA_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoria" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Categoria
            </label>
            <select
              id="categoria"
              {...register('categoriaProfesional')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              {(CATEGORY_OPTIONS[area] ?? CATEGORY_OPTIONS.entrenamiento).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
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
            <label htmlFor="gym" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Gimnasio
            </label>
            <select
              id="gym"
              {...register('gimnasioId')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">Sin gimnasio especifico</option>
              {gimnasios?.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
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

        {isEdit && (
          <div>
            <label htmlFor="priceMode" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Actualizacion de precio
            </label>
            <select
              id="priceMode"
              {...register('priceUpdateMode')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="future_only">Solo compras posteriores</option>
              <option value="global">Actualizar planes activos existentes</option>
            </select>
          </div>
        )}

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
