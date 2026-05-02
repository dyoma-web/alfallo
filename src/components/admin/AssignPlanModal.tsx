import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { Icon } from '../Icon';
import { useApiMutation, useApiQuery } from '../../lib/useApiQuery';

interface PlanCatalogo {
  id: string;
  nombre: string;
  precio: number | string;
  moneda?: string;
  num_sesiones: number | string;
  vigencia_dias: number | string;
}

interface UserOption {
  id: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  email: string;
  rol: string;
  estado: string;
}

interface AssignForm {
  userId: string;
  planCatalogoId: string;
  precioPagado: string;
  notas: string;
}

interface Props {
  open: boolean;
  preselectedPlanId?: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignPlanModal({ open, preselectedPlanId, onClose, onAssigned }: Props) {
  const assign = useApiMutation<{
    plan: { id: string };
    advertencia: string | null;
  }>('adminAssignPlanToUser');

  const { data: planes } = useApiQuery<PlanCatalogo[]>(
    'adminListPlanesCatalogo',
    {},
    { enabled: open }
  );
  const { data: users } = useApiQuery<UserOption[]>(
    'adminListUsers',
    { rol: 'client', estado: 'active' },
    { enabled: open }
  );

  const [success, setSuccess] = useState<{ advertencia: string | null } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AssignForm>({
    defaultValues: {
      userId: '',
      planCatalogoId: preselectedPlanId ?? '',
      precioPagado: '',
      notas: '',
    },
  });

  const watchedPlanId = watch('planCatalogoId');
  const selectedPlan = planes?.find((p) => p.id === watchedPlanId);

  useEffect(() => {
    if (open) {
      reset({
        userId: '',
        planCatalogoId: preselectedPlanId ?? '',
        precioPagado: '',
        notas: '',
      });
      assign.reset();
      setSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPlanId]);

  async function onSubmit(values: AssignForm) {
    try {
      const result = await assign.mutate({
        userId: values.userId,
        planCatalogoId: values.planCatalogoId,
        precioPagado: values.precioPagado ? Number(values.precioPagado) : undefined,
        notas: values.notas || undefined,
      });
      setSuccess({ advertencia: result.advertencia });
    } catch {
      /* error en hook */
    }
  }

  if (!open) return null;

  if (success) {
    return (
      <Modal open onClose={() => { onAssigned(); }} title="Plan asignado">
        <div className="px-5 py-5 space-y-4">
          <div className="p-3 rounded-xl bg-ok/10 border border-ok/25 text-ok-fg text-[13px] flex items-start gap-2">
            <Icon name="check" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
            <span>El plan se asignó correctamente al usuario.</span>
          </div>
          {success.advertencia && (
            <div className="p-3 rounded-xl bg-warn/10 border border-warn/25 text-[13px] flex items-start gap-2"
                 style={{ color: '#FFC97A' }}>
              <Icon name="bell" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
              <span>{success.advertencia}</span>
            </div>
          )}
          <Btn full onClick={() => onAssigned()}>Listo</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Asignar plan a usuario" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
        <div>
          <label htmlFor="user" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Cliente
          </label>
          <select
            id="user"
            {...register('userId', { required: 'Selecciona un cliente' })}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="">— Elige un cliente —</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombres} {u.apellidos} ({u.email})
              </option>
            ))}
          </select>
          {errors.userId && (
            <p className="text-err-fg text-[12px] mt-1">{errors.userId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="plan" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Plan
          </label>
          <select
            id="plan"
            {...register('planCatalogoId', { required: 'Selecciona un plan' })}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
          >
            <option value="">— Elige un plan —</option>
            {planes?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {errors.planCatalogoId && (
            <p className="text-err-fg text-[12px] mt-1">{errors.planCatalogoId.message}</p>
          )}
        </div>

        {selectedPlan && (
          <div className="p-3 rounded-xl bg-surface-2 border border-line text-[13px]">
            <div className="text-fg font-medium">{selectedPlan.nombre}</div>
            <div className="text-fg-3 mt-1">
              {selectedPlan.num_sesiones} sesiones · vigencia {selectedPlan.vigencia_dias} días ·{' '}
              {Number(selectedPlan.precio).toLocaleString('es-CO')} {selectedPlan.moneda || 'COP'}
            </div>
          </div>
        )}

        <Field
          label="Precio pagado (opcional)"
          type="number"
          min="0"
          placeholder={selectedPlan ? String(selectedPlan.precio) : 'Default del plan'}
          hint="Por defecto se toma el precio del catálogo. Cámbialo si hubo descuento o ajuste."
          {...register('precioPagado')}
        />

        <div>
          <label htmlFor="notas" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Notas (opcional)
          </label>
          <textarea
            id="notas"
            {...register('notas')}
            rows={2}
            maxLength={500}
            placeholder="Pago en efectivo, descuento, etc..."
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        {assign.error && (
          <div role="alert" className="text-err-fg text-[13px]">
            {assign.error.message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={onClose} disabled={assign.loading}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={assign.loading}>
            {assign.loading ? 'Asignando...' : 'Asignar plan'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
