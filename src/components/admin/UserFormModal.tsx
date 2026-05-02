import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { Btn } from '../Btn';
import { Icon } from '../Icon';
import { useApiMutation, useApiQuery } from '../../lib/useApiQuery';

type Role = 'admin' | 'trainer' | 'client';

interface UserListItem {
  id: string;
  email: string;
  rol: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  cedula?: string;
  celular?: string;
  estado: string;
  entrenador_asignado_id?: string;
}

interface UserForm {
  email: string;
  rol: Role;
  nombres: string;
  apellidos: string;
  nick: string;
  cedula: string;
  celular: string;
  entrenadorAsignadoId: string;
}

interface Props {
  open: boolean;
  initialUser?: UserListItem | null; // null = crear, objeto = editar
  onClose: () => void;
  onSaved: () => void;
}

interface TrainerOption {
  id: string;
  nombres: string;
  apellidos: string;
}

export function UserFormModal({ open, initialUser, onClose, onSaved }: Props) {
  const isEdit = !!initialUser;
  const [activationLink, setActivationLink] = useState<string | null>(null);

  const create = useApiMutation<{ user: UserListItem; activationLink: string }>('adminCreateUser');
  const update = useApiMutation<{ user: UserListItem }>('adminUpdateUser');

  const { data: trainers } = useApiQuery<TrainerOption[]>(
    'adminListTrainers',
    {},
    { enabled: open }
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserForm>({
    defaultValues: {
      email: '',
      rol: 'client',
      nombres: '',
      apellidos: '',
      nick: '',
      cedula: '',
      celular: '',
      entrenadorAsignadoId: '',
    },
  });

  const watchedRole = watch('rol');

  useEffect(() => {
    if (open) {
      reset({
        email: initialUser?.email ?? '',
        rol: ((initialUser?.rol as Role) ?? 'client'),
        nombres: initialUser?.nombres ?? '',
        apellidos: initialUser?.apellidos ?? '',
        nick: initialUser?.nick ?? '',
        cedula: initialUser?.cedula ?? '',
        celular: initialUser?.celular ?? '',
        entrenadorAsignadoId: initialUser?.entrenador_asignado_id ?? '',
      });
      setActivationLink(null);
      create.reset();
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUser]);

  async function onSubmit(values: UserForm) {
    try {
      if (isEdit && initialUser) {
        await update.mutate({
          userId: initialUser.id,
          rol: values.rol,
          nombres: values.nombres,
          apellidos: values.apellidos,
          nick: values.nick,
          cedula: values.cedula,
          celular: values.celular,
          entrenador_asignado_id:
            values.rol === 'client' ? values.entrenadorAsignadoId : '',
        });
        onSaved();
      } else {
        const result = await create.mutate({
          email: values.email,
          rol: values.rol,
          nombres: values.nombres,
          apellidos: values.apellidos,
          nick: values.nick || undefined,
          cedula: values.cedula || undefined,
          celular: values.celular || undefined,
          entrenadorAsignadoId:
            values.rol === 'client' ? values.entrenadorAsignadoId : undefined,
        });
        setActivationLink(result.activationLink);
      }
    } catch {
      /* error en hook */
    }
  }

  function handleClose() {
    setActivationLink(null);
    onClose();
  }

  if (!open) return null;

  // Pantalla post-creación con el link
  if (activationLink) {
    return (
      <Modal
        open
        onClose={() => {
          handleClose();
          onSaved();
        }}
        title="Usuario creado"
      >
        <div className="px-5 py-5 space-y-4">
          <div className="p-3 rounded-xl bg-ok/10 border border-ok/25 text-ok-fg text-[13px] flex items-start gap-2">
            <Icon name="check" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
            <span>
              Le enviamos un correo con el enlace de activación. Vence en 24 horas.
            </span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
              Enlace de activación (por si el correo no llega)
            </div>
            <div className="bg-surface-2 border border-line-2 rounded-xl p-3 text-[12px] font-mono break-all text-fg-2">
              {activationLink}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(activationLink)}
              className="text-[12px] text-fg-2 hover:text-fg underline-offset-2 hover:underline mt-2"
            >
              Copiar al portapapeles
            </button>
          </div>
          <Btn full onClick={() => { handleClose(); onSaved(); }}>
            Listo
          </Btn>
        </div>
      </Modal>
    );
  }

  const error = create.error || update.error;
  const submitting = create.loading || update.loading;

  return (
    <Modal open onClose={handleClose} title={isEdit ? 'Editar usuario' : 'Crear usuario'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">

        {/* Rol */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            Rol
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['client', 'trainer', 'admin'] as Role[]).map((r) => (
              <RoleChip
                key={r}
                value={r}
                checked={watchedRole === r}
                registerProps={register('rol')}
              />
            ))}
          </div>
        </div>

        <Field
          label="Correo"
          type="email"
          autoComplete="off"
          placeholder="ejemplo@correo.co"
          disabled={isEdit}
          error={errors.email?.message}
          {...register('email', { required: 'Email requerido' })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nombres"
            placeholder="Nombre del usuario"
            error={errors.nombres?.message}
            {...register('nombres', { required: 'Nombres requeridos' })}
          />
          <Field
            label="Apellidos"
            placeholder="Apellidos"
            error={errors.apellidos?.message}
            {...register('apellidos', { required: 'Apellidos requeridos' })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nick (opcional)"
            placeholder="cómo lo llaman"
            error={errors.nick?.message}
            {...register('nick')}
          />
          <Field
            label="Celular"
            type="tel"
            placeholder="3001234567"
            {...register('celular')}
          />
        </div>

        <Field
          label="Cédula (opcional, dato sensible)"
          placeholder="Número de identificación"
          {...register('cedula')}
        />

        {watchedRole === 'client' && (
          <div>
            <label
              htmlFor="entrenador-select"
              className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2"
            >
              Entrenador asignado (opcional)
            </label>
            <select
              id="entrenador-select"
              {...register('entrenadorAsignadoId')}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60"
            >
              <option value="">Sin entrenador asignado</option>
              {trainers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombres} {t.apellidos}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">
            {error.message}
          </div>
        )}

        {!isEdit && (
          <p className="text-[12px] text-fg-3">
            Al crearlo le enviaremos un correo con el enlace de activación.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={handleClose} disabled={submitting}>
            Cancelar
          </Btn>
          <Btn type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear y enviar invitación'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function RoleChip({
  value,
  checked,
  registerProps,
}: {
  value: Role;
  checked: boolean;
  registerProps: ReturnType<ReturnType<typeof useForm<UserForm>>['register']>;
}) {
  const labels: Record<Role, string> = {
    client: 'Cliente',
    trainer: 'Entrenador',
    admin: 'Admin',
  };
  return (
    <label
      className={[
        'p-3 rounded-xl border cursor-pointer text-center transition-colors',
        checked
          ? 'bg-accent/10 border-accent/40 text-accent'
          : 'bg-surface-2 border-line-2 text-fg-2 hover:border-line-2',
      ].join(' ')}
    >
      <input {...registerProps} type="radio" value={value} className="sr-only" />
      <div className="font-medium text-sm">{labels[value]}</div>
    </label>
  );
}
