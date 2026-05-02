import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';

import { AuthShell } from '../components/auth/AuthShell';
import { Field } from '../components/Field';
import { Btn } from '../components/Btn';
import { Icon } from '../components/Icon';
import { api, ApiError } from '../lib/api';
import { useSession, type SessionData } from '../lib/store/session';
import { loginSchema, type LoginInput } from '../lib/schemas/auth';

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setSession = useSession((s) => s.setSession);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const justActivated = searchParams.get('activated') === '1';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setGlobalError(null);
    setSubmitting(true);
    try {
      const data = await api<SessionData>('loginUser', values);
      setSession(data);
      const from = (location.state as LocationState | null)?.from?.pathname;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setError('password', { message: ' ' });
          setGlobalError('Correo o contraseña incorrectos.');
        } else if (err.code === 'ACCOUNT_PENDING') {
          setGlobalError('Tu cuenta aún no ha sido activada. Revisa tu correo.');
        } else if (err.code === 'ACCOUNT_SUSPENDED') {
          setGlobalError('Tu cuenta está suspendida. Contacta al equipo de administración.');
        } else if (err.field) {
          setError(err.field as keyof LoginInput, { message: err.message });
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
      title="Hola de nuevo"
      subtitle="Ingresa para continuar con tus entrenamientos."
      footer={
        <p className="text-[12px] text-fg-3">
          ¿Problemas para entrar? Escríbele al{' '}
          <a href="mailto:david.yomayusa@innovahub.org" className="text-fg-2 hover:text-fg underline-offset-2 hover:underline">
            equipo de administración
          </a>
          .
        </p>
      }
    >
      {justActivated && (
        <div className="mb-5 p-3 rounded-xl bg-ok/10 border border-ok/25 text-ok-fg text-[13px] flex items-start gap-2">
          <Icon name="check" size={16} strokeWidth={2.5} className="mt-0.5 flex-none" />
          <span>Cuenta activada. Inicia sesión con la contraseña que acabas de establecer.</span>
        </div>
      )}

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

        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="text-right">
          <span className="text-[12px] text-fg-3" title="Disponible en próxima iteración">
            ¿Olvidaste tu contraseña? Próximamente.
          </span>
        </div>

        <Btn type="submit" full size="lg" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Btn>
      </form>

      <p className="text-[12px] text-fg-3 text-center mt-6">
        ¿Cuenta recién creada? Usa el enlace de activación que te enviamos.
        <br />
        ¿Sin cuenta?{' '}
        <Link to="/" className="text-fg-2 hover:text-fg underline-offset-2 hover:underline">
          Tu entrenador o el admin debe crearte una.
        </Link>
      </p>
    </AuthShell>
  );
}
