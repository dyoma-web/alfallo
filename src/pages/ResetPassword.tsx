import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

import { AuthShell } from '../components/auth/AuthShell';
import { Field } from '../components/Field';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { api, ApiError } from '../lib/api';
import { resetPasswordSchema, type ResetPasswordInput } from '../lib/schemas/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  });

  if (!token) {
    return (
      <AuthShell title="Enlace incompleto">
        <div className="space-y-4">
          <p className="text-fg-2 leading-relaxed">
            El enlace de recuperación no incluye el token. Verifica que copiaste la URL completa
            del correo, o solicita uno nuevo.
          </p>
          <Link to="/forgot-password" className="block">
            <Btn variant="secondary" full>Solicitar nuevo enlace</Btn>
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(values: ResetPasswordInput) {
    setGlobalError(null);
    setSubmitting(true);
    try {
      await api<{ ok: boolean }>('resetPassword', {
        token,
        password: values.password,
      });
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'TOKEN_EXPIRED') {
          setGlobalError('Este enlace expiró. Solicita uno nuevo.');
        } else if (err.code === 'TOKEN_USED') {
          setGlobalError('Este enlace ya fue usado. Si ya restableciste tu contraseña, inicia sesión.');
        } else if (err.code === 'INVALID_TOKEN') {
          setGlobalError('Enlace inválido. Verifica la URL o solicita uno nuevo.');
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
      title="Nueva contraseña"
      subtitle="Establece una contraseña nueva para tu cuenta."
    >
      {globalError && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-xl bg-err/10 border border-err/25 text-err-fg text-[13px] flex items-start gap-2"
        >
          <Icon name="x" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
          <div className="space-y-2">
            <p>{globalError}</p>
            {(globalError.includes('expiró') || globalError.includes('inválido')) && (
              <Link
                to="/forgot-password"
                className="text-err-fg hover:text-fg underline-offset-2 underline text-[12px]"
              >
                Solicitar nuevo enlace
              </Link>
            )}
          </div>
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

        <Btn type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Restablecer contraseña'}
        </Btn>
      </form>

      <p className="text-[12px] text-fg-3 text-center mt-6">
        <Link to="/login" className="text-fg-2 hover:text-fg underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </AuthShell>
  );
}
