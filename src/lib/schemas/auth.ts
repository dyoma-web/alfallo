/**
 * Esquemas Zod para los formularios de autenticación.
 * Espejo de validate.gs en el backend — re-validamos en server pero
 * el cliente da feedback inmediato al usuario.
 */

import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────
// Reglas atómicas
// ──────────────────────────────────────────────────────────────────────────

const emailRule = z
  .string()
  .min(1, 'Ingresa tu correo')
  .email('Correo inválido')
  .toLowerCase()
  .trim();

const passwordCurrentRule = z.string().min(1, 'Ingresa tu contraseña');

/** Política de contraseña: ≥8 caracteres, al menos una letra y un número. */
const passwordNewRule = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(200, 'Demasiado larga')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

// ──────────────────────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailRule,
  password: passwordCurrentRule,
});
export type LoginInput = z.infer<typeof loginSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Activación de cuenta — primera vez que el usuario establece su contraseña
// ──────────────────────────────────────────────────────────────────────────

export const activateSchema = z
  .object({
    password: passwordNewRule,
    passwordConfirm: z.string().min(1, 'Confirma tu contraseña'),
    acceptedDataPolicy: z.literal(true, {
      errorMap: () => ({
        message: 'Debes aceptar la Política de Tratamiento de Datos para continuar',
      }),
    }),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message: 'Debes aceptar los Términos y Condiciones para continuar',
      }),
    }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm'],
  });
export type ActivateInput = z.infer<typeof activateSchema>;

// ──────────────────────────────────────────────────────────────────────────
// Recuperación
// ──────────────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailRule,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordNewRule,
    passwordConfirm: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
