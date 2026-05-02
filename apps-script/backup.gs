/**
 * backup.gs — Backups automáticos del Sheet a Drive.
 *
 * Estrategia: cada noche se duplica el Sheet completo a una carpeta de Drive
 * con nombre `Alfallo_backup_YYYY-MM-DD`. Backups con más de 30 días se mueven
 * a la papelera (rotación).
 *
 * Configuración (una sola vez):
 *   1. Ejecutar `setupBackupTrigger()` desde el editor — crea el trigger
 *      time-driven a las 02:00 hora Bogotá.
 *   2. Opcional: configurar Script Property `BACKUP_FOLDER_ID` con el ID de
 *      una carpeta de Drive (sino, los backups quedan en la raíz de Drive).
 *
 * Restauración: ver docs/05-operaciones.md
 */

const BACKUP_NAME_PREFIX = 'Alfallo_backup_';
const BACKUP_RETENTION_DAYS = 30;

// ──────────────────────────────────────────────────────────────────────────
// dailyBackup — ejecutado por trigger diario
// ──────────────────────────────────────────────────────────────────────────

function dailyBackup() {
  Logger.log('=== ALFALLO BACKUP ===');
  Logger.log('Inicio: ' + new Date().toISOString());

  try {
    const ss = db_getSpreadsheet_();
    const today = new Date();
    const dateStr = Utilities.formatDate(today, 'America/Bogota', 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(today, 'America/Bogota', 'HH-mm');
    const backupName = BACKUP_NAME_PREFIX + dateStr + '_' + timeStr;

    // Carpeta destino
    const folderId = PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
    const folder = backup_resolveFolder_(folderId);

    // Hacer la copia
    const sourceFile = DriveApp.getFileById(ss.getId());
    const copy = sourceFile.makeCopy(backupName, folder || DriveApp.getRootFolder());

    Logger.log('✓ Backup creado: ' + backupName);
    Logger.log('  ID: ' + copy.getId());
    Logger.log('  Carpeta: ' + (folder ? folder.getName() : 'My Drive (raíz)'));

    // Rotación: borrar viejos
    const deleted = backup_rotateOldBackups_(folder);
    Logger.log('Backups antiguos a la papelera: ' + deleted);

    Logger.log('=== BACKUP COMPLETADO ===');
    return { ok: true, name: backupName, id: copy.getId(), deleted: deleted };
  } catch (e) {
    Logger.log('✗ Backup FALLÓ: ' + e.message);
    Logger.log(e.stack || '');
    auditLog({
      accion: 'daily_backup',
      entidad: 'sistema',
      resultado: 'error',
      error_msg: e.message,
    }, {});
    throw e;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// setupBackupTrigger — ejecutar una vez desde el editor
// ──────────────────────────────────────────────────────────────────────────

function setupBackupTrigger() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === 'dailyBackup') {
      ScriptApp.deleteTrigger(existingTriggers[i]);
      removed++;
    }
  }
  Logger.log('Triggers previos de dailyBackup eliminados: ' + removed);

  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .atHour(2)
    .nearMinute(15)
    .everyDays(1)
    .inTimezone('America/Bogota')
    .create();

  Logger.log('✓ Trigger creado: dailyBackup() todos los días entre 02:00–03:00 hora Bogotá');
}

// ──────────────────────────────────────────────────────────────────────────
// listBackups — útil para verificar que están corriendo
// ──────────────────────────────────────────────────────────────────────────

function listBackups() {
  const folderId = PropertiesService.getScriptProperties().getProperty('BACKUP_FOLDER_ID');
  const folder = backup_resolveFolder_(folderId);
  const iter = folder ? folder.getFiles() : DriveApp.searchFiles(
    "title contains '" + BACKUP_NAME_PREFIX + "' and trashed = false"
  );

  const items = [];
  while (iter.hasNext()) {
    const f = iter.next();
    if (f.getName().indexOf(BACKUP_NAME_PREFIX) !== 0) continue;
    items.push({
      name: f.getName(),
      id: f.getId(),
      createdAt: f.getDateCreated().toISOString(),
      sizeBytes: f.getSize(),
    });
  }

  items.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });

  Logger.log('=== BACKUPS DISPONIBLES (' + items.length + ') ===');
  items.slice(0, 20).forEach(function (b) {
    const sizeKb = Math.round(b.sizeBytes / 1024);
    Logger.log('  ' + b.name + ' · ' + sizeKb + ' KB · ' + b.createdAt);
  });
  if (items.length > 20) {
    Logger.log('  ... y ' + (items.length - 20) + ' más');
  }

  return items;
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function backup_resolveFolder_(folderId) {
  if (!folderId) return null;
  try {
    return DriveApp.getFolderById(folderId);
  } catch (e) {
    Logger.log('⚠ BACKUP_FOLDER_ID inválido (' + folderId + '). Usando raíz de Drive. Error: ' + e.message);
    return null;
  }
}

function backup_rotateOldBackups_(folder) {
  const cutoff = new Date(Date.now() - BACKUP_RETENTION_DAYS * 86400000);
  const iter = folder ? folder.getFiles() : DriveApp.searchFiles(
    "title contains '" + BACKUP_NAME_PREFIX + "' and trashed = false"
  );

  let deleted = 0;
  while (iter.hasNext()) {
    const f = iter.next();
    if (f.getName().indexOf(BACKUP_NAME_PREFIX) !== 0) continue;
    if (f.getDateCreated() < cutoff) {
      f.setTrashed(true);
      deleted++;
    }
  }
  return deleted;
}
