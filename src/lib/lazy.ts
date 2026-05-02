/**
 * lazyWithRetry — wrapper de React.lazy que detecta chunks obsoletos y
 * recarga la página automáticamente en lugar de mostrar pantalla en blanco.
 *
 * Problema que resuelve:
 *   1. Usuario abre la app → descarga index.js v1 con referencias a chunks
 *      Logout-AAA.js, Login-BBB.js, etc.
 *   2. Hacemos un deploy → los chunks cambian a Logout-CCC.js, Login-DDD.js.
 *      Los archivos viejos dejan de existir en GitHub Pages.
 *   3. El usuario (que sigue en v1) hace clic en una ruta → intenta cargar
 *      Logout-AAA.js → 404 → pantalla en blanco.
 *
 * Solución: capturar el error de import dinámico y forzar un reload. El
 * reload trae el nuevo index.js y se cargan los chunks correctos.
 *
 * Guard: sessionStorage para evitar loops infinitos si el reload no resuelve
 * (ej. Pages caído). Tras 60s se limpia el flag y permitimos reintentar.
 */

import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'alfallo.chunk_reload';
const RELOAD_TTL_MS = 60_000;

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (isChunkError(err) && !hasRecentlyReloaded()) {
        markReloaded();
        window.location.reload();
        // Devolvemos una promesa que nunca resuelve — el reload va a
        // interrumpir la ejecución antes de que React intente renderizar.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

function isChunkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message || '';
  return (
    err.name === 'ChunkLoadError' ||
    m.includes('Failed to fetch dynamically imported module') ||
    m.includes('error loading dynamically imported module') ||
    m.includes('Importing a module script failed')
  );
}

function hasRecentlyReloaded(): boolean {
  try {
    const t = sessionStorage.getItem(RELOAD_FLAG);
    if (!t) return false;
    return Date.now() - Number(t) < RELOAD_TTL_MS;
  } catch {
    return false;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    // Privacidad estricta o storage lleno — ignorar y seguir
  }
}
