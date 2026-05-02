import { z } from 'zod';

/**
 * Schema del form de agendar. La fecha y hora se separan en el form pero
 * se envían combinadas al backend como ISO UTC.
 */
export const bookingFormSchema = z.object({
  entrenadorId: z.string().min(1, 'Elige un entrenador'),
  fecha: z.string().min(1, 'Elige una fecha'),
  hora: z.string().min(1, 'Elige una hora'),
  sedeId: z.string().optional(),
  duracionMin: z.coerce.number().int().min(15).max(240).default(60),
  notas: z.string().max(500).optional(),
});
export type BookingFormInput = z.infer<typeof bookingFormSchema>;

export const cancelBookingSchema = z.object({
  motivo: z.string().max(500).optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
