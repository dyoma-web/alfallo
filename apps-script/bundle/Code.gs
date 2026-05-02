/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                  AL FALLO — BUNDLED BACKEND                      ║
 * ║                                                                  ║
 * ║  Generado automáticamente desde apps-script/*.gs.                ║
 * ║  NO EDITES ESTE ARCHIVO DIRECTAMENTE — modifica los fuentes      ║
 * ║  en apps-script/ y ejecuta: npm run gs:bundle                    ║
 * ║                                                                  ║
 * ║  Repo:    https://github.com/dyoma-web/alfallo                   ║
 * ║  Built:   2026-05-02T03:31:21.578Z                              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */


// ═══════════════════════════════════════════════════════════════════════
// schema.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * schema.gs — Definición de las 33 hojas del Sheet "Alfallo".
 *
 * Single source of truth para:
 *  - bootstrap.gs (crea las hojas)
 *  - db.gs (mapea filas <-> objetos)
 *
 * Espejo en docs/02-modelo-datos.md. Si cambias una hoja allí, cambia aquí también.
 */

// ──────────────────────────────────────────────────────────────────────────
// SCHEMA — { sheetName: [headerCols...] }
// El orden importa: primero columnas de identidad/operación, luego auditoría.
// ──────────────────────────────────────────────────────────────────────────
const SCHEMA = {

  // ─── Identidad & Auth (MVP — Iter 3) ───────────────────────────────────
  usuarios: [
    'id', 'email', 'rol', 'nombres', 'apellidos', 'nick',
    'cedula', 'celular', 'foto_url', 'estado',
    'preferencias_notif', 'privacidad_fotos', 'entrenador_asignado_id',
    'created_at', 'updated_at', 'last_login_at', 'created_by'
  ],

  usuarios_pwd: [
    'user_id', 'salt', 'hash', 'algoritmo', 'updated_at', 'forzar_cambio'
  ],

  entrenadores_perfil: [
    'user_id', 'perfil_profesional', 'habilidades', 'tipos_entrenamiento',
    'certificaciones', 'restricciones', 'redes_sociales', 'franja_trabajo',
    'politica_cancelacion_id', 'visibilidad_default', 'cupos_estrictos',
    'meta_economica_mensual', 'meta_usuarios_activos',
    'calificacion_promedio', 'total_calificaciones',
    'created_at', 'updated_at'
  ],

  sesiones: [
    'token', 'user_id', 'rol', 'created_at', 'expires_at',
    'last_seen_at', 'user_agent', 'ip', 'revoked'
  ],

  tokens_temporales: [
    'token', 'tipo', 'user_id', 'created_at', 'expires_at', 'used_at'
  ],

  // ─── Operación: Sedes (MVP — Iter 7) ───────────────────────────────────
  sedes: [
    'id', 'nombre', 'codigo_interno', 'direccion', 'ciudad', 'barrio',
    'telefono', 'responsable', 'horarios', 'capacidad', 'observaciones',
    'servicios', 'reglas', 'estado', 'created_at', 'updated_at'
  ],

  sedes_entrenadores: [
    'id', 'sede_id', 'entrenador_id', 'desde', 'hasta', 'estado'
  ],

  sedes_usuarios: [
    'id', 'sede_id', 'user_id', 'principal', 'created_at'
  ],

  sedes_bloqueos: [
    'id', 'sede_id', 'desde_utc', 'hasta_utc', 'motivo',
    'creado_por', 'created_at'
  ],

  // ─── Comercial: Planes (MVP — Iter 7) ──────────────────────────────────
  planes_catalogo: [
    'id', 'nombre', 'descripcion', 'tipo', 'num_sesiones',
    'precio', 'moneda', 'vigencia_dias', 'entrenador_id', 'sede_id',
    'estado', 'created_at', 'updated_at', 'created_by'
  ],

  planes_usuario: [
    'id', 'user_id', 'plan_catalogo_id', 'entrenador_id', 'sede_id',
    'fecha_compra_utc', 'fecha_vencimiento_utc',
    'sesiones_totales', 'sesiones_consumidas',
    'precio_pagado', 'moneda', 'estado',
    'transferido_a', 'transferido_at', 'transferido_por',
    'notas', 'created_at', 'updated_at'
  ],

  politicas_cancelacion: [
    'id', 'nombre', 'ventana_horas', 'dentro_margen', 'fuera_margen',
    'aplica_a', 'entidad_id', 'estado', 'created_at', 'created_by'
  ],

  // ─── Core: Agendamientos (MVP — Iter 5) ────────────────────────────────
  agendamientos: [
    'id', 'user_id', 'entrenador_id', 'sede_id', 'plan_usuario_id', 'grupo_id',
    'tipo', 'fecha_inicio_utc', 'duracion_min', 'capacidad_max',
    'estado', 'color', 'visibilidad_nombres',
    'motivo_cancelacion', 'cancelado_por', 'cancelado_at_utc', 'dentro_margen',
    'requiere_autorizacion', 'autorizado_por', 'autorizado_at_utc',
    'notas_entrenador', 'notas_usuario',
    'created_at', 'updated_at', 'created_by'
  ],

  archivo_agendamientos: [
    'id', 'user_id', 'entrenador_id', 'sede_id', 'plan_usuario_id', 'grupo_id',
    'tipo', 'fecha_inicio_utc', 'duracion_min', 'capacidad_max',
    'estado', 'color', 'visibilidad_nombres',
    'motivo_cancelacion', 'cancelado_por', 'cancelado_at_utc', 'dentro_margen',
    'requiere_autorizacion', 'autorizado_por', 'autorizado_at_utc',
    'notas_entrenador', 'notas_usuario',
    'created_at', 'updated_at', 'created_by', 'archivado_at'
  ],

  asistencia: [
    'id', 'agendamiento_id', 'user_id', 'entrenador_id', 'presente',
    'llegada_utc', 'salida_utc',
    'peso', 'frec_card_max', 'frec_card_prom', 'saturacion',
    'presion_sis', 'presion_dia', 'dolor', 'energia',
    'observaciones', 'created_at', 'created_by'
  ],

  // ─── Entrenamiento (MVP — Iter 6) ──────────────────────────────────────
  rutinas: [
    'id', 'nombre', 'descripcion', 'creada_por', 'nivel',
    'grupos_musculares', 'duracion_estimada_min', 'ejercicios',
    'publica', 'estado', 'created_at', 'updated_at'
  ],

  rutinas_asignadas: [
    'id', 'rutina_id', 'user_id', 'grupo_id', 'entrenador_id',
    'fecha_inicio_utc', 'fecha_fin_utc', 'estado', 'notas', 'created_at'
  ],

  grupos: [
    'id', 'nombre', 'descripcion', 'entrenador_id', 'sede_id',
    'tipo', 'capacidad_max', 'color', 'estado',
    'created_at', 'updated_at'
  ],

  grupos_miembros: [
    'id', 'grupo_id', 'user_id',
    'fecha_ingreso_utc', 'fecha_salida_utc', 'estado'
  ],

  // ─── Comunicación (MVP — Iter 5/6) ─────────────────────────────────────
  mensajes: [
    'id', 'de_user_id', 'para_user_id', 'para_grupo_id', 'para_rol',
    'asunto', 'contenido', 'created_at'
  ],

  alertas: [
    'id', 'user_id', 'tipo', 'severidad', 'titulo', 'descripcion',
    'accion_url', 'entidad_ref', 'leida', 'leida_at_utc',
    'created_at', 'expires_at_utc'
  ],

  solicitudes: [
    'id', 'tipo', 'user_id', 'target_id', 'datos', 'estado',
    'resuelta_por', 'resuelta_at_utc', 'motivo_resolucion', 'created_at'
  ],

  // ─── Sistema (MVP — Iter 3) ────────────────────────────────────────────
  auditoria: [
    'id', 'created_at_utc', 'user_id', 'accion', 'entidad', 'entidad_id',
    'datos_antes', 'datos_despues', 'ip', 'user_agent',
    'resultado', 'error_msg'
  ],

  config: [
    'key', 'value', 'tipo', 'descripcion', 'updated_at_utc', 'updated_by'
  ],

  indices: [
    'entidad', 'valor', 'target_id'
  ],

  // ─── Fase 2 (creadas vacías en bootstrap para no migrar después) ───────
  encuestas: [
    'id', 'titulo', 'descripcion', 'creada_por', 'dirigida_a',
    'preguntas', 'fecha_inicio', 'fecha_fin', 'estado', 'created_at'
  ],

  encuestas_respuestas: [
    'id', 'encuesta_id', 'user_id', 'respuestas', 'submitted_at'
  ],

  calificaciones: [
    'id', 'agendamiento_id', 'de_user_id', 'para_user_id',
    'estrellas', 'comentario', 'created_at'
  ],

  logros_catalogo: [
    'id', 'codigo', 'nombre', 'descripcion', 'icono',
    'criterio', 'puntos', 'categoria'
  ],

  logros_usuario: [
    'id', 'user_id', 'logro_id', 'alcanzado_at', 'datos'
  ],

  puntos_usuario: [
    'user_id', 'total_puntos', 'nivel',
    'ultima_racha', 'racha_actual', 'updated_at'
  ],

  directorio_gimnasios: [
    'id', 'nombre_marca', 'verificado', 'restricciones',
    'contacto_dueno', 'created_at', 'updated_at'
  ],

  solicitudes_marca: [
    'id', 'marca', 'tipo_solicitud', 'datos', 'estado',
    'resuelta_por', 'resuelta_at', 'created_at'
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Configuración inicial — keys a insertar en hoja `config` durante bootstrap
// ──────────────────────────────────────────────────────────────────────────
const CONFIG_INITIAL = [
  ['app.name', 'Al Fallo', 'string', 'Nombre de la aplicación'],
  ['app.timezone_default', 'America/Bogota', 'string', 'Zona horaria por defecto para render'],
  ['app.currency_default', 'COP', 'string', 'Moneda por defecto'],
  ['app.session_ttl_hours', '8', 'number', 'Duración de la sesión en horas'],
  ['app.activation_token_ttl_hours', '24', 'number', 'TTL del token de activación de cuenta'],
  ['app.reset_token_ttl_hours', '1', 'number', 'TTL del token de reset de password'],
  ['app.draft_booking_ttl_minutes', '10', 'number', 'TTL del booking en estado borrador'],
  ['app.archive_after_days', '90', 'number', 'Días tras los cuales se archivan agendamientos finales'],
  ['app.disclaimer_url', '/disclaimer', 'string', 'Ruta del disclaimer público'],
  ['notif.email_enabled', 'true', 'boolean', 'Si se envían emails desde la plataforma'],
];

// ──────────────────────────────────────────────────────────────────────────
// Política de cancelación global default — insertada durante bootstrap
// ──────────────────────────────────────────────────────────────────────────
const POLITICA_CANCELACION_DEFAULT = {
  nombre: 'Estándar 12 horas',
  ventana_horas: 12,
  dentro_margen: 'sin_penalizacion',
  fuera_margen: 'descuenta_sesion',
  aplica_a: 'global',
  entidad_id: '',
  estado: 'active',
};

// ──────────────────────────────────────────────────────────────────────────
// Hojas que requieren índice en hoja `indices`
// ──────────────────────────────────────────────────────────────────────────
const INDEXED_LOOKUPS = {
  // entidad → { sourceSheet, sourceColumn }
  email:  { sheet: 'usuarios', col: 'email' },
  cedula: { sheet: 'usuarios', col: 'cedula' },
  nick:   { sheet: 'usuarios', col: 'nick' },
};


// ═══════════════════════════════════════════════════════════════════════
// db.gs
// ═══════════════════════════════════════════════════════════════════════

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


// ═══════════════════════════════════════════════════════════════════════
// crypto.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * crypto.gs — Hashing, salts, UUIDs, tokens.
 *
 * Limitación conocida de Apps Script: no hay bcrypt/argon2 nativo.
 * Usamos SHA-256 con salt único por usuario + pepper global en Script Properties.
 *
 * Documento de respaldo: docs/01-arquitectura.md §3.2
 */

// ──────────────────────────────────────────────────────────────────────────
// Pepper — string aleatorio fijo, se setea una sola vez en Script Properties
// ──────────────────────────────────────────────────────────────────────────

function crypto_getPepper_() {
  const pepper = PropertiesService.getScriptProperties().getProperty('PEPPER');
  if (!pepper) {
    throw new Error('PEPPER no está configurado en Script Properties. Ejecuta bootstrap() primero.');
  }
  return pepper;
}

function crypto_generatePepper_() {
  // 32 bytes (256 bits) → 64 chars hex
  return cryptoRandomHex(32);
}

// ──────────────────────────────────────────────────────────────────────────
// Hashing de passwords — SHA-256(pepper + salt + password)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Genera un nuevo par {salt, hash} para una contraseña.
 * @param {string} password
 * @return {{salt: string, hash: string, algoritmo: string}}
 */
function cryptoHashPassword(password) {
  const salt = cryptoRandomHex(16); // 16 bytes → 32 chars hex
  const hash = crypto_computeHash_(password, salt);
  return { salt: salt, hash: hash, algoritmo: 'sha256-v1' };
}

/**
 * Verifica una contraseña contra un par {salt, hash}.
 * @param {string} password
 * @param {string} salt
 * @param {string} hash
 * @return {boolean}
 */
function cryptoVerifyPassword(password, salt, hash) {
  const candidate = crypto_computeHash_(password, salt);
  return crypto_constantTimeEq_(candidate, hash);
}

function crypto_computeHash_(password, salt) {
  const pepper = crypto_getPepper_();
  const input = pepper + ':' + salt + ':' + password;
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  return crypto_bytesToHex_(digest);
}

// ──────────────────────────────────────────────────────────────────────────
// UUIDs y tokens
// ──────────────────────────────────────────────────────────────────────────

/**
 * UUID v4 estándar (formato 8-4-4-4-12). Usa el Utilities.getUuid() nativo.
 */
function cryptoUuid() {
  return Utilities.getUuid();
}

/**
 * Token aleatorio en hex. N bytes → 2N caracteres.
 * Usado para session tokens, activation tokens, reset tokens.
 */
function cryptoRandomHex(bytes) {
  const arr = [];
  for (let i = 0; i < bytes; i++) {
    arr.push(Math.floor(Math.random() * 256));
  }
  return crypto_bytesToHex_(arr);
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function crypto_bytesToHex_(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    let byte = bytes[i];
    if (byte < 0) byte += 256;
    hex += (byte < 16 ? '0' : '') + byte.toString(16);
  }
  return hex;
}

/**
 * Comparación en tiempo constante para evitar timing attacks en verificación
 * de hashes. Misma duración independiente de cuántos chars coincidan.
 */
function crypto_constantTimeEq_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}


// ═══════════════════════════════════════════════════════════════════════
// cache.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * cache.gs — Wrappers de CacheService de Apps Script.
 *
 * Reduce lecturas a Sheets para datos que cambian poco (catálogos, perfil
 * del usuario logueado, configuración).
 *
 * Limitación: max 100KB por entrada, max 10MB total por proyecto.
 * TTL máximo: 6 horas (21600 segundos).
 */

const CACHE_TTL = {
  short:  60,        // 1 min — perfil del usuario logueado
  medium: 300,       // 5 min — catálogos (sedes, planes)
  long:   1800,      // 30 min — config del sistema
  hour:   3600,      // 1 hora — datos rara vez cambian
};

/**
 * Lee del cache. Si miss, ejecuta loader, guarda y devuelve.
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {function(): any} loader
 */
function cacheGetOrLoad(key, ttlSeconds, loader) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit !== null) {
    try { return JSON.parse(hit); } catch (e) { /* invalid cache, regenera */ }
  }
  const value = loader();
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length < 100000) {
      cache.put(key, serialized, ttlSeconds);
    }
  } catch (e) {
    // No serializable → no se cachea, pero se devuelve
  }
  return value;
}

