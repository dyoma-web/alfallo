/**
 * api.ts — Wrapper de fetch al Web App de Apps Script.
 *
 * Convención del backend (ver docs/01-arquitectura.md §6 y apps-script/Code.gs):
 *   request:  POST con body { action, payload, token }
 *   response: { result: T } | { error: { code, message, field? } }
 *
 * Content-Type es text/plain para evitar el preflight CORS — Apps Script
 * no acepta headers personalizados arbitrarios.
 */

import { config } from './config';

// ──────────────────────────────────────────────────────────────────────────
// Error tipado
// ──────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly code: string;
  readonly field?: string;

  constructor(code: string, message: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.field = field;
  }

  /** ¿Es un error que sugiere reintentar (network/timeout)? */
  get isTransient(): boolean {
    return this.code === 'NETWORK' || this.code.startsWith('HTTP_5');
  }

  /** ¿La sesión expiró o no es válida? */
  get isAuthError(): boolean {
    return ['UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN'].includes(this.code);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Wrapper
// ──────────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  result?: T;
  error?: { code: string; message: string; field?: string };
}

interface ApiOptions {
  /** Token de sesión. Si no se pasa, no se envía (acción pública). */
  token?: string | null;
  /** Timeout en ms. Default 20s. */
  timeoutMs?: number;
  /** Reintentar UNA vez en errores transitorios. Default true. */
  retry?: boolean;
}

/**
 * Llama una acción del backend.
 *
 * @example
 *   const result = await api<LoginResult>('loginUser', { email, password });
 *   const profile = await api<User>('getMe', {}, { token: sessionToken });
 */
export async function api<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
  options: ApiOptions = {}
): Promise<T> {
  const { token = null, timeoutMs = 20_000, retry = true } = options;

  try {
    return await callOnce<T>(action, payload, token, timeoutMs);
  } catch (err) {
    if (retry && err instanceof ApiError && err.isTransient) {
      // Pequeño backoff y un único reintento
      await sleep(500);
      return await callOnce<T>(action, payload, token, timeoutMs);
    }
    throw err;
  }
}

async function callOnce<T>(
  action: string,
  payload: Record<string, unknown>,
  token: string | null,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, token }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'La solicitud tardó demasiado. Vuelve a intentar.');
    }
    throw new ApiError('NETWORK', 'No hay conexión. Revisa tu internet y vuelve a intentar.');
  } finally {
    window.clearTimeout(tid);
  }

  if (!response.ok) {
    throw new ApiError(`HTTP_${response.status}`, `Error de servidor (HTTP ${response.status})`);
  }

  let data: ApiResponse<T>;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('BAD_RESPONSE', 'Respuesta inválida del servidor');
  }

  if (data.error) {
    throw new ApiError(data.error.code, data.error.message, data.error.field);
  }

  if (data.result === undefined) {
    throw new ApiError('BAD_RESPONSE', 'Respuesta sin resultado ni error');
  }

  return data.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => window.setTimeout(res, ms));
}

// ──────────────────────────────────────────────────────────────────────────
// Atajos por acción común
// ──────────────────────────────────────────────────────────────────────────

export interface PingResult {
  pong: boolean;
  time: string;
  version: string;
}

export function ping() {
  return api<PingResult>('ping');
}
