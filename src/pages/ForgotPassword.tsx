import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import { AuthShell } from '../components/auth/AuthShell';
import { Field } from '../components/Field';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { api, ApiError } from '../lib/api';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../lib/schemas/auth';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setGlobalError(null);
    setSubmitting(true);
    try {
      await api<{ ok: boolean }>('requestPasswordReset', values);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Algo salió mal. Vuelve a intentar.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Revisa tu correo">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-ok/10 border border-ok/25 text-ok-fg text-[13px] flex items-start gap-2">
            <Icon name="check" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
            <span>
              Si tu correo está registrado, te enviamos un enlace para restablecer tu contraseña.
              El enlace vence en 1 hora.
            </span>
          </div>

          <p className="text-fg-2 text-sm leading-relaxed">
            ¿No te llega? Revisa tu carpeta de spam. Si en 5 minutos no aparece, escríbenos al{' '}
            <a
              href="mailto:david.yomayusa@innovahub.org"
              className="text-fg-2 hover:text-fg underline-offset-2 hover:underline"
            >
              equipo de administración
            </a>
            .
          </p>

          <Link to="/login" className="block">
            <Btn variant="secondary" full>Volver al inicio</Btn>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recupera tu acceso"
      subtitle="Ingresa el correo de tu cuenta y te enviamos un enlace para restablecer tu contraseña."
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
          label="Correo"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="tucorreo@ejemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Btn type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar enlace'}
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