function cacheGet(key) {
  const hit = CacheService.getScriptCache().get(key);
  if (hit === null) return null;
  try { return JSON.parse(hit); } catch (e) { return null; }
}

function cachePut(key, value, ttlSeconds) {
  try {
    const s = JSON.stringify(value);
    if (s.length < 100000) {
      CacheService.getScriptCache().put(key, s, ttlSeconds || CACHE_TTL.medium);
    }
  } catch (e) { /* no serializable */ }
}

function cacheDelete(key) {
  CacheService.getScriptCache().remove(key);
}

function cacheDeleteMany(keys) {
  CacheService.getScriptCache().removeAll(keys);
}

/**
 * Invalidación por prefijo lógico. Apps Script no soporta wildcards en cache,
 * así que mantenemos una "lista de keys conocidas" que se borra explícitamente.
 * Útil para invalidar todo el catálogo cuando cambia una sede, por ejemplo.
 */
function cacheInvalidateNamespace(namespace) {
  // Llave conocidas registradas por el caller (patrón opcional).
  const indexKey = '__index__:' + namespace;
  const idx = cacheGet(indexKey);
  if (Array.isArray(idx)) {
    cacheDeleteMany(idx);
    cacheDelete(indexKey);
  }
}


// ═══════════════════════════════════════════════════════════════════════
// validate.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * validate.gs — Validaciones server-side de payloads.
 *
 * Espejo de los Zod schemas que tendrá el frontend. La validación es
 * defensiva: el frontend ya valida, pero confiar solo en cliente es
 * vulnerable. Aquí re-validamos todo lo que llega.
 *
 * Convención: las funciones devuelven el valor saneado, o lanzan
 *   ValidationError({ field, code, message }) que el router convierte
 *   en respuesta 400.
 */

