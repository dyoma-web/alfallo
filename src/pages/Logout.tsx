import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useSession } from '../lib/store/session';
import { AuthShell } from '../components/auth/AuthShell';

export default function Logout() {
  const navigate = useNavigate();
  const token = useSession((s) => s.token);
  const clearSession = useSession((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (token) {
          await api('logoutUser', {}, { token, retry: false });
        }
      } catch (e) {
        // Si el backend falla, igual cerramos sesión local
        if (!(e instanceof ApiError)) throw e;
      } finally {
        if (!cancelled) {
          clearSession();
          navigate('/login', { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, clearSession, navigate]);

  return (
    <AuthShell title="Cerrando sesión...">
      <p className="text-fg-2">Un segundo.</p>
    </AuthShell>
  );
}
