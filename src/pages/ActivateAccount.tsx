import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

import { AuthShell } from '../components/auth/AuthShell';
import { Field } from '../components/Field';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { api, ApiError } from '../lib/api';
import { activateSchema, type ActivateInput } from '../lib/schemas/auth';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateInput>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      password: '',
      passwordConfirm: '',
      acceptedDataPolicy: false as unknown as true,
      acceptedTerms: false as unknown as true,
    },
  });

  // Sin token en URL: error de fondo
  if (!token) {
    return (
      <AuthShell title="Enlace incompleto">
        <div className="space-y-4">
          <p className="text-fg-2 leading-relaxed">
            El enlace de activación no incluye el token. Verifica que copiaste la URL completa
            del correo, o solicita uno nuevo al equipo de administración.
          </p>
          <Link to="/login" className="block">
            <Btn variant="secondary" full>Volver al inicio</Btn>
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(values: ActivateInput) {
    setGlobalError(null);
    setSubmitting(true);
    try {
      await api<{ ok: boolean; email: string }>('activateAccount', {
        token,
        password: values.password,
      });
      navigate('/login?activated=1', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'TOKEN_EXPIRED') {
          setGlobalError('Este enlace expiró. Solicita uno nuevo al equipo de administración.');
        } else if (err.code === 'TOKEN_USED') {
          setGlobalError('Este enlace ya fue usado. Si ya activaste tu cuenta, inicia sesión.');
        } else if (err.code === 'INVALID_TOKEN') {
          setGlobalError('Enlace inválido. Verifica que la URL sea la que recibiste por correo.');
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('Algo salió mal. Vuelve a intentar.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Activa tu cuenta"
      subtitle="Establece tu contraseña para empezar a usar Al Fallo."
    >
      {globalError && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-xl bg-err/10 border border-err/25 text-err-fg text-[13px] flex items-start gap-2"
        >
          <Icon name="x" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          hint="Mínimo 8 caracteres, con al menos una letra y un número."
          error={errors.password?.message}
          {...register('password')}
        />

        <Field
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.passwordConfirm?.message}
          {...register('passwordConfirm')}
        />

        <div className="space-y-3 pt-2">
          <ConsentCheckbox
            id="acceptedDataPolicy"
            register={register('acceptedDataPolicy')}
            error={errors.acceptedDataPolicy?.message}
          >
            He leído y acepto la{' '}
            <Link to="/politica-datos" target="_blank" className="text-accent underline-offset-2 hover:underline">
              Política de Tratamiento de Datos
            </Link>
            . Autorizo a Al Fallo a tratar mis datos personales conforme a la Ley 1581 de 2012.
          </ConsentCheckbox>

          <ConsentCheckbox
            id="acceptedTerms"
            register={register('acceptedTerms')}
            error={errors.acceptedTerms?.message}
          >
            He leído y acepto los{' '}
            <Link to="/terminos" target="_blank" className="text-accent underline-offset-2 hover:underline">
              Términos y Condiciones
            </Link>
            .
          </ConsentCheckbox>
        </div>

        <Btn type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Activando...' : 'Activar y entrar'}
        </Btn>
      </form>
    </AuthShell>
  );
}

interface ConsentCheckboxProps {
  id: string;
  register: ReturnType<ReturnType<typeof useForm<ActivateInput>>['register']>;
  error?: string;
  children: React.ReactNode;
}

function ConsentCheckbox({ id, register, error, children }: ConsentCheckboxProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
        <input
          {...register}
          id={id}
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded accent-accent flex-none cursor-pointer"
        />
        <span className="text-[13px] text-fg-2 leading-relaxed">{children}</span>
      </label>
      {error && (
        <p role="alert" className="text-[12px] text-err-fg mt-1 ml-7">
          {error}
        </p>
      )}
    </div>
  );
}
