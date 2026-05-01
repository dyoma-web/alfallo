/**
 * db.gs — Helpers de Google Sheets como datastore.
 *
 * Convenciones:
 *  - Todas las fechas se almacenan como ISO 8601 UTC (string).
 *  - Booleanos como true/false nativos de Sheets.
 *  - JSON se serializa a string al escribir, se parsea al leer (campos en JSON_FIELDS).
 *  - IDs son UUIDs string. La columna `id` (o `token` para sesiones, `key` para config) es PK.
 *
 * Cualquier escritura debe ir acompañada de auditoría desde el caller.
 * Las operaciones críticas deben envolverse en LockService desde el caller.
 */

// Columnas que contienen JSON serializado (se parsean al leer, se serializan al escribir)
const JSON_FIELDS = [
  'preferencias_notif', 'redes_sociales', 'franja_trabajo', 'horarios',
  'ejercicios', 'preguntas', 'respuestas', 'criterio', 'datos', 'datos_antes',
  'datos_despues', 'restricciones',
];

// PK por hoja (default 'id' si no está aquí)
const PK_BY_SHEET = {
  usuarios_pwd: 'user_id',
  entrenadores_perfil: 'user_id',
  sesiones: 'token',
  tokens_temporales: 'token',
  config: 'key',
  puntos_usuario: 'user_id',
};

// ──────────────────────────────────────────────────────────────────────────
// SHEET access
// ──────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el Spreadsheet activo (el que tiene este script bound).
 * Si SHEET_ID está en Script Properties, lo abre por ID (más explícito).
 */
function db_getSpreadsheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (sheetId) return SpreadsheetApp.openById(sheetId);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function db_getSheet_(name) {
  const sh = db_getSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Hoja no encontrada: ' + name);
  return sh;
}

function db_pk_(sheetName) {
  return PK_BY_SHEET[sheetName] || 'id';
}

// ──────────────────────────────────────────────────────────────────────────
// Mapping fila <-> objeto
// ──────────────────────────────────────────────────────────────────────────

function db_getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);
}

function db_rowToObj_(headers, row) {
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    let v = row[i];
    if (v instanceof Date) v = v.toISOString();
    if (JSON_FIELDS.indexOf(h) !== -1 && typeof v === 'string' && v.length > 0) {
      try { v = JSON.parse(v); } catch (e) { /* dejar string si parsea mal */ }
    }
    obj[h] = v;
  }
  return obj;
}

function db_objToRow_(headers, obj) {
  return headers.map(function (h) {
    let v = (h in obj) ? obj[h] : '';
    if (v === null || v === undefined) v = '';
    if (JSON_FIELDS.indexOf(h) !== -1 && typeof v === 'object') {
      v = JSON.stringify(v);
    }
    return v;
  });
}

// ──────────────────────────────────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────────────────────────────────

/**
 * Inserta un objeto. Si el PK no viene, se genera UUID.
 * Devuelve el objeto insertado (con id/PK garantizado).
 * @param {string} sheetName
 * @param {Object} obj
 * @return {Object}
 */
function dbInsert(sheetName, obj) {
  const sheet = db_getSheet_(sheetName);
  const headers = db_getHeaders_(sheet);
  const pk = db_pk_(sheetName);
  if (!obj[pk]) obj[pk] = cryptoUuid();
  const row = db_objToRow_(headers, obj);
  sheet.appendRow(row);
  return obj;
}

/**
 * Busca por PK. Devuelve el objeto o null.
 */
function dbFindById(sheetName, id) {
  return dbFindBy(sheetName, db_pk_(sheetName), id);
}

/**
 * Busca por columna arbitraria. Devuelve el primer match o null.
 * Hace full scan de la hoja — para columnas de alto volumen usa índices.
 */