function ValidationError(field, code, message) {
  const e = new Error(message || code);
  e.name = 'ValidationError';
  e.field = field;
  e.code = code;
  return e;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ISO_RE   = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// ──────────────────────────────────────────────────────────────────────────
// Validators atómicos
// ──────────────────────────────────────────────────────────────────────────

function vRequired(value, field) {
  if (value === null || value === undefined || value === '') {
    throw ValidationError(field, 'REQUIRED', field + ' es requerido');
  }
  return value;
}

function vString(value, field, opts) {
  if (typeof value !== 'string') {
    throw ValidationError(field, 'NOT_STRING', field + ' debe ser texto');
  }
  const trimmed = value.trim();
  const o = opts || {};
  if (o.min && trimmed.length < o.min) {
    throw ValidationError(field, 'TOO_SHORT', field + ' debe tener al menos ' + o.min + ' caracteres');
  }
  if (o.max && trimmed.length > o.max) {
    throw ValidationError(field, 'TOO_LONG', field + ' debe tener máximo ' + o.max + ' caracteres');
  }
  return trimmed;
}

function vEmail(value, field) {
  const s = vString(value, field || 'email').toLowerCase();
  if (!EMAIL_RE.test(s)) {
    throw ValidationError(field || 'email', 'INVALID_EMAIL', 'Formato de correo inválido');
  }
  return s;
}

function vUuid(value, field) {
  const s = vString(value, field);
  if (!UUID_RE.test(s)) {
    throw ValidationError(field, 'INVALID_UUID', field + ' debe ser un UUID válido');
  }
  return s;
}

function vIsoDate(value, field) {
  const s = vString(value, field);
  if (!ISO_RE.test(s)) {
    throw ValidationError(field, 'INVALID_DATE', field + ' debe ser una fecha ISO 8601 UTC');
  }
  return s;
}

function vEnum(value, field, allowed) {
  if (allowed.indexOf(value) === -1) {
    throw ValidationError(field, 'INVALID_ENUM',
      field + ' debe ser uno de: ' + allowed.join(', '));
  }
  return value;
}

function vBool(value, field) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  throw ValidationError(field, 'INVALID_BOOL', field + ' debe ser booleano');
}

function vNumber(value, field, opts) {
  const n = typeof value === 'number' ? value : Number(value);
  if (isNaN(n)) {
    throw ValidationError(field, 'INVALID_NUMBER', field + ' debe ser un número');
  }
  const o = opts || {};
  if (o.min !== undefined && n < o.min) {
    throw ValidationError(field, 'TOO_SMALL', field + ' debe ser >= ' + o.min);
  }
  if (o.max !== undefined && n > o.max) {
    throw ValidationError(field, 'TOO_LARGE', field + ' debe ser <= ' + o.max);
  }
  if (o.int && !Number.isInteger(n)) {
    throw ValidationError(field, 'NOT_INTEGER', field + ' debe ser entero');
  }
  return n;
}

