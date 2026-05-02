/**
 * Cálculo del número de sesión dentro de un plan.
 *
 * Regla: cada hora (o fracción) de una sesión cuenta como 1 sesión del plan.
 * Una sesión de 90 min cuenta como 2 sesiones; 120 min como 2; 180 min como 3.
 *
 * Solo se cuentan bookings en estados activos o terminales válidos
 * (no cancelados ni expirados ni rechazados).
 */

export interface BookingForCounting {
  id: string;
  plan_usuario_id?: string;
  fecha_inicio_utc: string;
  duracion_min: number | string;
  estado: string;
}

const COUNTABLE_STATES = new Set([
  'solicitado',
  'confirmado',
  'pactado',
  'completado',
  'no-asistido',
  'requiere_autorizacion',
]);

export function sessionsConsumedByDuration(duracionMin: number | string): number {
  const d = Number(duracionMin) || 60;
  return Math.max(1, Math.ceil(d / 60));
}

interface SessionPosition {
  /** Primera sesión que ocupa este booking (1-indexed). */
  start: number;
  /** Última sesión (igual a start si solo ocupa 1). */
  end: number;
  /** Cuántas sesiones del plan consume este booking. */
  count: number;
}

/**
 * Para un booking dado, calcula qué número(s) de sesión ocupa dentro de su plan.
 * @param booking — el booking objetivo
 * @param allBookings — todos los bookings (deben incluir al menos los del mismo plan)
 * @returns null si no tiene plan_usuario_id, o no se encontró
 */
export function getSessionPosition(
  booking: BookingForCounting,
  allBookings: BookingForCounting[]
): SessionPosition | null {
  if (!booking.plan_usuario_id) return null;

  const planBookings = allBookings
    .filter((b) => b.plan_usuario_id === booking.plan_usuario_id)
    .filter((b) => COUNTABLE_STATES.has(b.estado))
    .filter((b) => !!b.fecha_inicio_utc)
    .sort((a, b) => {
      const ta = new Date(a.fecha_inicio_utc).getTime();
      const tb = new Date(b.fecha_inicio_utc).getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });

  let cursor = 1;
  for (const b of planBookings) {
    const consumes = sessionsConsumedByDuration(b.duracion_min);
    if (b.id === booking.id) {
      return {
        start: cursor,
        end: cursor + consumes - 1,
        count: consumes,
      };
    }
    cursor += consumes;
  }

  return null;
}

export function formatSessionRange(pos: SessionPosition, total: number): string {
  if (pos.count === 1) {
    return `Sesión ${pos.start} de ${total}`;
  }
  return `Sesiones ${pos.start}–${pos.end} de ${total}`;
}