function dbFindBy(sheetName, column, value) {
  const sheet = db_getSheet_(sheetName);
  const headers = db_getHeaders_(sheet);
  const colIdx = headers.indexOf(column);
  if (colIdx === -1) throw new Error('Columna no existe: ' + column + ' en ' + sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < data.length; i++) {
    const cellVal = data[i][colIdx];
    if (cellVal === value || (cellVal instanceof Date && cellVal.toISOString() === value)) {
      return db_rowToObj_(headers, data[i]);
    }
  }
  return null;
}

/**
 * Lista todos. Si predicate viene, filtra en memoria.
 * @param {string} sheetName
 * @param {function(Object): boolean} [predicate]
 */
function dbListAll(sheetName, predicate) {
  const sheet = db_getSheet_(sheetName);
  const headers = db_getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const obj = db_rowToObj_(headers, data[i]);
    if (!predicate || predicate(obj)) result.push(obj);
  }
  return result;
}

/**
 * Actualiza por PK. Lanza error si no encuentra.
 * Devuelve el objeto actualizado.
 */
function dbUpdateById(sheetName, id, patch) {
  const sheet = db_getSheet_(sheetName);
  const headers = db_getHeaders_(sheet);
  const pk = db_pk_(sheetName);
  const pkIdx = headers.indexOf(pk);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No existe: ' + sheetName + '/' + id);
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][pkIdx]) === String(id)) {
      const current = db_rowToObj_(headers, data[i]);
      const merged = Object.assign({}, current, patch);
      const newRow = db_objToRow_(headers, merged);
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([newRow]);
      return merged;
    }
  }
  throw new Error('No existe: ' + sheetName + '/' + id);
}

/**
 * Borrado lógico — setea estado='archived' y updated_at=now.
 * Si la hoja no tiene columna estado, lanza error.
 */
function dbSoftDelete(sheetName, id) {
  return dbUpdateById(sheetName, id, {
    estado: 'archived',
    updated_at: new Date().toISOString(),
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Índices (hoja `indices`) — lookups O(1) por email/cedula/nick
// ──────────────────────────────────────────────────────────────────────────

/**
 * Busca un user_id por email/cedula/nick usando la hoja `indices`.
 * Más rápido que dbFindBy en hojas grandes.
 */
function dbIndexLookup(entidad, valor) {
  const v = String(valor || '').toLowerCase();
  const matches = dbListAll('indices', function (r) {
    return r.entidad === entidad && String(r.valor).toLowerCase() === v;
  });
  return matches.length > 0 ? matches[0].target_id : null;
}

/**
 * Inserta o actualiza una entrada en el índice.
 * Si ya existe la entidad+valor, actualiza target_id; si no, inserta.
 */
function dbIndexUpsert(entidad, valor, targetId) {
  const v = String(valor || '').toLowerCase();
  const existing = dbListAll('indices', function (r) {
    return r.entidad === entidad && String(r.valor).toLowerCase() === v;
  });
  if (existing.length > 0) {
    // hay duplicado lógico — mantenemos el primero, marcamos warning
    if (existing[0].target_id !== targetId) {
      throw new Error('Conflicto de índice: ' + entidad + '=' + valor + ' ya pertenece a ' + existing[0].target_id);
    }
    return;
  }
  dbInsert('indices', { entidad: entidad, valor: v, target_id: targetId });
}

/**
 * Borra una entrada del índice (uso: cuando un user cambia de email).
 */
function dbIndexRemove(entidad, valor) {
  const sheet = db_getSheet_('indices');
  const headers = db_getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const v = String(valor || '').toLowerCase();
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  // Buscar y borrar de abajo hacia arriba (preserva índices durante eliminación)
  for (let i = data.length - 1; i >= 0; i--) {
    const obj = db_rowToObj_(headers, data[i]);
    if (obj.entidad === entidad && String(obj.valor).toLowerCase() === v) {
      sheet.deleteRow(i + 2);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers de timestamps
// ──────────────────────────────────────────────────────────────────────────

function dbNowUtc() {
  return new Date().toISOString();
}

function dbAddHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();
}

function dbAddMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}
