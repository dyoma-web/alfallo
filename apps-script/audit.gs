/**
 * audit.gs — Logger de auditoría inmutable.
 *
 * Toda escritura significativa pasa por aquí. Errores de auditoría no rompen
 * la operación principal — se loguean a Logger pero la response sigue.
 *
 * Documento de respaldo: docs/02-modelo-datos.md §5.23
 */

/**
 * Loguea una acción a la hoja `auditoria`.
 * @param {Object} entry — { user_id, accion, entidad, entidad_id, datos_antes, datos_despues, resultado, error_msg }
 * @param {Object} [reqMeta] — { ip, user_agent } extraídos del request
 */
function auditLog(entry, reqMeta) {
  try {
    const meta = reqMeta || {};
    dbInsert('auditoria', {
      id: cryptoUuid(),
      created_at_utc: dbNowUtc(),
      user_id:        entry.user_id || '',
      accion:         entry.accion || 'unknown',
      entidad:        entry.entidad || '',
      entidad_id:     entry.entidad_id || '',
      datos_antes:    entry.datos_antes || '',
      datos_despues:  entry.datos_despues || '',
      ip:             meta.ip || '',
      user_agent:     meta.user_agent || '',
      resultado:      entry.resultado || 'ok',
      error_msg:      entry.error_msg || '',
    });
  } catch (e) {
    // Auditoría no debe romper la operación. Loguear y seguir.
    Logger.log('auditLog ERROR: ' + e.message + ' — entry: ' + JSON.stringify(entry));
  }
}

/**
 * Helper para acciones exitosas con datos antes/después.
 */
function auditOk(userId, accion, entidad, entidadId, before, after, reqMeta) {
  auditLog({
    user_id: userId,
    accion: accion,
    entidad: entidad,
    entidad_id: entidadId,
    datos_antes: before || '',
    datos_despues: after || '',
    resultado: 'ok',
  }, reqMeta);
}

/**
 * Helper para fallos.
 */
function auditError(userId, accion, entidad, entidadId, errorMsg, reqMeta) {
  auditLog({
    user_id: userId || '',
    accion: accion,
    entidad: entidad || '',
    entidad_id: entidadId || '',
    resultado: 'error',
    error_msg: errorMsg,
  }, reqMeta);
}

/**
 * Helper para accesos denegados (auth fallido, permisos insuficientes).
 */
function auditDenied(userId, accion, reason, reqMeta) {
  auditLog({
    user_id: userId || '',
    accion: accion,
    resultado: 'denied',
    error_msg: reason,
  }, reqMeta);
}
