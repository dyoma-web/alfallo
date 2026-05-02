/**
 * Helpers de fecha/hora — UTC en almacenamiento, render en zona del usuario.
 *
 * Documentado en docs/01-arquitectura.md §5. Toda fecha ISO viene del backend
 * en UTC; aquí la convertimos a la zona local del navegador (default Bogotá).
 */

import { config } from './config';

const TZ = config.timezone; // 'America/Bogota'
const LOCALE = config.locale; // 'es-CO'

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

// ──────────────────────────────────────────────────────────────────────────
// Formateadores
// ──────────────────────────────────────────────────────────────────────────

const fmtDate = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

const fmtDateLong = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const fmtTime = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const fmtMonthDay = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// ──────────────────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────────────────

export function formatDate(utcIso: string): string {
  if (!utcIso) return '';
  return fmtDate.format(new Date(utcIso));
}

export function formatDateLong(utcIso: string): string {
  if (!utcIso) return '';
  return fmtDateLong.format(new Date(utcIso));
}

export function formatTime(utcIso: string): string {
  if (!utcIso) return '';
  return fmtTime.format(new Date(utcIso));
}

export function formatDateTime(utcIso: string): string {
  if (!utcIso) return '';
  const d = new Date(utcIso);
  return `${fmtDate.format(d)} · ${fmtTime.format(d)}`;
}

export function formatShortDate(utcIso: string): string {
  if (!utcIso) return '';
  return fmtMonthDay.format(new Date(utcIso));
}

/**
 * Diferencia en días desde ahora. Positivo = futuro, negativo = pasado.
 */
export function daysFromNow(utcIso: string): number {
  if (!utcIso) return 0;
  const ms = new Date(utcIso).getTime() - Date.now();
  return Math.ceil(ms / DAY_MS);
}

/**
 * Texto relativo legible.
 */
export function formatRelative(utcIso: string): string {
  if (!utcIso) return '';
  const ms = new Date(utcIso).getTime() - Date.now();
  const future = ms > 0;
  const abs = Math.abs(ms);

  if (abs < MIN_MS) return 'ahora';
  if (abs < HOUR_MS) {
    const m = Math.round(abs / MIN_MS);
    return future ? `en ${m} min` : `hace ${m} min`;
  }
  if (abs < DAY_MS) {
    const h = Math.round(abs / HOUR_MS);
    return future ? `en ${h} h` : `hace ${h} h`;
  }
  if (abs < 7 * DAY_MS) {
    const d = Math.round(abs / DAY_MS);
    return future ? `en ${d} día${d === 1 ? '' : 's'}` : `hace ${d} día${d === 1 ? '' : 's'}`;
  }
  return formatDate(utcIso);
}

/**
 * Saludo según hora del día (zona del usuario).
 */
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: '2-digit', hour12: false })
      .format(new Date())
  );
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Convierte una Date local a ISO UTC para enviar al backend.
 */
export function toUtcIso(d: Date): string {
  return d.toISOString();
}