function vPassword(value, field) {
  const s = vString(value, field || 'password', { min: 8, max: 200 });
  // Política mínima: ≥8 chars, al menos una letra y un número
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) {
    throw ValidationError(field || 'password', 'WEAK_PASSWORD',
      'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números');
  }
  return s;
}

// ──────────────────────────────────────────────────────────────────────────
// Validadores de payloads completos por acción
// (se llaman desde Code.gs antes de despachar al handler)
// ──────────────────────────────────────────────────────────────────────────

const PAYLOAD_VALIDATORS = {
  ping: function (p) { return p || {}; },

  loginUser: function (p) {
    return {
      email: vEmail(p.email),
      password: vRequired(p.password, 'password'),
    };
  },

  logoutUser: function (p) {
    return {};  // no payload necesario, usa el token del header
  },

  activateAccount: function (p) {
    return {
      token: vString(vRequired(p.token, 'token'), 'token', { min: 32 }),
      password: vPassword(p.password),
    };
  },

  requestPasswordReset: function (p) {
    return {
      email: vEmail(p.email),
    };
  },

  resetPassword: function (p) {
    return {
      token: vString(vRequired(p.token, 'token'), 'token', { min: 32 }),
      password: vPassword(p.password),
    };
  },
};

/**
 * Valida un payload según la acción. Si no hay validador para la acción,
 * devuelve el payload tal cual (los handlers individuales pueden re-validar).
 */
function validatePayload(action, payload) {
  const validator = PAYLOAD_VALIDATORS[action];
  if (!validator) return payload || {};
  return validator(payload || {});
}


// ═══════════════════════════════════════════════════════════════════════
// audit.gs
// ═══════════════════════════════════════════════════════════════════════

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


// ═══════════════════════════════════════════════════════════════════════
// email.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * email.gs — Plantillas y envío de emails transaccionales.
 *
 * Usa MailApp.sendEmail (cuota: 100 emails/día en cuenta gratuita,
 * 1500/día en Workspace). El remitente es la cuenta dueña del script.
 *
 * Si el envío falla (ej. cuota agotada), se loguea pero NO se relanza —
 * los flujos de auth no deben caerse por un email.
 */

// ──────────────────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────────────────

/**
 * Envía link de reset de password.
 * @param {Object} user — fila de la hoja `usuarios`
 * @param {string} token — del registro en tokens_temporales
 */
function emailSendPasswordReset(user, token) {
  if (!email_isEnabled_()) return;

  const link = 'https://dyoma-web.github.io/alfallo/#/reset-password?token=' + encodeURIComponent(token);
  const greetingName = user.nombres ? user.nombres : 'tú';

  email_send_({
    to: user.email,
    subject: 'Restablece tu contraseña — Al Fallo',
    plainBody:
      'Hola ' + greetingName + ',\n\n' +
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Al Fallo.\n\n' +
      'Si fuiste tú, abre este enlace en la próxima hora:\n' +
      link + '\n\n' +
      'Si no fuiste tú, ignora este correo. Tu cuenta sigue protegida.\n\n' +
      '— El equipo de administración\n' +
      '\n— — —\n' +
      'Al Fallo · Operado bajo Ley 1581/2012\n',
    htmlBody: email_renderHtml_({
      title: 'Restablece tu contraseña',
      greeting: 'Hola ' + greetingName + ',',
      paragraphs: [
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Al Fallo.',
        'Si fuiste tú, abre el enlace en la próxima hora.',
      ],
      cta: { label: 'Restablecer contraseña', url: link },
      footnote: 'Este enlace vence en 1 hora. Si no solicitaste el cambio, ignora este correo.',
    }),
  });
}

/**
 * Envía link de activación de cuenta.
 * Útil cuando un Admin crea un nuevo usuario en Iter 7.
 */
