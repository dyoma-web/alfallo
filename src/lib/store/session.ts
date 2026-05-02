/**
 * session.ts — Store global de la sesión del usuario logueado.
 *
 * Persistido en localStorage bajo la clave `alfallo.session`. Al recargar
 * la página, la sesión se rehidrata automáticamente.
 *
 * Limitación conocida: localStorage es vulnerable a XSS (ver
 * docs/01-arquitectura.md §3.4). No es ideal para producción real, pero
 * es la única opción viable con GitHub Pages + Apps Script en dominios
 * cruzados (no podemos setear cookies HttpOnly desde Apps Script al
 * dominio del frontend).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ──────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────

export type Role = 'super_admin' | 'admin' | 'trainer' | 'client';

export interface SessionUser {
  id: string;
  email: string;
  rol: Role;
  nombres: string;
  apellidos: string;
  nick?: string;
  foto_url?: string;
  estado: string;
  privacidad_fotos?: string;
  preferencias_notif?: Record<string, unknown>;
  entrenador_asignado_id?: string;
}

export interface SessionData {
  token: string;
  user: SessionUser;
  role: Role;
  expiresAt: string; // ISO UTC
}

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  role: Role | null;
  expiresAt: string | null;

  /** Establece la sesión completa tras un login exitoso. */
  setSession: (data: SessionData) => void;

  /** Limpia la sesión (logout local o expiración). */
  clearSession: () => void;

  /** Actualiza solo los datos del usuario (ej. tras editar perfil). */
  updateUser: (patch: Partial<SessionUser>) => void;

  /** ¿La sesión expiró? */
  isExpired: () => boolean;

  /** ¿Hay sesión válida y no expirada? */
  isAuthenticated: () => boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────────────────

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      role: null,
      expiresAt: null,

      setSession: (data) =>
        set({
          token: data.token,
          user: data.user,
          role: data.role,
          expiresAt: data.expiresAt,
        }),

      clearSession: () =>
        set({
          token: null,
          user: null,
          role: null,
          expiresAt: null,
        }),

      updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...patch } });
      },

      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return new Date(expiresAt) <= new Date();
      },

      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },
    }),
    {
      name: 'alfallo.session',
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos los campos de datos, no las funciones
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        expiresAt: state.expiresAt,
      }),
    }
  )
);

// ──────────────────────────────────────────────────────────────────────────
// Selectores helpers — para evitar re-renders innecesarios al usar el store
// ──────────────────────────────────────────────────────────────────────────

export const selectToken = (s: SessionState) => s.token;
export const selectUser = (s: SessionState) => s.user;
export const selectRole = (s: SessionState) => s.role;
export const selectIsAuth = (s: SessionState) => s.isAuthenticated();
