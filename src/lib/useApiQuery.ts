/**
 * useApiQuery — hook simple de fetching para acciones del backend.
 *
 * Por simplicidad MVP: no hay caching cross-component (cada uso es una
 * llamada nueva), pero sí cancelación en unmount y refetch manual.
 *
 * Para Iter 5+ esto es suficiente. Si crece la complejidad consideramos
 * @tanstack/react-query.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { useSession } from './store/session';

interface QueryState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface QueryResult<T> extends QueryState<T> {
  refetch: () => Promise<void>;
}

export function useApiQuery<T>(
  action: string,
  payload: Record<string, unknown> = {},
  options: { enabled?: boolean; deps?: unknown[] } = {}
): QueryResult<T> {
  const { enabled = true, deps = [] } = options;
  const token = useSession((s) => s.token);
  const clearSession = useSession((s) => s.clearSession);

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    loading: enabled,
  });

  // Mantener payload en ref para evitar re-renders por referencia nueva
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const cancelledRef = useRef(false);

  const fetchOnce = useCallback(async () => {
    cancelledRef.current = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await api<T>(action, payloadRef.current, { token });
      if (!cancelledRef.current) {
        setState({ data: result, error: null, loading: false });
      }
    } catch (err) {
      if (cancelledRef.current) return;
      const apiErr = err instanceof ApiError
        ? err
        : new ApiError('UNKNOWN', (err as Error).message || 'Error desconocido');
      // Auto-logout si la sesión murió
      if (apiErr.isAuthError) clearSession();
      setState((s) => ({ ...s, error: apiErr, loading: false }));
    }
  }, [action, token, clearSession]);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    cancelledRef.current = false;
    void fetchOnce();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchOnce, ...deps]);

  return { ...state, refetch: fetchOnce };
}

// ──────────────────────────────────────────────────────────────────────────
// useApiMutation — para acciones que escriben (submit forms, mark read, etc.)
// ──────────────────────────────────────────────────────────────────────────

interface MutationState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface MutationResult<T> extends MutationState<T> {
  mutate: (payload?: Record<string, unknown>) => Promise<T>;
  reset: () => void;
}

export function useApiMutation<T = unknown>(action: string): MutationResult<T> {
  const token = useSession((s) => s.token);
  const clearSession = useSession((s) => s.clearSession);

  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const mutate = useCallback(
    async (payload: Record<string, unknown> = {}): Promise<T> => {
      setState({ data: null, error: null, loading: true });
      try {
        const result = await api<T>(action, payload, { token });
        setState({ data: result, error: null, loading: false });
        return result;
      } catch (err) {
        const apiErr = err instanceof ApiError
          ? err
          : new ApiError('UNKNOWN', (err as Error).message || 'Error desconocido');
        if (apiErr.isAuthError) clearSession();
        setState({ data: null, error: apiErr, loading: false });
        throw apiErr;
      }
    },
    [action, token, clearSession]
  );

  const reset = useCallback(
    () => setState({ data: null, error: null, loading: false }),
    []
  );

  return { ...state, mutate, reset };
}
