/**
 * Configuración pública del cliente.
 *
 * NO va aquí ningún secreto — todo lo que está en este archivo se incluye
 * en el bundle público de GitHub Pages. Las claves sensibles viven en
 * Script Properties del Apps Script (PEPPER, ADMIN_EMAILS, etc.).
 */

export const config = {
  /** URL del Web App de Apps Script (ver apps-script/README.md). */
  apiUrl:
    'https://script.google.com/macros/s/AKfycbz18v0WdiEyvIED4yCXpOQ-nqv35GoC7mt4aX22D7mGM1ipFNFeb_iND3Xd6WBl9Wxs/exec',

  /** Nombre y versión exhibidos en el footer / about. */
  appName: 'Al Fallo',
  appVersion: '0.1.0',

  /** Zona horaria por defecto para render de fechas. */
  timezone: 'America/Bogota',

  /** Locale por defecto. */
  locale: 'es-CO',

  /** Moneda por defecto. */
  currency: 'COP',

  /** Repo público para footer / about. */
  repo: 'https://github.com/dyoma-web/alfallo',
} as const;