function emailSendActivationLink(user, token) {
  if (!email_isEnabled_()) return;

  const link = 'https://dyoma-web.github.io/alfallo/#/activate?token=' + encodeURIComponent(token);
  const greetingName = user.nombres ? user.nombres : 'tú';

  email_send_({
    to: user.email,
    subject: 'Activa tu cuenta — Al Fallo',
    plainBody:
      'Hola ' + greetingName + ',\n\n' +
      'Tu cuenta en Al Fallo fue creada por el equipo de administración.\n\n' +
      'Para activarla y establecer tu contraseña, abre este enlace en las próximas 24 horas:\n' +
      link + '\n\n' +
      'Si no esperabas este correo, escríbenos y lo verificamos.\n\n' +
      '— El equipo de administración\n' +
      '\n— — —\n' +
      'Al Fallo · Operado bajo Ley 1581/2012\n',
    htmlBody: email_renderHtml_({
      title: 'Activa tu cuenta',
      greeting: 'Hola ' + greetingName + ',',
      paragraphs: [
        'Tu cuenta en Al Fallo fue creada por el equipo de administración.',
        'Activa tu cuenta y establece tu contraseña con el enlace de abajo.',
      ],
      cta: { label: 'Activar cuenta', url: link },
      footnote: 'Este enlace vence en 24 horas.',
    }),
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function email_isEnabled_() {
  const cfg = dbFindById('config', 'notif.email_enabled');
  if (!cfg) return true;  // default ON
  return String(cfg.value).toLowerCase() !== 'false';
}

function email_send_(opts) {
  try {
    MailApp.sendEmail({
      to: opts.to,
      subject: opts.subject,
      body: opts.plainBody,
      htmlBody: opts.htmlBody,
      name: 'Al Fallo',
      noReply: true,
    });
  } catch (e) {
    Logger.log('email_send_ FAILED to=' + opts.to + ' subject="' + opts.subject + '" — ' + e.message);
    // No re-throw — el flujo de auth no debe fallar por un email.
  }
}

/**
 * Renderiza HTML con la marca dark de Al Fallo (lime sobre fondo casi-negro).
 * Inline styles porque la mayoría de clientes de email NO soportan CSS externo.
 */
function email_renderHtml_(opts) {
  const paragraphsHtml = opts.paragraphs
    .map(function (p) {
      return '<p style="color:#A8B0A4;line-height:1.6;margin:0 0 12px;font-size:15px">' + p + '</p>';
    })
    .join('');

  return [
    '<!DOCTYPE html>',
    '<html lang="es"><head><meta charset="utf-8"><title>' + opts.title + '</title></head>',
    '<body style="margin:0;padding:0;background:#0F1410;color:#F2F4EF;',
    '       font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Inter,sans-serif">',
    '<table role="presentation" style="width:100%;border-collapse:collapse;background:#0F1410">',
    '  <tr><td align="center" style="padding:32px 16px">',
    '    <table role="presentation" style="max-width:480px;width:100%;background:#171D17;',
    '           border-radius:16px;border:1px solid rgba(255,255,255,0.08)">',
    '      <tr><td style="padding:32px">',
    '        <div style="font-size:22px;font-weight:700;letter-spacing:-0.04em;margin-bottom:24px;color:#F2F4EF">',
    '          al<span style="color:#C8FF3D">/</span>fallo',
    '        </div>',
    '        <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#F2F4EF;margin:0 0 16px">',
    '          ' + opts.title,
    '        </h1>',
    '        <p style="color:#A8B0A4;line-height:1.6;margin:0 0 12px;font-size:15px">' + opts.greeting + '</p>',
    '        ' + paragraphsHtml,
    '        <div style="margin:24px 0;text-align:left">',
    '          <a href="' + opts.cta.url + '" style="display:inline-block;background:#C8FF3D;color:#0B1208;',
    '             padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;',
    '             letter-spacing:-0.01em">' + opts.cta.label + '</a>',
    '        </div>',
    '        <p style="color:#6B746A;font-size:13px;line-height:1.6;margin:0">' + opts.footnote + '</p>',
    '      </td></tr>',
    '    </table>',
    '    <p style="color:#6B746A;font-size:11px;margin:20px 0 0;text-align:center;line-height:1.6">',
    '      Al Fallo · Operado bajo Ley 1581/2012<br>',
    '      ¿Preguntas? Escribe a <a href="mailto:david.yomayusa@innovahub.org" style="color:#A8B0A4">david.yomayusa@innovahub.org</a>',
    '    </p>',
    '  </td></tr>',
    '</table></body></html>',
  ].join('\n');
}


// ═══════════════════════════════════════════════════════════════════════
// auth.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * auth.gs — Login, logout, validación de sesiones, activación de cuenta.
 *
 * Documento de respaldo: docs/01-arquitectura.md §3
 *
 * Patrón de respuesta:
 *   - éxito:  retorna el objeto resultado
 *   - error:  lanza Error con .code (mapeado por el router a HTTP 4xx/5xx)
 */

// Errores tipados — el router los convierte en respuestas.
function AuthError(code, message) {
  const e = new Error(message || code);
  e.name = 'AuthError';
  e.code = code;
  return e;
}

// ──────────────────────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {{email: string, password: string}} payload — ya validado por validatePayload
 * @param {Object} reqMeta — { ip, user_agent }
 * @return {{token: string, user: Object, role: string, expiresAt: string}}
 */
function authLogin(payload, reqMeta) {
  const userId = dbIndexLookup('email', payload.email);
  if (!userId) {
    auditDenied('', 'login', 'email_not_found:' + payload.email, reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  const user = dbFindById('usuarios', userId);
  if (!user) {
    auditDenied('', 'login', 'user_id_orphan:' + userId, reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  if (user.estado === 'pending') {
    auditDenied(userId, 'login', 'account_pending', reqMeta);
    throw AuthError('ACCOUNT_PENDING', 'Tu cuenta aún no ha sido activada. Revisa tu correo.');
  }
  if (user.estado === 'suspended') {
    auditDenied(userId, 'login', 'account_suspended', reqMeta);
    throw AuthError('ACCOUNT_SUSPENDED', 'Tu cuenta está suspendida. Contacta al equipo.');
  }
  if (user.estado === 'archived') {
    auditDenied(userId, 'login', 'account_archived', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  const pwd = dbFindById('usuarios_pwd', userId);
  if (!pwd) {
    auditDenied(userId, 'login', 'no_password_set', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  if (!cryptoVerifyPassword(payload.password, pwd.salt, pwd.hash)) {
    auditDenied(userId, 'login', 'password_mismatch', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  // OK — crear sesión
  const ttlHours = auth_getSessionTtl_();
  const now = dbNowUtc();
  const expiresAt = dbAddHours(now, ttlHours);
  const token = cryptoRandomHex(32);

  dbInsert('sesiones', {
    token: token,
    user_id: user.id,
    rol: user.rol,
    created_at: now,
    expires_at: expiresAt,
    last_seen_at: now,
    user_agent: (reqMeta && reqMeta.user_agent) || '',
    ip: (reqMeta && reqMeta.ip) || '',
    revoked: false,
  });

  // Actualizar last_login_at del usuario
  dbUpdateById('usuarios', user.id, {
    last_login_at: now,
    updated_at: now,
  });

  auditOk(user.id, 'login', 'sesion', token, '', '', reqMeta);

  return {
    token: token,
    user: auth_publicUserShape_(user),
    role: user.rol,
    expiresAt: expiresAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Logout
// ──────────────────────────────────────────────────────────────────────────

function authLogout(_payload, ctx) {
  if (!ctx || !ctx.token) return { ok: true };
  try {
    dbUpdateById('sesiones', ctx.token, {
      revoked: true,
      last_seen_at: dbNowUtc(),
    });
  } catch (e) {
    // si la sesión no existe, no problema — idempotente
  }
  auditOk(ctx.userId || '', 'logout', 'sesion', ctx.token, '', '', ctx.reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Validación de sesión — usado por el router para todas las acciones
// que requieren auth
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {string} token
 * @return {{userId, role, user, sessionToken}} — si válida
 * @throws AuthError(UNAUTHORIZED) — si inválida o expirada
 */
function authValidateSession(token) {
  if (!token || typeof token !== 'string') {
    throw AuthError('UNAUTHORIZED', 'Sesión no enviada');
  }
  const sess = dbFindById('sesiones', token);
  if (!sess) {
    throw AuthError('UNAUTHORIZED', 'Sesión inválida');
  }
  if (sess.revoked === true || sess.revoked === 'TRUE') {
    throw AuthError('UNAUTHORIZED', 'Sesión revocada');
  }
  const now = new Date();
  const exp = new Date(sess.expires_at);
  if (now > exp) {
    throw AuthError('SESSION_EXPIRED', 'Sesión expirada');
  }
  const user = dbFindById('usuarios', sess.user_id);
  if (!user || user.estado !== 'active') {
    throw AuthError('UNAUTHORIZED', 'Cuenta no activa');
  }

  // Renovar last_seen_at sin tocar expires_at (ventana fija)
  dbUpdateById('sesiones', token, { last_seen_at: dbNowUtc() });

  return {
    userId: sess.user_id,
    role: sess.rol,
    user: user,
    sessionToken: token,
  };
}

/**
 * Helper: garantiza que el usuario autenticado tiene uno de los roles dados.
 */
function authRequireRole(ctx, allowedRoles) {
  if (!ctx || !ctx.role) throw AuthError('UNAUTHORIZED', 'Sesión requerida');
  if (allowedRoles.indexOf(ctx.role) === -1) {
    throw AuthError('FORBIDDEN', 'No tienes permiso para esta acción');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Activación de cuenta — el usuario semilla y los creados por Admin pasan por aquí
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {{token: string, password: string}} payload
 */
function authActivateAccount(payload, reqMeta) {
  const tokenRow = dbFindById('tokens_temporales', payload.token);
  if (!tokenRow) {
    throw AuthError('INVALID_TOKEN', 'Token de activación inválido');
  }
  if (tokenRow.tipo !== 'activation') {
    throw AuthError('INVALID_TOKEN', 'Token no es de activación');
  }
  if (tokenRow.used_at) {
    throw AuthError('TOKEN_USED', 'Este enlace ya fue usado');
  }
  const now = new Date();
  if (now > new Date(tokenRow.expires_at)) {
    throw AuthError('TOKEN_EXPIRED', 'El enlace de activación expiró');
  }

  const user = dbFindById('usuarios', tokenRow.user_id);
  if (!user) {
    throw AuthError('INVALID_TOKEN', 'Usuario no encontrado');
  }

  // Setear password
  const { salt, hash, algoritmo } = cryptoHashPassword(payload.password);
  const existingPwd = dbFindById('usuarios_pwd', user.id);
  const nowIso = dbNowUtc();
  if (existingPwd) {
    dbUpdateById('usuarios_pwd', user.id, {
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  } else {
    dbInsert('usuarios_pwd', {
      user_id: user.id,
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  }

  // Activar cuenta
  dbUpdateById('usuarios', user.id, {
    estado: 'active',
    updated_at: nowIso,
  });

  // Marcar token como usado
  dbUpdateById('tokens_temporales', payload.token, { used_at: nowIso });

  auditOk(user.id, 'activate_account', 'usuario', user.id, '', '', reqMeta);

  return { ok: true, email: user.email };
}

// ──────────────────────────────────────────────────────────────────────────
// Solicitar reset de password (envía email con link)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Siempre devuelve { ok: true }, exista o no el email — para no leak qué
 * correos están registrados (defensa contra enumeración de cuentas).
 */
function authRequestPasswordReset(payload, reqMeta) {
  const userId = dbIndexLookup('email', payload.email);

  if (!userId) {
    auditLog({
      accion: 'request_password_reset',
      entidad: 'usuario',
      resultado: 'denied',
      error_msg: 'email_not_found:' + payload.email,
    }, reqMeta);
    Utilities.sleep(400 + Math.floor(Math.random() * 300));
    return { ok: true };
  }

  const user = dbFindById('usuarios', userId);
  if (!user) return { ok: true };

  // Solo emitir el reset si la cuenta está activa
  if (user.estado !== 'active') {
    auditDenied(userId, 'request_password_reset', 'account_not_active:' + user.estado, reqMeta);
    Utilities.sleep(400);
    return { ok: true };
  }

  const ttlHours = (function () {
    const cfg = dbFindById('config', 'app.reset_token_ttl_hours');
    return cfg ? Number(cfg.value) : 1;
  })();

  const token = cryptoRandomHex(32);
  const now = dbNowUtc();
  dbInsert('tokens_temporales', {
    token: token,
    tipo: 'password_reset',
    user_id: user.id,
    created_at: now,
    expires_at: dbAddHours(now, ttlHours),
    used_at: '',
  });

  emailSendPasswordReset(user, token);

  auditOk(user.id, 'request_password_reset', 'usuario', user.id, '', '', reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Reset de password (consume el token y revoca sesiones activas)
// ──────────────────────────────────────────────────────────────────────────

function authResetPassword(payload, reqMeta) {
  const tokenRow = dbFindById('tokens_temporales', payload.token);
  if (!tokenRow) throw AuthError('INVALID_TOKEN', 'Enlace inválido');
  if (tokenRow.tipo !== 'password_reset') {
    throw AuthError('INVALID_TOKEN', 'Token no es de reset');
  }
  if (tokenRow.used_at) throw AuthError('TOKEN_USED', 'Este enlace ya fue usado');
  if (new Date() > new Date(tokenRow.expires_at)) {
    throw AuthError('TOKEN_EXPIRED', 'El enlace expiró. Solicita uno nuevo.');
  }

  const user = dbFindById('usuarios', tokenRow.user_id);
  if (!user) throw AuthError('INVALID_TOKEN', 'Usuario no encontrado');

  const { salt, hash, algoritmo } = cryptoHashPassword(payload.password);
  const nowIso = dbNowUtc();
  const existingPwd = dbFindById('usuarios_pwd', user.id);
  if (existingPwd) {
    dbUpdateById('usuarios_pwd', user.id, {
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  } else {
    dbInsert('usuarios_pwd', {
      user_id: user.id,
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  }

  // Marcar token como usado
  dbUpdateById('tokens_temporales', payload.token, { used_at: nowIso });

  // Revocar TODAS las sesiones activas — fuerza relogin con la nueva password
  const activeSessions = dbListAll('sesiones', function (s) {
    return s.user_id === user.id && s.revoked !== true && s.revoked !== 'TRUE';
  });
  for (let i = 0; i < activeSessions.length; i++) {
    dbUpdateById('sesiones', activeSessions[i].token, {
      revoked: true,
      last_seen_at: nowIso,
    });
  }

  auditOk(user.id, 'reset_password', 'usuario', user.id, '', '', reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function auth_getSessionTtl_() {
  const cfg = dbFindById('config', 'app.session_ttl_hours');
  return cfg ? Number(cfg.value) : 8;
}

/**
 * Forma pública del usuario — sin datos sensibles (cedula, etc).
 * Usado en respuestas al frontend.
 */
function auth_publicUserShape_(user) {
  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombres: user.nombres,
    apellidos: user.apellidos,
    nick: user.nick,
    foto_url: user.foto_url,
    estado: user.estado,
    privacidad_fotos: user.privacidad_fotos,
    preferencias_notif: user.preferencias_notif,
    entrenador_asignado_id: user.entrenador_asignado_id,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Code.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * Code.gs — Entry point del Web App. Router de doGet / doPost.
 *
 * Convención de request (todo en body, ver docs/01-arquitectura.md §6):
 *   {
 *     "action":  "loginUser" | "ping" | ...,
 *     "payload": {...},
 *     "token":   "session-token-aqui"   // solo para acciones autenticadas
 *   }
 *
 * Convención de response:
 *   éxito → { "result": <obj> }
 *   error → { "error": { "code": "STR", "message": "..." } }
 */

// Acciones que NO requieren autenticación (whitelist explícita).
const PUBLIC_ACTIONS = [
  'ping',
  'loginUser',
  'activateAccount',
  'requestPasswordReset',
  'resetPassword',
];

// ──────────────────────────────────────────────────────────────────────────
// HTTP entry points
// ──────────────────────────────────────────────────────────────────────────

function doGet(e) {
  // GET solo expone ping para testing rápido en el navegador.
  return _respondJson({ result: _handleAction('ping', {}, null, _reqMeta(e)) });
}

function doPost(e) {
  let body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (parseErr) {
    return _respondJson({ error: { code: 'BAD_JSON', message: 'Body inválido (JSON malformado)' } });
  }

  const action  = body.action || '';
  const payload = body.payload || {};
  const token   = body.token || null;
  const reqMeta = _reqMeta(e);

  try {
    const result = _handleAction(action, payload, token, reqMeta);
    return _respondJson({ result: result });
  } catch (err) {
    Logger.log('[' + action + '] ' + err.name + ': ' + err.message + '\n' + (err.stack || ''));
    return _respondJson({
      error: {
        code: err.code || (err.name === 'ValidationError' ? 'VALIDATION' : 'INTERNAL'),
        message: err.message || 'Error interno',
        field: err.field,
      },
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────────────────────────────────

function _handleAction(action, rawPayload, token, reqMeta) {
  if (!action) throw _err('MISSING_ACTION', 'Falta la acción');

  const isPublic = PUBLIC_ACTIONS.indexOf(action) !== -1;
  let ctx = { reqMeta: reqMeta };

  if (!isPublic) {
    const session = authValidateSession(token);
    ctx.userId = session.userId;
    ctx.role = session.role;
    ctx.user = session.user;
    ctx.token = session.sessionToken;
  }

  // Validar payload
  const payload = validatePayload(action, rawPayload);

  // Despachar
  switch (action) {

    // ── Sistema ──────────────────────────────────────────────────────────
    case 'ping':
      return { pong: true, time: dbNowUtc(), version: '0.1.0' };

    // ── Auth (Iter 3) ────────────────────────────────────────────────────
    case 'loginUser':
      return authLogin(payload, reqMeta);

    case 'logoutUser':
      return authLogout(payload, ctx);

    case 'activateAccount':
      return authActivateAccount(payload, reqMeta);

    case 'requestPasswordReset':
      return authRequestPasswordReset(payload, reqMeta);

    case 'resetPassword':
      return authResetPassword(payload, reqMeta);

    // ── Default ──────────────────────────────────────────────────────────
    default:
      throw _err('UNKNOWN_ACTION', 'Acción desconocida: ' + action);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function _respondJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _err(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

/**
 * Extrae metadata útil del evento. Apps Script da acceso muy limitado a
 * headers — no hay IP real ni user-agent. Lo que se pueda capturar.
 */
function _reqMeta(e) {
  const meta = { ip: '', user_agent: '' };
  if (!e) return meta;
  // Apps Script no expone headers HTTP. Solo parámetros de query.
  if (e.parameter && e.parameter.ua) meta.user_agent = String(e.parameter.ua).slice(0, 200);
  return meta;
}


// ═══════════════════════════════════════════════════════════════════════
// bootstrap.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * bootstrap.gs — Inicializa el Sheet "Alfallo" desde cero.
 *
 * Ejecutar UNA VEZ desde el editor de Apps Script:
 *   1. Abre el editor del proyecto
 *   2. Selecciona la función `bootstrap` en el dropdown
 *   3. Click en "Run" (Ejecutar)
 *   4. Autoriza los permisos solicitados (spreadsheet, mail, drive)
 *
 * La función es IDEMPOTENTE: ejecutarla varias veces no duplica datos.
 *  - Hojas: solo crea las que faltan, no toca las existentes.
 *  - Config: solo inserta keys que no existen.
 *  - Super admin: solo lo crea si no existe ya.
 *  - PEPPER: solo se genera si no está en Script Properties.
 *
 * IMPORTANTE: el PEPPER es irrecuperable. Si se borra de Script Properties,
 * todos los hashes de password quedan inválidos y nadie puede loguearse.
 * Anótalo en un gestor de contraseñas la primera vez que se genere.
 */

// ⚠️ Si cambia el correo del super admin, actualizar aquí.
const BOOTSTRAP_SUPER_ADMIN = {
  email: 'david.yomayusa@innovahub.org',
  nombres: 'David',
  apellidos: 'Yomayusa Salinas',
  nick: 'admin',
};

// ID del Sheet de Al Fallo. Se cachea en Script Properties tras primer bootstrap.
const BOOTSTRAP_SHEET_ID = '1kVdrzGDzeGvdknpSqoz1AcOQgfAwIeaGbhPssAG7QAs';

// ──────────────────────────────────────────────────────────────────────────
// Entry point — ejecutar desde el editor
// ──────────────────────────────────────────────────────────────────────────

function bootstrap() {
  Logger.log('=== ALFALLO BOOTSTRAP ===');
  Logger.log('Inicio: ' + new Date().toISOString());

  const props = PropertiesService.getScriptProperties();

  // 1. Setear SHEET_ID si no existe
  if (!props.getProperty('SHEET_ID')) {
    props.setProperty('SHEET_ID', BOOTSTRAP_SHEET_ID);
    Logger.log('✓ SHEET_ID guardado en Script Properties');
  } else {
    Logger.log('• SHEET_ID ya estaba configurado');
  }

  // 2. Generar PEPPER si no existe
  if (!props.getProperty('PEPPER')) {
    const pepper = crypto_generatePepper_();
    props.setProperty('PEPPER', pepper);
    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('🔐 PEPPER GENERADO — guarda este valor en lugar seguro:');
    Logger.log('   ' + pepper);
    Logger.log('   (Si se pierde, todos los hashes de password quedan inválidos)');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('');
  } else {
    Logger.log('• PEPPER ya estaba configurado');
  }

  // 3. Crear hojas que falten
  const created = bootstrap_createMissingSheets_();
  Logger.log('✓ Hojas creadas: ' + created.length + (created.length ? ' → ' + created.join(', ') : ''));

  // 4. Borrar la hoja "Hoja 1" / "Sheet1" default si quedó huérfana
  bootstrap_dropDefaultSheet_();

  // 5. Insertar config inicial
  const cfgInserted = bootstrap_seedConfig_();
  Logger.log('✓ Keys de config insertadas: ' + cfgInserted);

  // 6. Insertar política de cancelación default
  const polCreated = bootstrap_seedPoliticaCancelacion_();
  Logger.log(polCreated
    ? '✓ Política de cancelación default creada'
    : '• Política de cancelación default ya existía');

  // 7. Crear super admin
  const adminCreated = bootstrap_seedSuperAdmin_();
  Logger.log(adminCreated.created
    ? '✓ Super admin creado: ' + BOOTSTRAP_SUPER_ADMIN.email
    : '• Super admin ya existía');

  // 8. Generar token de activación (solo si admin recién creado o sin password)
  const activationLink = bootstrap_generateActivationLink_(adminCreated.userId, adminCreated.created);
  if (activationLink) {
    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('🔑 TOKEN DE ACTIVACIÓN para ' + BOOTSTRAP_SUPER_ADMIN.email);
    Logger.log('   Enlace de activación (válido 24h):');
    Logger.log('   https://dyoma-web.github.io/alfallo/#/activate?token=' + activationLink);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('');
  }

  Logger.log('=== BOOTSTRAP COMPLETADO ===');
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Crear hojas con sus headers + formato
// ──────────────────────────────────────────────────────────────────────────

function bootstrap_createMissingSheets_() {
  const ss = db_getSpreadsheet_();
  const existing = {};
  ss.getSheets().forEach(function (sh) { existing[sh.getName()] = true; });

  const created = [];
  for (const name in SCHEMA) {
    if (existing[name]) continue;
    const headers = SCHEMA[name];
    const sh = ss.insertSheet(name);
    bootstrap_applySchema_(sh, headers);
    created.push(name);
  }
  return created;
}

function bootstrap_applySchema_(sheet, headers) {
  // Headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  // Formato del header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1F2620');
  headerRange.setFontColor('#F2F4EF');
  // Freeze
  sheet.setFrozenRows(1);
  // Auto-resize
  sheet.autoResizeColumns(1, headers.length);
  // Quitar columnas extra (Sheets las trae a 26 por defecto)
  const maxCols = sheet.getMaxColumns();
  if (maxCols > headers.length) {
    sheet.deleteColumns(headers.length + 1, maxCols - headers.length);
  }
  // Quitar filas vacías sobrantes
  const maxRows = sheet.getMaxRows();
  if (maxRows > 100) {
    sheet.deleteRows(101, maxRows - 100);
  }
}

function bootstrap_dropDefaultSheet_() {
  const ss = db_getSpreadsheet_();
  const sheets = ss.getSheets();
  if (sheets.length <= 1) return;
  const candidates = ['Hoja 1', 'Sheet1', 'Hoja1'];
  candidates.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (sh) {
      try { ss.deleteSheet(sh); Logger.log('• Hoja default eliminada: ' + name); }
      catch (e) { /* ignorar */ }
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Seeds — config, política de cancelación, super admin
// ──────────────────────────────────────────────────────────────────────────

function bootstrap_seedConfig_() {
  let inserted = 0;
  const now = dbNowUtc();
  CONFIG_INITIAL.forEach(function (row) {
    const key = row[0];
    const existing = dbFindById('config', key);
    if (existing) return;
    dbInsert('config', {
      key: key,
      value: row[1],
      tipo: row[2],
      descripcion: row[3],
      updated_at_utc: now,
      updated_by: 'bootstrap',
    });
    inserted++;
  });
  return inserted;
}

function bootstrap_seedPoliticaCancelacion_() {
  // ¿Ya hay alguna política global?
  const existing = dbListAll('politicas_cancelacion', function (p) {
    return p.aplica_a === 'global' && p.estado === 'active';
  });
  if (existing.length > 0) return false;

  const now = dbNowUtc();
  dbInsert('politicas_cancelacion', Object.assign({}, POLITICA_CANCELACION_DEFAULT, {
    id: cryptoUuid(),
    created_at: now,
    created_by: 'bootstrap',
  }));
  return true;
}

function bootstrap_seedSuperAdmin_() {
  // ¿Ya existe un usuario con este email?
  const existingId = dbIndexLookup('email', BOOTSTRAP_SUPER_ADMIN.email);
  if (existingId) {
    return { created: false, userId: existingId };
  }

  const now = dbNowUtc();
  const userId = cryptoUuid();

  dbInsert('usuarios', {
    id: userId,
    email: BOOTSTRAP_SUPER_ADMIN.email,
    rol: 'super_admin',
    nombres: BOOTSTRAP_SUPER_ADMIN.nombres,
    apellidos: BOOTSTRAP_SUPER_ADMIN.apellidos,
    nick: BOOTSTRAP_SUPER_ADMIN.nick,
    cedula: '',
    celular: '',
    foto_url: '',
    estado: 'pending',           // Activa con el link de activación
    preferencias_notif: { in_app: true, email: true },
    privacidad_fotos: 'solo_yo',
    entrenador_asignado_id: '',
    created_at: now,
    updated_at: now,
    last_login_at: '',
    created_by: 'bootstrap',
  });

  // Registrar en índices
  dbIndexUpsert('email', BOOTSTRAP_SUPER_ADMIN.email, userId);
  dbIndexUpsert('nick', BOOTSTRAP_SUPER_ADMIN.nick, userId);

  return { created: true, userId: userId };
}

function bootstrap_generateActivationLink_(userId, justCreated) {
  // Si el admin ya tiene password seteado, no regenerar token
  const pwd = dbFindById('usuarios_pwd', userId);
  if (pwd && !justCreated) {
    return null;
  }

  // ¿Ya hay un token de activación válido sin usar?
  const existingTokens = dbListAll('tokens_temporales', function (t) {
    return t.user_id === userId && t.tipo === 'activation' && !t.used_at
      && new Date(t.expires_at) > new Date();
  });
  if (existingTokens.length > 0) {
    return existingTokens[0].token;
  }

  // Generar nuevo
  const token = cryptoRandomHex(32);
  const ttlHours = (function () {
    const cfg = dbFindById('config', 'app.activation_token_ttl_hours');
    return cfg ? Number(cfg.value) : 24;
  })();
  const now = dbNowUtc();
  dbInsert('tokens_temporales', {
    token: token,
    tipo: 'activation',
    user_id: userId,
    created_at: now,
    expires_at: dbAddHours(now, ttlHours),
    used_at: '',
  });
  return token;
}

// ──────────────────────────────────────────────────────────────────────────
// Diagnóstico — ejecutar para verificar el estado del Sheet sin modificar
// ──────────────────────────────────────────────────────────────────────────

function diagnose() {
  Logger.log('=== DIAGNÓSTICO ALFALLO ===');
  const props = PropertiesService.getScriptProperties();
  Logger.log('SHEET_ID: ' + (props.getProperty('SHEET_ID') ? '✓ configurado' : '✗ falta'));
  Logger.log('PEPPER:   ' + (props.getProperty('PEPPER')   ? '✓ configurado (oculto)' : '✗ falta'));

  const ss = db_getSpreadsheet_();
  const existing = {};
  ss.getSheets().forEach(function (sh) { existing[sh.getName()] = sh.getLastRow(); });

  let total = 0, missing = 0;
  for (const name in SCHEMA) {
    total++;
    if (!existing[name]) {
      Logger.log('  ✗ FALTA: ' + name);
      missing++;
    } else {
      Logger.log('  ✓ ' + name + ' (' + (existing[name] - 1) + ' filas)');
    }
  }
  Logger.log('Hojas: ' + (total - missing) + '/' + total + ' presentes');
  Logger.log('=== FIN ===');
}
