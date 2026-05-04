/**
 * build.mjs — Concatena los archivos .gs de apps-script/ en un único bundle
 * que se puede pegar de un solo golpe en el editor de Apps Script.
 *
 * Uso:
 *   npm run gs:bundle
 *
 * Salida:
 *   apps-script/bundle/Code.gs           ← pega este en el editor
 *   apps-script/bundle/appsscript.json   ← y este en el manifest
 */

import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Orden de concatenación. Apps Script tiene scope global compartido entre
// archivos, así que el orden no afecta ejecución, solo legibilidad.
const ORDER = [
  'schema.gs',
  'db.gs',
  'crypto.gs',
  'cache.gs',
  'validate.gs',
  'audit.gs',
  'email.gs',
  'auth.gs',
  'alerts.gs',
  'options.gs',
  'dashboard.gs',
  'bookings.gs',
  'trainer.gs',
  'metas.gs',
  'admin.gs',
  'gimnasios.gs',
  'solicitudes.gs',
  'availability.gs',
  'grupos.gs',
  'backup.gs',
  'Code.gs',
  'bootstrap.gs',
];

const SEP = (file) =>
  `\n\n// ═══════════════════════════════════════════════════════════════════════\n` +
  `// ${file}\n` +
  `// ═══════════════════════════════════════════════════════════════════════\n\n`;

async function main() {
  const srcDir = __dirname;
  const outDir = resolve(srcDir, 'bundle');
  await mkdir(outDir, { recursive: true });

  const generated = new Date().toISOString();

  const HEADER =
`/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                  AL FALLO — BUNDLED BACKEND                      ║
 * ║                                                                  ║
 * ║  Generado automáticamente desde apps-script/*.gs.                ║
 * ║  NO EDITES ESTE ARCHIVO DIRECTAMENTE — modifica los fuentes      ║
 * ║  en apps-script/ y ejecuta: npm run gs:bundle                    ║
 * ║                                                                  ║
 * ║  Repo:    https://github.com/dyoma-web/alfallo                   ║
 * ║  Built:   ${generated}                              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
`;

  let bundle = HEADER;
  for (const file of ORDER) {
    const content = await readFile(resolve(srcDir, file), 'utf-8');
    bundle += SEP(file);
    bundle += content.trimEnd() + '\n';
  }

  const outGs = resolve(outDir, 'Code.gs');
  const outManifest = resolve(outDir, 'appsscript.json');

  await writeFile(outGs, bundle, 'utf-8');
  await copyFile(resolve(srcDir, 'appsscript.json'), outManifest);

  const lines = bundle.split('\n').length;
  const kb = (Buffer.byteLength(bundle, 'utf-8') / 1024).toFixed(1);

  console.log(`✓ apps-script/bundle/Code.gs           (${ORDER.length} archivos · ${lines} líneas · ${kb} KB)`);
  console.log(`✓ apps-script/bundle/appsscript.json   (manifest)`);
  console.log('');
  console.log('Pega estos 2 archivos en el editor de Apps Script. Detalles en apps-script/README.md.');
}

main().catch((e) => {
  console.error('Bundle FAILED:', e.message);
  process.exit(1);
});
