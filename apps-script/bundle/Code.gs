/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                  AL FALLO — BUNDLED BACKEND                      ║
 * ║                                                                  ║
 * ║  Generado automáticamente desde apps-script/*.gs.                ║
 * ║  NO EDITES ESTE ARCHIVO DIRECTAMENTE — modifica los fuentes      ║
 * ║  en apps-script/ y ejecuta: npm run gs:bundle                    ║
 * ║                                                                  ║
 * ║  Repo:    https://github.com/dyoma-web/alfallo                   ║
 * ║  Built:   2026-05-06T00:56:11.050Z                              ║
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
    'cupos_personalizado', 'cupos_semipersonalizado', 'cupos_grupal',
    'meta_economica_mensual', 'meta_usuarios_activos',
    'categoria_profesional', 'tipo_profesional',
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
    'servicios', 'reglas', 'estado', 'gimnasio_id',
    'categoria_sede', 'categoria_rank',
    'created_at', 'updated_at'
  ],

  // Iter 10: gimnasios agrupan sedes (ej. Bodytech, SmartFit). Solo Admin
  // los crea. Los entrenadores piden creación vía solicitudes.
  gimnasios: [
    'id', 'nombre', 'descripcion', 'logo_url', 'pais',
    'verificado', 'estado',
    'created_at', 'updated_at', 'created_by'
  ],

  // Iter 12: franjas de no-disponibilidad. Trainers y admin las crean.
  // Bloquean agendamiento del trainer en esos horarios.
  // Recurrencia simple: none/daily/weekly con dias_semana (CSV de 0-6,
  // donde 0=domingo) y intervalo (cada N días/semanas).
  unavailability: [
    'id', 'entity_type', 'entity_id',
    'titulo', 'descripcion',
    'fecha_inicio_utc', 'fecha_fin_utc',
    'recurrence', 'dias_semana', 'intervalo', 'fecha_fin_recurrencia',
    'estado',
    'created_at', 'updated_at', 'created_by'
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
    'cupos_max_simultaneos', 'cupos_estricto',
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
    'requiere_autorizacion', 'motivo_autorizacion',
    'autorizado_por', 'autorizado_at_utc',
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

  // Iter 14: metas mensuales del profesional. Varias metas por mes con nombre
  // libre. Tipo=economica define el tier (suma de todas las económicas vs
  // acumulado de planes vendidos). Tipo=usuarios y otra son informativas.
  // Constraint lógica: (profesional_id, periodo, nombre) único.
  metas_profesional: [
    'id', 'profesional_id', 'periodo', 'nombre', 'tipo', 'valor',
    'created_at', 'updated_at'
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
// Diagnóstico — ejecutar desde el editor de Apps Script
// ──────────────────────────────────────────────────────────────────────────

/**
 * EJECUTAR UNA SOLA VEZ desde el editor (dropdown → authorizeMailScope → Run).
 *
 * Después de pegar código nuevo que usa MailApp, Apps Script detecta el
 * scope `script.send_mail` pero NO lo autoriza automáticamente al hacer
 * deploy. Si nadie corre ninguna función que use MailApp desde el editor,
 * la Web App deployada intenta enviar emails y falla silenciosamente
 * (porque el wrapper email_send_ traga los errores para no romper el flujo
 * de password reset).
 *
 * Esta función envía un correo de prueba a la cuenta dueña del script:
 *   1. Apps Script pide autorización del scope de envío de emails.
 *   2. Aceptas → queda autorizado para todo el proyecto.
 *   3. Recibes el email en tu inbox → confirmación de que funciona.
 *   4. La Web App deployada también puede enviar emails desde ese momento.
 */
function authorizeMailScope() {
  Logger.log('=== ALFALLO — AUTORIZAR ENVÍO DE EMAILS ===');

  const me = Session.getActiveUser().getEmail();
  Logger.log('Cuenta ejecutando: ' + (me || '(no disponible)'));

  // getRemainingDailyQuota requiere el mismo scope — dispara el prompt si falta
  const quota = MailApp.getRemainingDailyQuota();
  Logger.log('Cuota restante hoy: ' + quota + ' emails');

  // Email de prueba al admin semilla (declarado en bootstrap.gs)
  const targetEmail = me || BOOTSTRAP_SUPER_ADMIN.email;

  MailApp.sendEmail({
    to: targetEmail,
    subject: '✓ Al Fallo — autorización de envío OK',
    body:
      'Si lees este correo, MailApp está autorizado correctamente.\n\n' +
      'Los emails de "olvidé mi contraseña" ya van a salir desde la Web App.\n\n' +
      '— Al Fallo · Equipo de administración',
    htmlBody: email_renderHtml_({
      title: 'Autorización de envío OK',
      greeting: 'Hola,',
      paragraphs: [
        'Si lees este correo, MailApp está autorizado correctamente.',
        'Los emails de password reset ya van a salir desde la Web App deployada.',
      ],
      cta: { label: 'Ir a Al Fallo', url: 'https://dyoma-web.github.io/alfallo/' },
      footnote: 'Email de prueba — puedes ignorarlo.',
    }),
    name: 'Al Fallo',
    noReply: true,
  });

  Logger.log('');
  Logger.log('✓ Email de prueba enviado a ' + targetEmail);
  Logger.log('  Revisa tu inbox (puede tardar 30s).');
  Logger.log('  Si no llega, revisa spam/promociones.');
  Logger.log('=== FIN ===');
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
// alerts.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * alerts.gs — Endpoints de alertas + generadores time-driven.
 */

// ──────────────────────────────────────────────────────────────────────────
// Listar alertas del usuario logueado
// ──────────────────────────────────────────────────────────────────────────

function alertsListMine(payload, ctx) {
  const onlyUnread = payload && payload.onlyUnread === true;
  const limit = payload && payload.limit ? vNumber(payload.limit, 'limit', { min: 1, max: 200, int: true }) : 50;

  const list = dbListAll('alertas', function (a) {
    if (a.user_id !== ctx.userId) return false;
    if (onlyUnread && (a.leida === true || a.leida === 'TRUE')) return false;
    if (a.expires_at_utc && new Date(a.expires_at_utc) < new Date()) return false;
    return true;
  });
  list.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return {
    items: list.slice(0, limit),
    totalUnread: list.filter(function (a) {
      return a.leida !== true && a.leida !== 'TRUE';
    }).length,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Marcar como leída
// ──────────────────────────────────────────────────────────────────────────

function alertsMarkRead(payload, ctx) {
  const alertId = vUuid(vRequired(payload.alertId, 'alertId'), 'alertId');
  const alert = dbFindById('alertas', alertId);
  if (!alert) throw _err('NOT_FOUND', 'Alerta no encontrada');
  if (alert.user_id !== ctx.userId) throw _err('FORBIDDEN', 'No es tu alerta');

  if (alert.leida !== true && alert.leida !== 'TRUE') {
    dbUpdateById('alertas', alertId, {
      leida: true,
      leida_at_utc: dbNowUtc(),
    });
  }
  return { ok: true };
}

function alertsMarkAllRead(_payload, ctx) {
  const list = dbListAll('alertas', function (a) {
    return a.user_id === ctx.userId && a.leida !== true && a.leida !== 'TRUE';
  });
  const now = dbNowUtc();
  for (let i = 0; i < list.length; i++) {
    dbUpdateById('alertas', list[i].id, { leida: true, leida_at_utc: now });
  }
  return { count: list.length };
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: crea una alerta (uso interno desde otros módulos)
// ──────────────────────────────────────────────────────────────────────────

function alerts_create_(opts) {
  return dbInsert('alertas', {
    id: cryptoUuid(),
    user_id: opts.userId,
    tipo: opts.tipo,
    severidad: opts.severidad || 'info',
    titulo: opts.titulo,
    descripcion: opts.descripcion || '',
    accion_url: opts.accionUrl || '',
    entidad_ref: opts.entidadRef || '',
    leida: false,
    leida_at_utc: '',
    created_at: dbNowUtc(),
    expires_at_utc: opts.expiresAtUtc || '',
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Triggers time-driven (configurar manualmente desde el editor)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Genera alertas de planes próximos a vencer (≤7 días).
 * Configurar trigger horario.
 */
function alertsGeneratePlanWarnings() {
  const now = new Date();
  const planes = dbListAll('planes_usuario', function (p) {
    return p.estado === 'active' && p.fecha_vencimiento_utc;
  });

  let created = 0;
  for (let i = 0; i < planes.length; i++) {
    const p = planes[i];
    const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - now) / 86400000);

    if (dias <= 0) {
      // Plan vencido — alerta una sola vez (la primera vez que se detecta)
      const ya = dbListAll('alertas', function (a) {
        return a.user_id === p.user_id && a.tipo === 'plan_vencido' && a.entidad_ref === p.id;
      });
      if (ya.length === 0) {
        alerts_create_({
          userId: p.user_id,
          tipo: 'plan_vencido',
          severidad: 'error',
          titulo: 'Tu plan ha vencido',
          descripcion: 'Tu plan venció el ' + new Date(p.fecha_vencimiento_utc).toLocaleDateString('es-CO'),
          accionUrl: '/mi-plan',
          entidadRef: p.id,
        });
        created++;
      }
    } else if (dias <= 7) {
      // Plan próximo a vencer
      const ya = dbListAll('alertas', function (a) {
        return a.user_id === p.user_id && a.tipo === 'plan_por_vencer' && a.entidad_ref === p.id
          && a.leida !== true && a.leida !== 'TRUE';
      });
      if (ya.length === 0) {
        alerts_create_({
          userId: p.user_id,
          tipo: 'plan_por_vencer',
          severidad: 'warn',
          titulo: 'Tu plan vence pronto',
          descripcion: 'En ' + dias + ' día' + (dias === 1 ? '' : 's') + '. Considera renovar.',
          accionUrl: '/mi-plan',
          entidadRef: p.id,
        });
        created++;
      }
    }
  }
  Logger.log('Alertas de planes generadas: ' + created);
  return created;
}

/**
 * Genera alertas de sesiones próximas (próximas 24h).
 * Configurar trigger horario.
 */
function alertsGenerateSessionReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600000);
  const sesiones = dbListAll('agendamientos', function (b) {
    if (!b.fecha_inicio_utc) return false;
    if (b.estado !== 'confirmado' && b.estado !== 'pactado') return false;
    const t = new Date(b.fecha_inicio_utc);
    return t > now && t <= in24h;
  });

  let created = 0;
  for (let i = 0; i < sesiones.length; i++) {
    const s = sesiones[i];
    const ya = dbListAll('alertas', function (a) {
      return a.user_id === s.user_id && a.tipo === 'sesion_24h' && a.entidad_ref === s.id;
    });
    if (ya.length > 0) continue;

    const fecha = new Date(s.fecha_inicio_utc);
    const horaTexto = fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
    });
    alerts_create_({
      userId: s.user_id,
      tipo: 'sesion_24h',
      severidad: 'info',
      titulo: 'Sesión próxima',
      descripcion: 'Tienes una sesión a las ' + horaTexto + '. ¡A entrenar!',
      accionUrl: '/calendario',
      entidadRef: s.id,
    });
    created++;
  }
  Logger.log('Recordatorios de sesión generados: ' + created);
  return created;
}


// ═══════════════════════════════════════════════════════════════════════
// options.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * options.gs — Endpoints que devuelven listas de opciones para formularios
 * (catálogos para el flujo de agendar).
 */

// ──────────────────────────────────────────────────────────────────────────
// getBookingOptions — retorna trainers + sedes + plan activo del usuario
// ──────────────────────────────────────────────────────────────────────────

function optionsGetBookingOptions(_payload, ctx) {
  const userId = ctx.userId;
  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  function sedeOption_(s, relation) {
    return {
      id: s.id,
      nombre: s.nombre,
      codigo: s.codigo_interno,
      ciudad: s.ciudad,
      direccion: s.direccion,
      category: s.categoria_sede || '',
      categoryRank: Number(s.categoria_rank) || 0,
      isBase: relation ? (relation.principal === true || relation.principal === 'TRUE') : false,
    };
  }

  // 1. Entrenadores disponibles para el usuario
  // MVP: el entrenador asignado (si existe) + (futuro) cualquier otro activo
  const trainers = [];
  if (user.entrenador_asignado_id) {
    const t = dbFindById('usuarios', user.entrenador_asignado_id);
    if (t && t.rol === 'trainer' && t.estado === 'active') {
      const profile = dbFindById('entrenadores_perfil', t.id);
      trainers.push({
        id: t.id,
        nombres: t.nombres,
        apellidos: t.apellidos,
        nick: t.nick,
        foto_url: t.foto_url,
        perfilProfesional: profile ? profile.perfil_profesional : '',
        habilidades: profile ? String(profile.habilidades || '').split(',').filter(Boolean) : [],
        tiposEntrenamiento: profile ? String(profile.tipos_entrenamiento || '').split(',').filter(Boolean) : [],
        visibilidadDefault: profile ? profile.visibilidad_default : 'solo_franjas',
        cuposEstrictos: profile ? Boolean(profile.cupos_estrictos) : true,
      });
    }
  }

  // 2. Sedes disponibles
  // MVP: las sedes asignadas al usuario; si no tiene, todas las activas
  let sedes = [];
  const userSedes = dbListAll('sedes_usuarios', function (su) {
    return su.user_id === userId;
  });
  if (userSedes.length > 0) {
    for (let i = 0; i < userSedes.length; i++) {
      const s = dbFindById('sedes', userSedes[i].sede_id);
      if (s && s.estado === 'active') {
        sedes.push(sedeOption_(s, userSedes[i]));
      }
    }
  } else {
    sedes = dbListAll('sedes', function (s) { return s.estado === 'active'; })
      .map(function (s) {
        return sedeOption_(s, null);
      });
  }

  // 3. Plan activo del usuario
  const planesActivos = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId && p.estado === 'active';
  });
  let planActivo = null;
  if (planesActivos.length > 0) {
    planesActivos.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    const p = planesActivos[0];
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    planActivo = {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
    };
  }

  return {
    trainers: trainers,
    sedes: sedes,
    planActivo: planActivo,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// getTrainerBusySlots — para el date picker, mostrar conflictos del trainer
// ──────────────────────────────────────────────────────────────────────────

function optionsGetTrainerBusySlots(payload, _ctx) {
  const trainerId = vUuid(vRequired(payload.trainerId, 'trainerId'), 'trainerId');
  const fromUtc = vIsoDate(vRequired(payload.fromUtc, 'fromUtc'), 'fromUtc');
  const toUtc = vIsoDate(vRequired(payload.toUtc, 'toUtc'), 'toUtc');

  const fromTs = new Date(fromUtc).getTime();
  const toTs = new Date(toUtc).getTime();
  const activeStates = ['solicitado', 'confirmado', 'pactado'];

  const busy = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (activeStates.indexOf(String(b.estado)) === -1) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    return t >= fromTs && t <= toTs;
  });

  return {
    busy: busy.map(function (b) {
      return {
        fechaInicioUtc: b.fecha_inicio_utc,
        duracionMin: Number(b.duracion_min) || 60,
        tipo: b.tipo,
      };
    }),
  };
}


// ═══════════════════════════════════════════════════════════════════════
// dashboard.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * dashboard.gs — Endpoints de lectura para los dashboards.
 *
 * Por ahora cubre dashboard del cliente (Iter 5). Trainer y Admin en Iter 6/7.
 */

// ──────────────────────────────────────────────────────────────────────────
// Dashboard del usuario (cliente)
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetUser(_payload, ctx) {
  const userId = ctx.userId;
  const nowDate = new Date();

  // 1. Próximo entrenamiento (futuro, no cancelado)
  const futurosEstados = ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'];
  const futuros = dbListAll('agendamientos', function (b) {
    return b.user_id === userId
      && futurosEstados.indexOf(String(b.estado)) !== -1
      && b.fecha_inicio_utc
      && new Date(b.fecha_inicio_utc) > nowDate;
  });
  futuros.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });
  const next = futuros[0] || null;

  let proximoEntrenamiento = null;
  if (next) {
    const t = next.entrenador_id ? dbFindById('usuarios', next.entrenador_id) : null;
    const s = next.sede_id ? dbFindById('sedes', next.sede_id) : null;
    proximoEntrenamiento = {
      id: next.id,
      fechaInicioUtc: next.fecha_inicio_utc,
      duracionMin: Number(next.duracion_min) || 60,
      tipo: next.tipo,
      estado: next.estado,
      entrenador: t ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick } : null,
      sede: s ? { id: s.id, nombre: s.nombre, ciudad: s.ciudad } : null,
    };
  }

  // 2. Plan activo
  const planesActivos = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId && p.estado === 'active';
  });
  let planActivo = null;
  if (planesActivos.length > 0) {
    planesActivos.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    const p = planesActivos[0];
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    const restantes = Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas));
    const diasRestantes = Math.ceil(
      (new Date(p.fecha_vencimiento_utc).getTime() - nowDate.getTime()) / 86400000
    );
    let estadoVisual = 'plan-activo';
    if (diasRestantes < 0) estadoVisual = 'plan-vencido';
    else if (diasRestantes <= 7) estadoVisual = 'plan-vence';
    planActivo = {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesRestantes: restantes,
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      diasRestantes: diasRestantes,
      estadoVisual: estadoVisual,
    };
  }

  // 3. Racha de asistencia (sesiones completadas consecutivas, hacia atrás)
  const completadas = dbListAll('agendamientos', function (b) {
    return b.user_id === userId && b.estado === 'completado';
  });
  completadas.sort(function (a, b) {
    return new Date(b.fecha_inicio_utc) - new Date(a.fecha_inicio_utc);
  });
  let racha = 0;
  for (let i = 0; i < completadas.length; i++) {
    const asist = dbFindBy('asistencia', 'agendamiento_id', completadas[i].id);
    if (asist && (asist.presente === true || asist.presente === 'TRUE')) {
      racha++;
    } else if (asist && asist.presente === false) {
      break;
    } else {
      // Sin registro de asistencia — asumimos completada cuenta para racha
      racha++;
    }
  }

  // 4. Alertas no leídas (top 5)
  const alertas = dbListAll('alertas', function (a) {
    return a.user_id === userId && a.leida !== true && a.leida !== 'TRUE';
  });
  alertas.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return {
    proximoEntrenamiento: proximoEntrenamiento,
    planActivo: planActivo,
    racha: racha,
    sesionesCompletadas: completadas.length,
    alertasNoLeidas: alertas.length,
    alertas: alertas.slice(0, 5),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Mi plan (detalle + historial)
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetMyPlan(_payload, ctx) {
  const userId = ctx.userId;
  const planes = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId;
  });
  planes.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const enriquecidos = planes.map(function (p) {
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    const t = p.entrenador_id ? dbFindById('usuarios', p.entrenador_id) : null;
    return {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      descripcion: cat ? cat.descripcion : '',
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaCompraUtc: p.fecha_compra_utc,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      precio: Number(p.precio_pagado),
      moneda: p.moneda,
      estado: p.estado,
      entrenador: t ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick } : null,
      notas: p.notas,
    };
  });

  return {
    activo: enriquecidos.find(function (p) { return p.estado === 'active'; }) || null,
    historial: enriquecidos,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Perfil — el usuario logueado consulta o actualiza sus datos
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetProfile(_payload, ctx) {
  const user = dbFindById('usuarios', ctx.userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  return auth_publicUserShape_(user);
}

function dashboardUpdateProfile(payload, ctx) {
  const allowed = ['nombres', 'apellidos', 'nick', 'celular',
                   'preferencias_notif', 'privacidad_fotos'];
  const patch = {};
  for (let i = 0; i < allowed.length; i++) {
    const k = allowed[i];
    if (k in payload) {
      if (k === 'preferencias_notif' && typeof payload[k] === 'object') {
        patch[k] = payload[k];
      } else if (k === 'nick') {
        patch[k] = vString(payload[k], 'nick', { min: 2, max: 30 });
      } else if (k === 'nombres' || k === 'apellidos') {
        patch[k] = vString(payload[k], k, { min: 1, max: 80 });
      } else if (k === 'celular') {
        patch[k] = vString(payload[k], 'celular', { max: 20 });
      } else if (k === 'privacidad_fotos') {
        patch[k] = vEnum(payload[k], 'privacidad_fotos',
          ['solo_yo', 'mi_entrenador', 'mi_grupo', 'publico']);
      }
    }
  }
  patch.updated_at = dbNowUtc();
  const before = dbFindById('usuarios', ctx.userId);
  const updated = dbUpdateById('usuarios', ctx.userId, patch);

  auditOk(ctx.userId, 'update_profile', 'usuario', ctx.userId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);

  return auth_publicUserShape_(updated);
}


// ═══════════════════════════════════════════════════════════════════════
// bookings.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * bookings.gs — Patrón booking-ID con LockService para evitar doble
 * agendamiento concurrente.
 *
 * Documento de respaldo: docs/01-arquitectura.md §4
 *
 * Flujo:
 *   1. Frontend entra a "Agendar" → createDraftBooking() crea fila estado=borrador
 *   2. Usuario completa formulario → submitBooking() actualiza la fila bajo lock
 *   3. Trigger horario marca borradores expirados (>10 min)
 *   4. cancelBooking() solo aplica a estados no-finales
 */

// ──────────────────────────────────────────────────────────────────────────
// Crear borrador — al entrar a la pantalla de agendar
// ──────────────────────────────────────────────────────────────────────────

function bookingsCreateDraft(_payload, ctx) {
  const userId = ctx.userId;
  const now = dbNowUtc();

  // Limpiar borradores antiguos del mismo user antes de crear uno nuevo
  bookings_expireOldDrafts_(userId, now);

  const id = cryptoUuid();
  dbInsert('agendamientos', {
    id: id,
    user_id: userId,
    entrenador_id: '',
    sede_id: '',
    plan_usuario_id: '',
    grupo_id: '',
    tipo: '',
    fecha_inicio_utc: '',
    duracion_min: '',
    capacidad_max: '',
    estado: 'borrador',
    color: '',
    visibilidad_nombres: false,
    motivo_cancelacion: '',
    cancelado_por: '',
    cancelado_at_utc: '',
    dentro_margen: '',
    requiere_autorizacion: false,
    autorizado_por: '',
    autorizado_at_utc: '',
    notas_entrenador: '',
    notas_usuario: '',
    created_at: now,
    updated_at: now,
    created_by: userId,
  });

  return { bookingId: id };
}

// ──────────────────────────────────────────────────────────────────────────
// Submit — completa los datos del booking bajo LockService
// ──────────────────────────────────────────────────────────────────────────

function bookingsSubmit(payload, ctx) {
  const bookingId = vUuid(vRequired(payload.bookingId, 'bookingId'), 'bookingId');
  const trainerId = vUuid(vRequired(payload.entrenadorId, 'entrenadorId'), 'entrenadorId');
  const fechaInicio = vIsoDate(vRequired(payload.fechaInicioUtc, 'fechaInicioUtc'), 'fechaInicioUtc');
  const tipo = vEnum(payload.tipo || 'personalizado', 'tipo',
    ['personalizado', 'semipersonalizado', 'grupal']);
  const sedeId = payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '';
  const planUsuarioId = payload.planUsuarioId ? vUuid(payload.planUsuarioId, 'planUsuarioId') : '';
  const duracionMin = payload.duracionMin ? vNumber(payload.duracionMin, 'duracionMin', { min: 15, max: 240, int: true }) : 60;
  const notas = payload.notas ? vString(payload.notas, 'notas', { max: 500 }) : '';

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw _bookingErr_('SLOT_BUSY', 'El sistema está ocupado. Intenta en unos segundos.');
  }

  try {
    const draft = dbFindById('agendamientos', bookingId);
    if (!draft || draft.user_id !== ctx.userId) {
      throw _bookingErr_('NOT_FOUND', 'Agendamiento no encontrado');
    }
    if (draft.estado !== 'borrador') {
      throw _bookingErr_('INVALID_STATE', 'Este borrador ya no se puede completar');
    }

    // Verificar que el trainer existe y está activo
    const trainer = dbFindById('usuarios', trainerId);
    if (!trainer || trainer.rol !== 'trainer' || trainer.estado !== 'active') {
      throw _bookingErr_('TRAINER_NOT_AVAILABLE', 'El entrenador no está disponible');
    }

    // Cargar perfil del trainer (para visibilidad)
    const trainerProfile = dbFindById('entrenadores_perfil', trainerId);
    const workWindow = bookings_checkWorkingWindow_(trainerProfile, fechaInicio, duracionMin);
    if (!workWindow.allowed) {
      throw _bookingErr_('TRAINER_OUTSIDE_WORK_HOURS',
        'El profesional no atiende en esa franja horaria');
    }

    // Resolver el plan_catalogo del booking (para leer caps definidos en el plan)
    let planCatalogo = null;
    if (planUsuarioId) {
      const planUsr = dbFindById('planes_usuario', planUsuarioId);
      if (planUsr && planUsr.plan_catalogo_id) {
        planCatalogo = dbFindById('planes_catalogo', planUsr.plan_catalogo_id);
      }
    }

    // Cap de cupos por tipo de plan en la franja horaria
    const sameSlotBookings = dbListAll('agendamientos', function (b) {
      if (b.entrenador_id !== trainerId) return false;
      if (b.tipo !== tipo) return false;
      if (['solicitado', 'confirmado', 'pactado'].indexOf(String(b.estado)) === -1) return false;
      return bookings_overlaps_(b.fecha_inicio_utc, Number(b.duracion_min) || 60, fechaInicio, duracionMin);
    });

    const cap = bookings_getCap_(planCatalogo, tipo);
    const stricts = bookings_getCapStrict_(planCatalogo, tipo);
    const cupoLleno = sameSlotBookings.length >= cap;

    let requireAuth = false;
    let motivoAuth = '';

    if (cupoLleno) {
      // Personalizado siempre es estricto (cap = 1, no admite más).
      // Para semi/grupal: si cuposEstrictos=true → SLOT_FULL; si false → permite con flag.
      if (tipo === 'personalizado' || stricts) {
        throw _bookingErr_('SLOT_FULL', tipo === 'personalizado'
          ? 'Ese horario ya no está disponible'
          : 'El cupo de este tipo de sesión está lleno en esa franja');
      }
      requireAuth = true;
      motivoAuth = 'cupo_lleno';
    }

    // Iter 12: verificar si el trainer marcó esa franja como no-disponible
    const unavailRule = availability_checkConflict_(trainerId, fechaInicio, duracionMin);
    if (unavailRule) {
      throw _bookingErr_('TRAINER_UNAVAILABLE',
        'El entrenador marcó esa franja como no-disponible: "' + unavailRule.titulo + '"');
    }

    const sedeBlock = sedeBlocks_checkConflict_(sedeId, fechaInicio, duracionMin);
    if (sedeBlock) {
      throw _bookingErr_('SEDE_BLOCKED',
        'La sede está bloqueada en esa franja: "' + sedeBlock.motivo + '"');
    }

    // Plan: ¿activo y vigente para esa fecha?
    let usePlanId = '';
    if (planUsuarioId) {
      const plan = dbFindById('planes_usuario', planUsuarioId);
      if (!plan || plan.user_id !== ctx.userId) {
        throw _bookingErr_('PLAN_INVALID', 'Plan inválido');
      }
      if (plan.estado !== 'active') {
        requireAuth = true;
        if (!motivoAuth) motivoAuth = 'plan_vencido';
      } else if (new Date(fechaInicio) > new Date(plan.fecha_vencimiento_utc)) {
        requireAuth = true;
        if (!motivoAuth) motivoAuth = 'plan_vencido';
      } else if (Number(plan.sesiones_consumidas) >= Number(plan.sesiones_totales)) {
        requireAuth = true;
        if (!motivoAuth) motivoAuth = 'plan_agotado';
      }
      usePlanId = plan.id;
    } else {
      // Sin plan, requiere autorización del entrenador
      requireAuth = true;
      if (!motivoAuth) motivoAuth = 'sin_plan';
    }

    // Snapshot de visibilidad del entrenador al momento de creación
    const visibilityNames = trainerProfile
      ? trainerProfile.visibilidad_default === 'nombres_visibles'
      : false;

    const now = dbNowUtc();
    const before = JSON.stringify({ estado: draft.estado });
    const updated = dbUpdateById('agendamientos', bookingId, {
      entrenador_id: trainerId,
      sede_id: sedeId,
      plan_usuario_id: usePlanId,
      tipo: tipo,
      fecha_inicio_utc: fechaInicio,
      duracion_min: duracionMin,
      estado: requireAuth ? 'requiere_autorizacion' : 'solicitado',
      visibilidad_nombres: visibilityNames,
      requiere_autorizacion: requireAuth,
      motivo_autorizacion: motivoAuth,
      notas_usuario: notas,
      updated_at: now,
    });

    auditOk(ctx.userId, 'create_booking', 'agendamiento', bookingId,
      before, JSON.stringify({ estado: updated.estado }), ctx.reqMeta);

    // Alerta al entrenador
    if (trainer && trainer.id) {
      alerts_create_({
        userId: trainer.id,
        tipo: 'solicitud_pendiente',
        severidad: 'info',
        titulo: 'Nueva solicitud de sesión',
        descripcion: 'Para el ' + new Date(fechaInicio).toLocaleDateString('es-CO',
          { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Bogota' }),
        accionUrl: '/calendario',
        entidadRef: bookingId,
      });
    }

    return { booking: updated };
  } finally {
    lock.releaseLock();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Confirmar — solo el entrenador asignado o admin
// ──────────────────────────────────────────────────────────────────────────

function bookingsConfirm(payload, ctx) {
  const bookingId = vUuid(vRequired(payload.bookingId, 'bookingId'), 'bookingId');
  const booking = dbFindById('agendamientos', bookingId);
  if (!booking) throw _bookingErr_('NOT_FOUND', 'Agendamiento no encontrado');

  if (booking.entrenador_id !== ctx.userId
      && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo el entrenador asignado puede confirmar');
  }

  if (['solicitado', 'requiere_autorizacion'].indexOf(String(booking.estado)) === -1) {
    throw _bookingErr_('INVALID_STATE', 'Solo se confirman agendamientos solicitados');
  }

  // Si es próxima (≤24h), pasa a pactado; si no, confirmado.
  const horasParaInicio =
    (new Date(booking.fecha_inicio_utc).getTime() - Date.now()) / 3600000;
  const newState = horasParaInicio <= 24 ? 'pactado' : 'confirmado';

  const now = dbNowUtc();
  const before = JSON.stringify({ estado: booking.estado });
  const updated = dbUpdateById('agendamientos', bookingId, {
    estado: newState,
    autorizado_por: booking.requiere_autorizacion ? ctx.userId : '',
    autorizado_at_utc: booking.requiere_autorizacion ? now : '',
    updated_at: now,
  });

  // Alerta al cliente
  const fecha = new Date(booking.fecha_inicio_utc);
  alerts_create_({
    userId: booking.user_id,
    tipo: 'sesion_confirmada',
    severidad: 'info',
    titulo: 'Tu sesión fue confirmada',
    descripcion: 'Sesión del ' + fecha.toLocaleDateString('es-CO',
      { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Bogota' }),
    accionUrl: '/calendario',
    entidadRef: bookingId,
  });

  auditOk(ctx.userId, 'confirm_booking', 'agendamiento', bookingId,
    before, JSON.stringify({ estado: newState }), ctx.reqMeta);

  return { booking: updated };
}

// ──────────────────────────────────────────────────────────────────────────
// Rechazar
// ──────────────────────────────────────────────────────────────────────────

function bookingsReject(payload, ctx) {
  const bookingId = vUuid(vRequired(payload.bookingId, 'bookingId'), 'bookingId');
  const motivo = payload.motivo ? vString(payload.motivo, 'motivo', { max: 500 }) : '';

  const booking = dbFindById('agendamientos', bookingId);
  if (!booking) throw _bookingErr_('NOT_FOUND', 'Agendamiento no encontrado');

  if (booking.entrenador_id !== ctx.userId
      && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo el entrenador asignado puede rechazar');
  }

  if (['solicitado', 'requiere_autorizacion'].indexOf(String(booking.estado)) === -1) {
    throw _bookingErr_('INVALID_STATE', 'Solo se rechazan solicitados');
  }

  const now = dbNowUtc();
  const before = JSON.stringify({ estado: booking.estado });
  const updated = dbUpdateById('agendamientos', bookingId, {
    estado: 'rechazado',
    motivo_cancelacion: motivo,
    cancelado_por: ctx.userId,
    cancelado_at_utc: now,
    updated_at: now,
  });

  alerts_create_({
    userId: booking.user_id,
    tipo: 'sesion_rechazada',
    severidad: 'warn',
    titulo: 'Tu sesión fue rechazada',
    descripcion: motivo
      ? 'Motivo: ' + motivo
      : 'Tu entrenador rechazó la solicitud. Puedes pedir más info o agendar otra fecha.',
    accionUrl: '/calendario',
    entidadRef: bookingId,
  });

  auditOk(ctx.userId, 'reject_booking', 'agendamiento', bookingId,
    before, JSON.stringify({ estado: 'rechazado' }), ctx.reqMeta);

  return { booking: updated };
}

// ──────────────────────────────────────────────────────────────────────────
// Registrar asistencia — pasa a completado/no-asistido y consume plan
// ──────────────────────────────────────────────────────────────────────────

function bookingsRegisterAttendance(payload, ctx) {
  const bookingId = vUuid(vRequired(payload.bookingId, 'bookingId'), 'bookingId');
  const presente = vBool(vRequired(payload.presente, 'presente'), 'presente');

  const booking = dbFindById('agendamientos', bookingId);
  if (!booking) throw _bookingErr_('NOT_FOUND', 'Agendamiento no encontrado');

  if (booking.entrenador_id !== ctx.userId
      && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'No puedes registrar asistencia en esta sesión');
  }

  if (['confirmado', 'pactado'].indexOf(String(booking.estado)) === -1) {
    throw _bookingErr_('INVALID_STATE', 'Solo se registra asistencia en confirmadas/pactadas');
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw _bookingErr_('SLOT_BUSY', 'Sistema ocupado. Reintenta.');
  }

  try {
    const now = dbNowUtc();
    const newState = presente ? 'completado' : 'no-asistido';

    // Asistencia: crear o actualizar (1:1 con booking)
    const existing = dbFindBy('asistencia', 'agendamiento_id', bookingId);
    const asistData = {
      agendamiento_id: bookingId,
      user_id: booking.user_id,
      entrenador_id: booking.entrenador_id,
      presente: presente,
      llegada_utc: payload.llegadaUtc || (presente ? now : ''),
      salida_utc: payload.salidaUtc || '',
      peso: payload.peso != null ? payload.peso : '',
      frec_card_max: payload.frecCardMax != null ? payload.frecCardMax : '',
      frec_card_prom: payload.frecCardProm != null ? payload.frecCardProm : '',
      saturacion: payload.saturacion != null ? payload.saturacion : '',
      presion_sis: payload.presionSis != null ? payload.presionSis : '',
      presion_dia: payload.presionDia != null ? payload.presionDia : '',
      dolor: payload.dolor != null ? payload.dolor : '',
      energia: payload.energia != null ? payload.energia : '',
      observaciones: payload.observaciones || '',
    };

    if (existing) {
      dbUpdateById('asistencia', existing.id, asistData);
    } else {
      dbInsert('asistencia', Object.assign({
        id: cryptoUuid(),
        created_at: now,
        created_by: ctx.userId,
      }, asistData));
    }

    // Estado del agendamiento
    dbUpdateById('agendamientos', bookingId, {
      estado: newState,
      updated_at: now,
    });

    // Si presente y hay plan, consume sesiones del plan según duración.
    // 1 sesión por cada hora (o fracción) de duración. 60min=1, 90min=2, 120min=2.
    if (presente && booking.plan_usuario_id) {
      const plan = dbFindById('planes_usuario', booking.plan_usuario_id);
      if (plan) {
        const duracion = Number(booking.duracion_min) || 60;
        const sesionesGastadas = Math.max(1, Math.ceil(duracion / 60));
        dbUpdateById('planes_usuario', plan.id, {
          sesiones_consumidas: Number(plan.sesiones_consumidas) + sesionesGastadas,
          updated_at: now,
        });
      }
    }

    auditOk(ctx.userId, 'register_attendance', 'agendamiento', bookingId,
      '', JSON.stringify({ presente: presente, newState: newState }), ctx.reqMeta);

    return { ok: true, presente: presente, estado: newState };
  } finally {
    lock.releaseLock();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Cancelar
// ──────────────────────────────────────────────────────────────────────────

function bookingsCancel(payload, ctx) {
  const bookingId = vUuid(vRequired(payload.bookingId, 'bookingId'), 'bookingId');
  const motivo = payload.motivo ? vString(payload.motivo, 'motivo', { max: 500 }) : '';

  const booking = dbFindById('agendamientos', bookingId);
  if (!booking) throw _bookingErr_('NOT_FOUND', 'Agendamiento no encontrado');

  // Permisos: dueño del booking, entrenador asignado, o admin
  const canCancel = (
    booking.user_id === ctx.userId ||
    booking.entrenador_id === ctx.userId ||
    ctx.role === 'admin' ||
    ctx.role === 'super_admin'
  );
  if (!canCancel) throw _bookingErr_('FORBIDDEN', 'No puedes cancelar este agendamiento');

  const finalStates = ['cancelado', 'completado', 'no-asistido', 'rechazado', 'expirado'];
  if (finalStates.indexOf(String(booking.estado)) !== -1) {
    throw _bookingErr_('INVALID_STATE', 'Este agendamiento ya está finalizado');
  }
  if (booking.estado === 'borrador') {
    // Borradores se pueden "cancelar" silenciosamente → expirado
    dbUpdateById('agendamientos', bookingId, {
      estado: 'expirado',
      updated_at: dbNowUtc(),
    });
    return { booking: { id: bookingId, estado: 'expirado' } };
  }

  // Calcular si está dentro o fuera del margen de la política aplicable
  const policy = bookings_getApplicablePolicy_(booking);
  const ventanaHoras = policy ? Number(policy.ventana_horas) : 12;
  const horasParaInicio = (new Date(booking.fecha_inicio_utc).getTime() - Date.now()) / 3600000;
  const dentroMargen = horasParaInicio >= ventanaHoras;

  const now = dbNowUtc();
  const before = JSON.stringify({ estado: booking.estado });
  const updated = dbUpdateById('agendamientos', bookingId, {
    estado: 'cancelado',
    motivo_cancelacion: motivo,
    cancelado_por: ctx.userId,
    cancelado_at_utc: now,
    dentro_margen: dentroMargen,
    updated_at: now,
  });

  auditOk(ctx.userId, 'cancel_booking', 'agendamiento', bookingId,
    before, JSON.stringify({ estado: 'cancelado', dentroMargen: dentroMargen }), ctx.reqMeta);

  return {
    booking: updated,
    dentroMargen: dentroMargen,
    politicaAplicada: policy ? { nombre: policy.nombre, ventanaHoras: ventanaHoras } : null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Listar bookings del usuario en un rango (para calendario)
// ──────────────────────────────────────────────────────────────────────────

function bookingsListMine(payload, ctx) {
  const fromUtc = payload.fromUtc ? vIsoDate(payload.fromUtc, 'fromUtc') : null;
  const toUtc = payload.toUtc ? vIsoDate(payload.toUtc, 'toUtc') : null;
  const includeStates = Array.isArray(payload.includeStates)
    ? payload.includeStates
    : ['solicitado', 'confirmado', 'pactado', 'completado', 'cancelado',
       'no-asistido', 'requiere_autorizacion', 'rechazado'];

  const userId = ctx.userId;
  const isTrainer = ctx.role === 'trainer';
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const fromTs = fromUtc ? new Date(fromUtc).getTime() : 0;
  const toTs = toUtc ? new Date(toUtc).getTime() : Number.MAX_SAFE_INTEGER;

  // Filtros adicionales que solo el admin puede usar (para vista de calendario global).
  const filterTrainerId = isAdmin && payload.filterTrainerId
    ? String(payload.filterTrainerId) : null;
  const filterUserId = isAdmin && payload.filterUserId
    ? String(payload.filterUserId) : null;
  const filterSedeId = payload.filterSedeId ? String(payload.filterSedeId) : null;

  const bookings = dbListAll('agendamientos', function (b) {
    // Filtro por rol:
    //   client → sus bookings (b.user_id === userId)
    //   trainer → bookings donde es entrenador (b.entrenador_id === userId)
    //   admin → todos
    if (!isAdmin) {
      const matchesUser = b.user_id === userId;
      const matchesTrainer = isTrainer && b.entrenador_id === userId;
      if (!matchesUser && !matchesTrainer) return false;
    }
    if (includeStates.indexOf(String(b.estado)) === -1) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    if (t < fromTs || t > toTs) return false;
    // Filtros admin
    if (filterTrainerId && b.entrenador_id !== filterTrainerId) return false;
    if (filterUserId && b.user_id !== filterUserId) return false;
    if (filterSedeId && b.sede_id !== filterSedeId) return false;
    return true;
  });

  bookings.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Enriquecer con datos del entrenador, sede y cliente
  const userCache = {};
  const sedeCache = {};
  const gymCache = {};

  function lookupUser(id) {
    if (!id) return null;
    if (!(id in userCache)) {
      const u = dbFindById('usuarios', id);
      userCache[id] = u
        ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick }
        : null;
    }
    return userCache[id];
  }
  function lookupSede(id) {
    if (!id) return null;
    if (!(id in sedeCache)) {
      const s = dbFindById('sedes', id);
      let gym = null;
      if (s && s.gimnasio_id) {
        if (!(s.gimnasio_id in gymCache)) {
          const g = dbFindById('gimnasios', s.gimnasio_id);
          gymCache[s.gimnasio_id] = g ? { id: g.id, nombre: g.nombre } : null;
        }
        gym = gymCache[s.gimnasio_id];
      }
      sedeCache[id] = s ? {
        id: s.id,
        nombre: s.nombre,
        ciudad: s.ciudad,
        gimnasio_id: s.gimnasio_id || '',
        gimnasio: gym,
        category: s.categoria_sede || '',
        categoryRank: Number(s.categoria_rank) || 0,
      } : null;
    }
    return sedeCache[id];
  }

  // Lookup de plan_usuario para mostrar progreso de sesiones
  const planCache = {};
  function lookupPlan(id) {
    if (!id) return null;
    if (!(id in planCache)) {
      const p = dbFindById('planes_usuario', id);
      planCache[id] = p ? {
        id: p.id,
        sesionesTotales: Number(p.sesiones_totales),
        sesionesConsumidas: Number(p.sesiones_consumidas),
      } : null;
    }
    return planCache[id];
  }

  // Iter 13: enriquecer cada booking con los grupos del cliente para
  // colorear en calendario.
  const userGroupsCache = {};
  function lookupUserGroups(userId) {
    if (!userId) return [];
    if (userId in userGroupsCache) return userGroupsCache[userId];
    userGroupsCache[userId] = grupos_getUserGroups_(userId);
    return userGroupsCache[userId];
  }

  return bookings.map(function (b) {
    return Object.assign({}, b, {
      entrenador: lookupUser(b.entrenador_id),
      cliente: lookupUser(b.user_id),
      sede: lookupSede(b.sede_id),
      plan: lookupPlan(b.plan_usuario_id),
      userGroups: lookupUserGroups(b.user_id),
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Trigger time-driven — limpieza de borradores expirados
// (Configurar manualmente desde el editor: cada 10 min)
// ──────────────────────────────────────────────────────────────────────────

function bookingsExpireOldDrafts() {
  const now = dbNowUtc();
  const ttlMin = bookings_getDraftTtl_();
  const cutoff = dbAddMinutes(now, -ttlMin);

  const drafts = dbListAll('agendamientos', function (b) {
    return b.estado === 'borrador' && b.created_at < cutoff;
  });

  for (let i = 0; i < drafts.length; i++) {
    dbUpdateById('agendamientos', drafts[i].id, {
      estado: 'expirado',
      updated_at: now,
    });
  }
  Logger.log('Borradores expirados: ' + drafts.length);
  return drafts.length;
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function bookings_expireOldDrafts_(userId, now) {
  const ttlMin = bookings_getDraftTtl_();
  const cutoff = dbAddMinutes(now, -ttlMin);
  const drafts = dbListAll('agendamientos', function (b) {
    return b.user_id === userId && b.estado === 'borrador' && b.created_at < cutoff;
  });
  for (let i = 0; i < drafts.length; i++) {
    dbUpdateById('agendamientos', drafts[i].id, { estado: 'expirado', updated_at: now });
  }
}

function bookings_overlaps_(aStart, aDur, bStart, bDur) {
  const aS = new Date(aStart).getTime();
  const aE = aS + (Number(aDur) || 60) * 60000;
  const bS = new Date(bStart).getTime();
  const bE = bS + (Number(bDur) || 60) * 60000;
  return aS < bE && bS < aE;
}

function bookings_checkWorkingWindow_(trainerProfile, fechaInicioUtc, durationMin) {
  if (!trainerProfile || !trainerProfile.franja_trabajo) {
    return { allowed: true };
  }

  const franja = trainerProfile.franja_trabajo;
  if (typeof franja !== 'object') return { allowed: true };
  if (Object.keys(franja).length === 0) return { allowed: true };

  const start = new Date(fechaInicioUtc);
  const end = new Date(start.getTime() + (Number(durationMin) || 60) * 60000);
  const tz = 'America/Bogota';
  const dow = Number(Utilities.formatDate(start, tz, 'u')); // 1=lun ... 7=dom
  const dayKeys = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
  const dayKey = dayKeys[dow - 1] || '';
  const ranges = franja[dayKey] || franja[String(dow)] || franja[String(dow % 7)];
  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
    return { allowed: false };
  }

  const startMin = bookings_minutesInTz_(start, tz);
  const endMin = bookings_minutesInTz_(end, tz);
  for (let i = 0; i < ranges.length; i++) {
    const parts = String(ranges[i] || '').split('-');
    if (parts.length !== 2) continue;
    const from = bookings_timeToMinutes_(parts[0]);
    const to = bookings_timeToMinutes_(parts[1]);
    if (from == null || to == null) continue;
    if (startMin >= from && endMin <= to) {
      return { allowed: true };
    }
  }

  return { allowed: false };
}

function bookings_minutesInTz_(date, tz) {
  const hh = Number(Utilities.formatDate(date, tz, 'HH'));
  const mm = Number(Utilities.formatDate(date, tz, 'mm'));
  return hh * 60 + mm;
}

function bookings_timeToMinutes_(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function bookings_getDraftTtl_() {
  const cfg = dbFindById('config', 'app.draft_booking_ttl_minutes');
  return cfg ? Number(cfg.value) : 10;
}

/**
 * Cap por tipo de plan en una franja, leído del perfil del entrenador.
 * Defaults razonables si no está configurado.
 */
function bookings_getCap_(trainerProfile, tipo) {
  if (tipo === 'personalizado') {
    if (trainerProfile && trainerProfile.cupos_personalizado) {
      return Math.max(1, Number(trainerProfile.cupos_personalizado));
    }
    return 1;
  }
  if (tipo === 'semipersonalizado') {
    if (trainerProfile && trainerProfile.cupos_semipersonalizado) {
      return Math.max(1, Number(trainerProfile.cupos_semipersonalizado));
    }
    return 5;
  }
  if (tipo === 'grupal') {
    if (trainerProfile && trainerProfile.cupos_grupal) {
      return Math.max(1, Number(trainerProfile.cupos_grupal));
    }
    return 15;
  }
  return 1;
}

/**
 * Devuelve el estado de cupo para una franja específica.
 * Usado por el frontend para mostrar warning antes de submit.
 */
function bookingsGetSlotCapacity(payload, _ctx) {
  const trainerId = vUuid(vRequired(payload.trainerId, 'trainerId'), 'trainerId');
  const fechaInicio = vIsoDate(vRequired(payload.fechaInicioUtc, 'fechaInicioUtc'), 'fechaInicioUtc');
  const tipo = vEnum(payload.tipo || 'personalizado', 'tipo',
    ['personalizado', 'semipersonalizado', 'grupal']);
  const duracionMin = payload.duracionMin
    ? vNumber(payload.duracionMin, 'duracionMin', { min: 15, max: 240, int: true })
    : 60;
  const sedeId = payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '';

  // Resolver plan_catalogo si el frontend lo pasó
  let planCatalogo = null;
  if (payload.planUsuarioId) {
    const planUsr = dbFindById('planes_usuario', payload.planUsuarioId);
    if (planUsr && planUsr.plan_catalogo_id) {
      planCatalogo = dbFindById('planes_catalogo', planUsr.plan_catalogo_id);
    }
  } else if (payload.planCatalogoId) {
    planCatalogo = dbFindById('planes_catalogo', payload.planCatalogoId);
  }

  const cap = bookings_getCap_(planCatalogo, tipo);
  const stricts = bookings_getCapStrict_(planCatalogo, tipo);
  const trainerProfile = dbFindById('entrenadores_perfil', trainerId);
  const workWindow = bookings_checkWorkingWindow_(trainerProfile, fechaInicio, duracionMin);
  const unavailRule = availability_checkConflict_(trainerId, fechaInicio, duracionMin);

  const sameSlot = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (b.tipo !== tipo) return false;
    if (['solicitado', 'confirmado', 'pactado'].indexOf(String(b.estado)) === -1) return false;
    return bookings_overlaps_(b.fecha_inicio_utc, Number(b.duracion_min) || 60, fechaInicio, duracionMin);
  });

  const tomados = sameSlot.length;
  const lleno = tomados >= cap;

  return {
    cap: cap,
    tomados: tomados,
    disponibles: Math.max(0, cap - tomados),
    estricto: stricts,
    lleno: lleno,
    tipo: tipo,
    trainerFueraHorario: !workWindow.allowed,
    trainerNoDisponible: !!unavailRule,
    sedeBloqueada: sedeId ? !!sedeBlocks_checkConflict_(sedeId, fechaInicio, duracionMin) : false,
  };
}

function bookingsGetSlotStates(payload, ctx) {
  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  if (slots.length > 48) {
    throw _err('TOO_MANY_SLOTS', 'Demasiados horarios para consultar');
  }
  return {
    slots: slots.map(function (fechaInicioUtc) {
      const state = bookingsGetSlotCapacity(Object.assign({}, payload, {
        fechaInicioUtc: fechaInicioUtc,
      }), ctx);
      return Object.assign({}, state, {
        fechaInicioUtc: fechaInicioUtc,
      });
    }),
  };
}

function bookings_getApplicablePolicy_(booking) {
  // Prioridad: política del entrenador > sede > global
  if (booking.entrenador_id) {
    const tp = dbFindById('entrenadores_perfil', booking.entrenador_id);
    if (tp && tp.politica_cancelacion_id) {
      const p = dbFindById('politicas_cancelacion', tp.politica_cancelacion_id);
      if (p && p.estado === 'active') return p;
    }
  }
  if (booking.sede_id) {
    const sedePolicies = dbListAll('politicas_cancelacion', function (p) {
      return p.aplica_a === 'sede' && p.entidad_id === booking.sede_id && p.estado === 'active';
    });
    if (sedePolicies.length > 0) return sedePolicies[0];
  }
  const globalPolicies = dbListAll('politicas_cancelacion', function (p) {
    return p.aplica_a === 'global' && p.estado === 'active';
  });
  return globalPolicies.length > 0 ? globalPolicies[0] : null;
}

function _bookingErr_(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}


// ═══════════════════════════════════════════════════════════════════════
// trainer.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * trainer.gs — Endpoints específicos del entrenador.
 *
 * Iteración 6 · Núcleo Entrenador.
 * Permisos validados en cada función: solo el trainer mismo (o admin)
 * puede acceder a SUS usuarios y sus datos.
 */

// ──────────────────────────────────────────────────────────────────────────
// Dashboard del entrenador — agregado de su día
// ──────────────────────────────────────────────────────────────────────────

function trainerGetDashboard(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;

  const nowDate = new Date();
  const startOfToday = trainer_startOfDayUtc_(nowDate);
  const endOfToday = trainer_endOfDayUtc_(nowDate);
  const sevenDaysFromNow = new Date(nowDate.getTime() + 7 * 86400000);
  const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 86400000);

  // Sesiones de hoy
  const sesionesHoy = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    return t >= startOfToday.getTime() && t < endOfToday.getTime()
      && ['solicitado', 'confirmado', 'pactado', 'completado', 'no-asistido'].indexOf(String(b.estado)) !== -1;
  });
  sesionesHoy.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Solicitudes pendientes (cualquier fecha futura)
  const solicitudesPendientes = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (!b.fecha_inicio_utc) return false;
    if (new Date(b.fecha_inicio_utc) < nowDate) return false;
    return b.estado === 'solicitado' || b.estado === 'requiere_autorizacion';
  });
  solicitudesPendientes.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Sesiones completadas en últimos 7 días
  const completadasSemana = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (b.estado !== 'completado') return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc);
    return t >= sevenDaysAgo && t <= nowDate;
  });

  // Planes próximos a vencer (≤7 días)
  const planesPorVencer = dbListAll('planes_usuario', function (p) {
    if (p.estado !== 'active') return false;
    if (p.entrenador_id !== trainerId) return false;
    if (!p.fecha_vencimiento_utc) return false;
    const fv = new Date(p.fecha_vencimiento_utc);
    return fv <= sevenDaysFromNow && fv >= nowDate;
  });

  // Usuarios activos accesibles para este profesional:
  // asignados directamente o compartidos por sede activa.
  const accessMap = trainer_getAccessibleClientMap_(trainerId);
  const myUsers = dbListAll('usuarios', function (u) {
    return !!accessMap[u.id] && u.estado === 'active';
  });

  // Enriquecer sesiones con datos del cliente
  const enrichedHoy = sesionesHoy.map(function (b) {
    const u = dbFindById('usuarios', b.user_id);
    return {
      id: b.id,
      fechaInicioUtc: b.fecha_inicio_utc,
      duracionMin: Number(b.duracion_min) || 60,
      tipo: b.tipo,
      estado: b.estado,
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });
  const enrichedPendientes = solicitudesPendientes.slice(0, 10).map(function (b) {
    const u = dbFindById('usuarios', b.user_id);
    return {
      id: b.id,
      fechaInicioUtc: b.fecha_inicio_utc,
      duracionMin: Number(b.duracion_min) || 60,
      estado: b.estado,
      requiereAutorizacion: b.requiere_autorizacion === true || b.requiere_autorizacion === 'TRUE',
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });
  const enrichedPlanesVence = planesPorVencer.slice(0, 10).map(function (p) {
    const u = dbFindById('usuarios', p.user_id);
    const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - nowDate) / 86400000);
    return {
      id: p.id,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      diasRestantes: dias,
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });

  return {
    hoyKpi: {
      sesionesHoy: sesionesHoy.length,
      solicitudesPendientes: solicitudesPendientes.length,
      completadasSemana: completadasSemana.length,
      usuariosActivos: myUsers.length,
    },
    sesionesHoy: enrichedHoy,
    solicitudesPendientes: enrichedPendientes,
    planesPorVencer: enrichedPlanesVence,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// listMyUsers — lista de usuarios asignados al trainer
// ──────────────────────────────────────────────────────────────────────────

function trainerListMyUsers(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;
  const accessMap = trainer_getAccessibleClientMap_(trainerId);

  const users = dbListAll('usuarios', function (u) {
    return !!accessMap[u.id] && u.rol === 'client';
  });

  return users.map(function (u) {
    const access = accessMap[u.id] || { kind: 'assigned', sharedSedes: [] };
    // Plan activo
    const planes = dbListAll('planes_usuario', function (p) {
      return p.user_id === u.id && p.estado === 'active';
    });
    let planActivo = null;
    if (planes.length > 0) {
      planes.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      const p = planes[0];
      const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
      const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - new Date()) / 86400000);
      planActivo = {
        nombre: cat ? cat.nombre : 'Plan',
        sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
        sesionesTotales: Number(p.sesiones_totales),
        fechaVencimientoUtc: p.fecha_vencimiento_utc,
        diasRestantes: dias,
        estadoVisual: dias < 0 ? 'plan-vencido' : dias <= 7 ? 'plan-vence' : 'plan-activo',
      };
    }

    // Próxima sesión
    const futuras = dbListAll('agendamientos', function (b) {
      if (b.user_id !== u.id) return false;
      if (b.entrenador_id !== trainerId) return false;
      if (!b.fecha_inicio_utc) return false;
      if (new Date(b.fecha_inicio_utc) < new Date()) return false;
      return ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'].indexOf(String(b.estado)) !== -1;
    });
    futuras.sort(function (a, b) {
      return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
    });

    return {
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      nick: u.nick,
      foto_url: u.foto_url,
      estado: u.estado,
      accessKind: access.kind,
      sharedSedes: access.sharedSedes,
      planActivo: planActivo,
      proximaSesionUtc: futuras.length > 0 ? futuras[0].fecha_inicio_utc : null,
      proximaSesionEstado: futuras.length > 0 ? futuras[0].estado : null,
    };
  }).sort(function (a, b) {
    // Orden: con próxima sesión asc, luego por nombre
    if (a.proximaSesionUtc && b.proximaSesionUtc) {
      return new Date(a.proximaSesionUtc) - new Date(b.proximaSesionUtc);
    }
    if (a.proximaSesionUtc) return -1;
    if (b.proximaSesionUtc) return 1;
    return String(a.nombres).localeCompare(b.nombres);
  });
}

// ──────────────────────────────────────────────────────────────────────────
// getUserOperationalProfile — vista del entrenador sobre uno de sus clientes
// ──────────────────────────────────────────────────────────────────────────

function trainerListMyWorkLocations(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo profesionales y admin');
  }
  const trainerId = ctx.userId;

  const assignments = dbListAll('sedes_entrenadores', function (st) {
    return st.entrenador_id === trainerId && st.estado === 'active';
  });

  const gymIds = {};
  const sedes = assignments.map(function (a) {
    const s = dbFindById('sedes', a.sede_id);
    if (!s) return null;
    let gym = null;
    if (s.gimnasio_id) {
      const g = dbFindById('gimnasios', s.gimnasio_id);
      if (g) {
        gym = { id: g.id, nombre: g.nombre };
        gymIds[g.id] = g.nombre;
      }
    }
    return {
      id: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad,
      barrio: s.barrio,
      direccion: s.direccion,
      gimnasio_id: s.gimnasio_id || '',
      gimnasio: gym,
      desde: a.desde,
      hasta: a.hasta,
    };
  }).filter(Boolean);

  sedes.sort(function (a, b) {
    const ag = a.gimnasio ? a.gimnasio.nombre : 'zz';
    const bg = b.gimnasio ? b.gimnasio.nombre : 'zz';
    const byGym = ag.localeCompare(bg);
    if (byGym !== 0) return byGym;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  const gimnasios = Object.keys(gymIds).map(function (id) {
    return { id: id, nombre: gymIds[id] };
  }).sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre);
  });

  return {
    sedes: sedes,
    gimnasios: gimnasios,
  };
}

function trainerGetUserProfile(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  const accessMap = ctx.role === 'trainer'
    ? trainer_getAccessibleClientMap_(ctx.userId)
    : {};
  const access = accessMap[userId] || null;

  // Si es trainer, puede ver asignados directos o clientes compartidos por sede.
  if (ctx.role === 'trainer' && !access) {
    throw _err('FORBIDDEN', 'No es tu usuario');
  }

  // Planes
  const planes = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId;
  });
  planes.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const planesShape = planes.map(function (p) {
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    return {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaCompraUtc: p.fecha_compra_utc,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      estado: p.estado,
    };
  });

  // Asistencia reciente (últimas 10)
  const asistencias = dbListAll('asistencia', function (a) {
    return a.user_id === userId;
  });
  asistencias.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const asistenciasShape = asistencias.slice(0, 10).map(function (a) {
    return {
      id: a.id,
      agendamientoId: a.agendamiento_id,
      presente: a.presente === true || a.presente === 'TRUE',
      peso: a.peso,
      observaciones: a.observaciones,
      createdAt: a.created_at,
    };
  });

  // Bookings: próximos y recientes
  const allBookings = dbListAll('agendamientos', function (b) {
    return b.user_id === userId && b.fecha_inicio_utc;
  });
  const now = new Date();
  const proximos = allBookings.filter(function (b) {
    return new Date(b.fecha_inicio_utc) >= now
      && ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'].indexOf(String(b.estado)) !== -1;
  }).sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  }).slice(0, 5);
  const recientes = allBookings.filter(function (b) {
    return new Date(b.fecha_inicio_utc) < now;
  }).sort(function (a, b) {
    return new Date(b.fecha_inicio_utc) - new Date(a.fecha_inicio_utc);
  }).slice(0, 10);

  return {
    user: {
      id: user.id,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      nick: user.nick,
      celular: user.celular,
      foto_url: user.foto_url,
      estado: user.estado,
      privacidad_fotos: user.privacidad_fotos,
      accessKind: access ? access.kind : 'admin',
      sharedSedes: access ? access.sharedSedes : [],
    },
    planes: planesShape,
    asistencias: asistenciasShape,
    proximos: proximos,
    recientes: recientes,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// trainerGetMetas — progreso económico + tier del periodo (Iter 14b)
// Periodo default: mes en curso. payload.period = 'YYYY-MM' opcional.
//
// Tiers (umbrales fijos sobre la SUMA de metas tipo=economica del periodo):
//   base   ≥ 70%   meta   ≥ 100%   elite  ≥ 130%
// Por debajo de 70% → 'pendiente'. Sin meta económica → 'sin_meta'.
// ──────────────────────────────────────────────────────────────────────────

const TRAINER_METAS_TIERS = {
  base: 0.7,
  meta: 1.0,
  elite: 1.3,
};

function trainerGetMetas(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;

  const now = new Date();
  const periodInput = payload && payload.period ? String(payload.period) : '';
  const re = /^(\d{4})-(\d{2})$/;
  const match = re.exec(periodInput);
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const monthIdx = match ? Number(match[2]) - 1 : now.getUTCMonth();
  if (monthIdx < 0 || monthIdx > 11) {
    throw _err('VALIDATION', 'period inválido — formato YYYY-MM');
  }
  const periodStart = new Date(Date.UTC(year, monthIdx, 1));
  const periodEnd = new Date(Date.UTC(year, monthIdx + 1, 1));
  const periodLabel = String(year) + '-' + String(monthIdx + 1).padStart(2, '0');

  // Meta económica = suma de metas tipo=economica del periodo (Iter 14b)
  const metaEconomica = metas_getTotalEconomica_(trainerId, periodLabel);
  const metaUsuarios = metas_getTotalUsuarios_(trainerId, periodLabel);

  const planesPeriodo = dbListAll('planes_usuario', function (p) {
    if (p.entrenador_id !== trainerId) return false;
    if (!p.fecha_compra_utc) return false;
    const fc = new Date(p.fecha_compra_utc);
    return fc >= periodStart && fc < periodEnd;
  });
  const acumuladoEconomico = planesPeriodo.reduce(function (sum, p) {
    return sum + (Number(p.precio_pagado) || 0);
  }, 0);

  const usuariosActivos = dbListAll('usuarios', function (u) {
    return u.entrenador_asignado_id === trainerId
      && u.rol === 'client'
      && u.estado === 'active';
  }).length;

  let tier = 'sin_meta';
  let progresoEconomico = 0;
  if (metaEconomica > 0) {
    progresoEconomico = acumuladoEconomico / metaEconomica;
    if (progresoEconomico >= TRAINER_METAS_TIERS.elite) tier = 'elite';
    else if (progresoEconomico >= TRAINER_METAS_TIERS.meta) tier = 'meta';
    else if (progresoEconomico >= TRAINER_METAS_TIERS.base) tier = 'base';
    else tier = 'pendiente';
  }

  return {
    period: periodLabel,
    metaEconomica: metaEconomica,
    acumuladoEconomico: acumuladoEconomico,
    progresoEconomico: progresoEconomico,
    metaUsuarios: metaUsuarios,
    usuariosActivos: usuariosActivos,
    tier: tier,
    tierThresholds: TRAINER_METAS_TIERS,
    planesContados: planesPeriodo.length,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function trainer_startOfDayUtc_(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function trainer_endOfDayUtc_(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function trainer_getAccessibleClientMap_(trainerId) {
  const result = {};

  const assigned = dbListAll('usuarios', function (u) {
    return u.rol === 'client' && u.entrenador_asignado_id === trainerId;
  });
  for (let i = 0; i < assigned.length; i++) {
    result[assigned[i].id] = { kind: 'assigned', sharedSedes: [] };
  }

  const trainerSedes = dbListAll('sedes_entrenadores', function (st) {
    return st.entrenador_id === trainerId && st.estado === 'active';
  });
  const sedeNames = {};
  const trainerSedeIds = {};
  for (let i = 0; i < trainerSedes.length; i++) {
    const sedeId = trainerSedes[i].sede_id;
    trainerSedeIds[sedeId] = true;
    const sede = dbFindById('sedes', sedeId);
    sedeNames[sedeId] = sede ? sede.nombre : '';
  }

  if (trainerSedes.length === 0) return result;

  const userSedes = dbListAll('sedes_usuarios', function (su) {
    return !!trainerSedeIds[su.sede_id];
  });
  for (let i = 0; i < userSedes.length; i++) {
    const rel = userSedes[i];
    const user = dbFindById('usuarios', rel.user_id);
    if (!user || user.rol !== 'client') continue;

    const existing = result[user.id] || { kind: 'shared_sede', sharedSedes: [] };
    if (existing.kind !== 'assigned') existing.kind = 'shared_sede';
    existing.sharedSedes.push({
      id: rel.sede_id,
      nombre: sedeNames[rel.sede_id] || '',
      principal: rel.principal === true || rel.principal === 'TRUE',
    });
    result[user.id] = existing;
  }

  return result;
}


// ═══════════════════════════════════════════════════════════════════════
// metas.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * metas.gs — Metas mensuales del profesional (Iter 14b).
 *
 * Cada profesional puede tener varias metas en el mismo periodo (mes).
 * Cada meta tiene nombre libre, tipo (economica/usuarios/otra) y valor.
 *
 * Constraint lógica: (profesional_id, periodo, nombre) único. Se valida en
 * memoria antes de insertar/actualizar.
 *
 * El tier del trainer se calcula sobre la suma de metas tipo=economica del
 * periodo (ver trainerGetMetas en trainer.gs).
 */

const META_TIPOS = ['economica', 'usuarios', 'otra'];

// ──────────────────────────────────────────────────────────────────────────
// Helpers de periodo
// ──────────────────────────────────────────────────────────────────────────

function metas_normalizePeriod_(periodInput) {
  const re = /^(\d{4})-(\d{2})$/;
  if (periodInput) {
    const m = re.exec(String(periodInput));
    if (!m) throw _err('VALIDATION', 'period inválido — formato YYYY-MM');
    const month = Number(m[2]);
    if (month < 1 || month > 12) {
      throw _err('VALIDATION', 'period inválido — mes fuera de rango');
    }
    return m[1] + '-' + m[2];
  }
  const now = new Date();
  return now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');
}

/**
 * Normaliza el valor de la columna `periodo` leído de Sheets. Sheets
 * autoconvierte "2026-05" a Date object (mes/año), así que al leer puede
 * llegar como Date o ISO string. Devuelve siempre "YYYY-MM".
 */
function metas_periodoToString_(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) {
    return v.getUTCFullYear() + '-' + String(v.getUTCMonth() + 1).padStart(2, '0');
  }
  const s = String(v);
  // ISO date → tomar YYYY-MM
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  return s;
}

/**
 * Fuerza formato texto en la columna `periodo` para evitar que Sheets
 * autointerprete el valor como Date. Idempotente, barato.
 */
function metas_ensurePeriodoTextFormat_() {
  const sheet = db_getSheet_('metas_profesional');
  const headers = db_getHeaders_(sheet);
  const periodoCol = headers.indexOf('periodo') + 1;
  if (periodoCol === 0) return;
  const maxRows = sheet.getMaxRows();
  if (maxRows < 2) return;
  sheet.getRange(2, periodoCol, maxRows - 1, 1).setNumberFormat('@');
}

// ──────────────────────────────────────────────────────────────────────────
// listMyMetas — metas del trainer logueado en un periodo
// ──────────────────────────────────────────────────────────────────────────

function metasListMine(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const periodo = metas_normalizePeriod_(payload && payload.period);
  const trainerId = ctx.userId;

  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && metas_periodoToString_(m.periodo) === periodo;
  });
  items.sort(function (a, b) {
    return String(a.created_at).localeCompare(String(b.created_at));
  });

  return {
    period: periodo,
    items: items.map(function (m) {
      return {
        id: m.id,
        profesionalId: m.profesional_id,
        periodo: metas_periodoToString_(m.periodo),
        nombre: m.nombre,
        tipo: m.tipo,
        valor: Number(m.valor) || 0,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
    }),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// createMyMeta — crea con validación de unicidad por (trainer, periodo, nombre)
// ──────────────────────────────────────────────────────────────────────────

function metasCreate(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;
  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 80 });
  const tipo = vEnum(payload.tipo, 'tipo', META_TIPOS);
  const valor = vNumber(vRequired(payload.valor, 'valor'), 'valor', { min: 0 });
  const periodo = metas_normalizePeriod_(payload.period);

  const dup = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && metas_periodoToString_(m.periodo) === periodo
      && String(m.nombre).toLowerCase() === nombre.toLowerCase();
  });
  if (dup.length > 0) {
    throw _err('META_DUPLICATE', 'Ya tienes una meta con ese nombre en ' + periodo);
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  const meta = {
    id: id,
    profesional_id: trainerId,
    periodo: periodo,
    nombre: nombre,
    tipo: tipo,
    valor: valor,
    created_at: now,
    updated_at: now,
  };
  dbInsert('metas_profesional', meta);
  // Forzar formato texto en la columna periodo para evitar que Sheets
  // autoconvierta "2026-05" a Date object.
  metas_ensurePeriodoTextFormat_();

  auditOk(ctx.userId, 'create_meta', 'metas_profesional', id,
    '', JSON.stringify({ periodo: periodo, nombre: nombre, tipo: tipo, valor: valor }),
    ctx.reqMeta);

  return { meta: meta };
}

// ──────────────────────────────────────────────────────────────────────────
// updateMyMeta — solo nombre y valor son editables
// ──────────────────────────────────────────────────────────────────────────

function metasUpdate(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const before = dbFindById('metas_profesional', id);
  if (!before) throw _err('NOT_FOUND', 'Meta no encontrada');

  if (before.profesional_id !== ctx.userId
    && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'No es tu meta');
  }

  if (payload.nombre == null && payload.valor == null) {
    throw _err('VALIDATION', 'Envía al menos nombre o valor a actualizar');
  }

  const patch = { updated_at: dbNowUtc() };

  if (payload.nombre != null) {
    const nuevoNombre = vString(payload.nombre, 'nombre', { min: 2, max: 80 });
    if (nuevoNombre.toLowerCase() !== String(before.nombre).toLowerCase()) {
      const beforePeriodo = metas_periodoToString_(before.periodo);
      const dup = dbListAll('metas_profesional', function (m) {
        return m.profesional_id === before.profesional_id
          && metas_periodoToString_(m.periodo) === beforePeriodo
          && m.id !== id
          && String(m.nombre).toLowerCase() === nuevoNombre.toLowerCase();
      });
      if (dup.length > 0) {
        throw _err('META_DUPLICATE',
          'Ya tienes una meta con ese nombre en ' + beforePeriodo);
      }
    }
    patch.nombre = nuevoNombre;
  }

  if (payload.valor != null) {
    patch.valor = vNumber(payload.valor, 'valor', { min: 0 });
  }

  const updated = dbUpdateById('metas_profesional', id, patch);

  auditOk(ctx.userId, 'update_meta', 'metas_profesional', id,
    JSON.stringify({ nombre: before.nombre, valor: before.valor }),
    JSON.stringify(patch),
    ctx.reqMeta);

  return { meta: updated };
}

// ──────────────────────────────────────────────────────────────────────────
// deleteMyMeta — borrado físico (no hay soft delete para metas)
// ──────────────────────────────────────────────────────────────────────────

function metasDelete(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const meta = dbFindById('metas_profesional', id);
  if (!meta) throw _err('NOT_FOUND', 'Meta no encontrada');

  if (meta.profesional_id !== ctx.userId
    && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'No es tu meta');
  }

  // Borrado físico — buscar la fila por PK y eliminarla
  const sheet = db_getSheet_('metas_profesional');
  const headers = db_getHeaders_(sheet);
  const pkIdx = headers.indexOf('id');
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][pkIdx]) === String(id)) {
        sheet.deleteRow(i + 2);
        break;
      }
    }
  }

  auditOk(ctx.userId, 'delete_meta', 'metas_profesional', id,
    JSON.stringify({ nombre: meta.nombre, valor: meta.valor }), '',
    ctx.reqMeta);

  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// metasGetTotalEconomica_ — helper interno para el cálculo del tier
// Devuelve la suma de valores de metas tipo=economica del trainer/periodo.
// ──────────────────────────────────────────────────────────────────────────

function metas_getTotalEconomica_(trainerId, periodo) {
  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && metas_periodoToString_(m.periodo) === periodo
      && m.tipo === 'economica';
  });
  return items.reduce(function (sum, m) {
    return sum + (Number(m.valor) || 0);
  }, 0);
}

function metas_getTotalUsuarios_(trainerId, periodo) {
  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && metas_periodoToString_(m.periodo) === periodo
      && m.tipo === 'usuarios';
  });
  return items.reduce(function (sum, m) {
    return sum + (Number(m.valor) || 0);
  }, 0);
}


// ═══════════════════════════════════════════════════════════════════════
// admin.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * admin.gs — Endpoints de administración.
 *
 * Iteración 7 · Núcleo Admin.
 * Todos los endpoints validan rol admin/super_admin antes de actuar.
 */

// ──────────────────────────────────────────────────────────────────────────
// Guard común
// ──────────────────────────────────────────────────────────────────────────

function admin_requireAdmin_(ctx) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo el equipo de administración puede hacer esto');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Dashboard de admin — KPIs globales
// ──────────────────────────────────────────────────────────────────────────

function adminGetDashboard(_payload, ctx) {
  admin_requireAdmin_(ctx);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

  // Usuarios por rol y estado
  const usuarios = dbListAll('usuarios', function () { return true; });
  const usuariosActivos = usuarios.filter(function (u) { return u.estado === 'active'; });
  const trainersActivos = usuariosActivos.filter(function (u) { return u.rol === 'trainer'; });
  const clientsActivos = usuariosActivos.filter(function (u) { return u.rol === 'client'; });
  const usuariosPending = usuarios.filter(function (u) { return u.estado === 'pending'; });

  // Sedes
  const sedes = dbListAll('sedes', function () { return true; });
  const sedesActivas = sedes.filter(function (s) { return s.estado === 'active'; });

  // Planes
  const planes = dbListAll('planes_usuario', function () { return true; });
  const planesActivos = planes.filter(function (p) { return p.estado === 'active'; });
  const planesPorVencer = planesActivos.filter(function (p) {
    return p.fecha_vencimiento_utc &&
      new Date(p.fecha_vencimiento_utc) <= sevenDaysFromNow &&
      new Date(p.fecha_vencimiento_utc) >= now;
  });
  const planesVencidos = planesActivos.filter(function (p) {
    return p.fecha_vencimiento_utc && new Date(p.fecha_vencimiento_utc) < now;
  });

  // Sesiones
  const sesiones = dbListAll('agendamientos', function () { return true; });
  const sesionesEstaSemana = sesiones.filter(function (b) {
    return b.fecha_inicio_utc && new Date(b.fecha_inicio_utc) >= sevenDaysAgo
      && new Date(b.fecha_inicio_utc) <= now;
  });
  const completadasSemana = sesionesEstaSemana.filter(function (b) { return b.estado === 'completado'; });
  const canceladasSemana = sesionesEstaSemana.filter(function (b) { return b.estado === 'cancelado'; });
  const noAsistidasSemana = sesionesEstaSemana.filter(function (b) { return b.estado === 'no-asistido'; });

  return {
    usuarios: {
      total: usuarios.length,
      activos: usuariosActivos.length,
      pendientes: usuariosPending.length,
      clients: clientsActivos.length,
      trainers: trainersActivos.length,
    },
    sedes: {
      total: sedes.length,
      activas: sedesActivas.length,
    },
    planes: {
      activos: planesActivos.length,
      porVencer: planesPorVencer.length,
      vencidos: planesVencidos.length,
    },
    sesionesSemana: {
      total: sesionesEstaSemana.length,
      completadas: completadasSemana.length,
      canceladas: canceladasSemana.length,
      noAsistidas: noAsistidasSemana.length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Usuarios — CRUD
// ──────────────────────────────────────────────────────────────────────────

function adminListUsers(payload, ctx) {
  admin_requireAdmin_(ctx);
  const filterRole = payload && payload.rol ? String(payload.rol) : null;
  const filterEstado = payload && payload.estado ? String(payload.estado) : null;
  const search = payload && payload.search ? String(payload.search).toLowerCase() : null;

  let users = dbListAll('usuarios', function (u) {
    if (filterRole && u.rol !== filterRole) return false;
    if (filterEstado && u.estado !== filterEstado) return false;
    return true;
  });

  if (search) {
    users = users.filter(function (u) {
      const haystack = (
        String(u.nombres || '') + ' ' +
        String(u.apellidos || '') + ' ' +
        String(u.nick || '') + ' ' +
        String(u.email || '')
      ).toLowerCase();
      return haystack.indexOf(search) !== -1;
    });
  }

  users.sort(function (a, b) {
    return String(a.apellidos || '').localeCompare(String(b.apellidos || ''));
  });

  // Cache de sedes/gimnasios para enriquecer
  const sedesCache = {};
  function lookupSede(id) {
    if (!id) return null;
    if (id in sedesCache) return sedesCache[id];
    const s = dbFindById('sedes', id);
    sedesCache[id] = s ? {
      id: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad,
      gimnasio_id: s.gimnasio_id || null,
    } : null;
    return sedesCache[id];
  }
  const gymCache = {};
  function lookupGym(id) {
    if (!id) return null;
    if (id in gymCache) return gymCache[id];
    const g = dbFindById('gimnasios', id);
    gymCache[id] = g ? { id: g.id, nombre: g.nombre } : null;
    return gymCache[id];
  }

  // Pre-cargar todas las relaciones sedes_usuarios + sedes_entrenadores una vez
  const allSedeUsuarios = dbListAll('sedes_usuarios', function () { return true; });
  const allSedeTrainers = dbListAll('sedes_entrenadores', function (st) {
    return st.estado === 'active';
  });

  // Enriquecer trainers con flag de tener perfil + sedes/gimnasios
  return users.map(function (u) {
    const trainerProfile = u.rol === 'trainer'
      ? dbFindById('entrenadores_perfil', u.id)
      : null;
    const hasTrainerProfile = !!trainerProfile;

    // Sedes a las que pertenece (clientes vía sedes_usuarios; trainers vía sedes_entrenadores)
    let sedesEnriched = [];
    if (u.rol === 'client') {
      sedesEnriched = allSedeUsuarios
        .filter(function (su) { return su.user_id === u.id; })
        .map(function (su) {
          const sede = lookupSede(su.sede_id);
          return sede ? Object.assign({}, sede, {
            principal: su.principal === true || su.principal === 'TRUE',
          }) : null;
        })
        .filter(Boolean);
    } else if (u.rol === 'trainer') {
      const sedesIds = allSedeTrainers
        .filter(function (st) { return st.entrenador_id === u.id; })
        .map(function (st) { return st.sede_id; });
      sedesEnriched = sedesIds.map(lookupSede).filter(Boolean);
    }

    // Set de gimnasios derivados de las sedes
    const gymIds = {};
    sedesEnriched.forEach(function (s) {
      if (s.gimnasio_id) gymIds[s.gimnasio_id] = true;
    });
    const gimnasios = Object.keys(gymIds).map(lookupGym).filter(Boolean);

    return {
      id: u.id,
      email: u.email,
      rol: u.rol,
      nombres: u.nombres,
      apellidos: u.apellidos,
      nick: u.nick,
      cedula: u.cedula,
      celular: u.celular,
      foto_url: u.foto_url,
      estado: u.estado,
      entrenador_asignado_id: u.entrenador_asignado_id,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
      hasTrainerProfile: hasTrainerProfile,
      categoriaProfesional: trainerProfile ? (trainerProfile.categoria_profesional || '') : '',
      tipoProfesional: trainerProfile ? (trainerProfile.tipo_profesional || '') : '',
      sedes: sedesEnriched,
      gimnasios: gimnasios,
    };
  });
}

function adminCreateUser(payload, ctx) {
  admin_requireAdmin_(ctx);

  const email = vEmail(payload.email);
  const rol = vEnum(payload.rol, 'rol', ['admin', 'trainer', 'client']);
  const nombres = vString(vRequired(payload.nombres, 'nombres'), 'nombres', { min: 1, max: 80 });
  const apellidos = vString(vRequired(payload.apellidos, 'apellidos'), 'apellidos', { min: 1, max: 80 });
  const nick = payload.nick ? vString(payload.nick, 'nick', { min: 2, max: 30 }) : '';
  const cedula = payload.cedula ? vString(payload.cedula, 'cedula', { max: 30 }) : '';
  const celular = payload.celular ? vString(payload.celular, 'celular', { max: 20 }) : '';
  const entrenadorAsignado = payload.entrenadorAsignadoId
    ? vUuid(payload.entrenadorAsignadoId, 'entrenadorAsignadoId')
    : '';

  // Validar unicidad de email (caja-sensitiva al lower)
  if (dbIndexLookup('email', email)) {
    throw _err('EMAIL_TAKEN', 'Ya existe un usuario con ese correo');
  }
  // Validar unicidad de nick si se pasó
  if (nick && dbIndexLookup('nick', nick)) {
    throw _err('NICK_TAKEN', 'Ese nick ya está en uso');
  }
  // Validar entrenador asignado si aplica
  if (rol === 'client' && entrenadorAsignado) {
    const t = dbFindById('usuarios', entrenadorAsignado);
    if (!t || t.rol !== 'trainer') {
      throw _err('TRAINER_INVALID', 'El entrenador asignado no es válido');
    }
  }

  const userId = cryptoUuid();
  const now = dbNowUtc();

  dbInsert('usuarios', {
    id: userId,
    email: email,
    rol: rol,
    nombres: nombres,
    apellidos: apellidos,
    nick: nick,
    cedula: cedula,
    celular: celular,
    foto_url: '',
    estado: 'pending',
    preferencias_notif: { in_app: true, email: true },
    privacidad_fotos: 'solo_yo',
    entrenador_asignado_id: rol === 'client' ? entrenadorAsignado : '',
    created_at: now,
    updated_at: now,
    last_login_at: '',
    created_by: ctx.userId,
  });

  dbIndexUpsert('email', email, userId);
  if (nick) dbIndexUpsert('nick', nick, userId);

  // Generar token de activación
  const token = cryptoRandomHex(32);
  const ttlHours = (function () {
    const cfg = dbFindById('config', 'app.activation_token_ttl_hours');
    return cfg ? Number(cfg.value) : 24;
  })();
  dbInsert('tokens_temporales', {
    token: token,
    tipo: 'activation',
    user_id: userId,
    created_at: now,
    expires_at: dbAddHours(now, ttlHours),
    used_at: '',
  });

  // Email de activación
  emailSendActivationLink(
    { email: email, nombres: nombres },
    token
  );

  auditOk(ctx.userId, 'create_user', 'usuario', userId, '',
    JSON.stringify({ email: email, rol: rol }), ctx.reqMeta);

  return {
    user: {
      id: userId, email: email, rol: rol, nombres: nombres,
      apellidos: apellidos, nick: nick, estado: 'pending',
    },
    activationLink: 'https://dyoma-web.github.io/alfallo/#/activate?token=' + token,
  };
}

function adminUpdateUser(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  const allowed = ['nombres', 'apellidos', 'nick', 'cedula', 'celular',
                   'entrenador_asignado_id', 'foto_url', 'rol'];
  const patch = {};

  for (let i = 0; i < allowed.length; i++) {
    const k = allowed[i];
    if (!(k in payload)) continue;
    if (k === 'rol') {
      patch[k] = vEnum(payload[k], 'rol',
        ['super_admin', 'admin', 'trainer', 'client']);
    } else if (k === 'nick') {
      const newNick = payload[k] ? vString(payload[k], 'nick', { min: 2, max: 30 }) : '';
      if (newNick && newNick !== user.nick) {
        const taken = dbIndexLookup('nick', newNick);
        if (taken && taken !== userId) throw _err('NICK_TAKEN', 'Ese nick ya está en uso');
        if (user.nick) dbIndexRemove('nick', user.nick);
        if (newNick) dbIndexUpsert('nick', newNick, userId);
      }
      patch[k] = newNick;
    } else if (k === 'entrenador_asignado_id') {
      patch[k] = payload[k] ? vUuid(payload[k], 'entrenador_asignado_id') : '';
    } else {
      patch[k] = payload[k];
    }
  }

  patch.updated_at = dbNowUtc();
  const updated = dbUpdateById('usuarios', userId, patch);

  auditOk(ctx.userId, 'update_user', 'usuario', userId,
    JSON.stringify(user), JSON.stringify(updated), ctx.reqMeta);

  return { user: updated };
}

function adminGetUserSedes(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.rol !== 'client') {
    throw _err('NOT_CLIENT', 'Solo se administran sedes de clientes en este flujo');
  }

  const assignments = dbListAll('sedes_usuarios', function (su) {
    return su.user_id === userId;
  });
  return {
    userId: userId,
    assignments: assignments.map(function (su) {
      const sede = su.sede_id ? dbFindById('sedes', su.sede_id) : null;
      const gym = sede && sede.gimnasio_id ? dbFindById('gimnasios', sede.gimnasio_id) : null;
      return {
        id: su.id,
        sedeId: su.sede_id,
        principal: su.principal === true || su.principal === 'TRUE',
        createdAt: su.created_at,
        sede: sede ? {
          id: sede.id,
          nombre: sede.nombre,
          ciudad: sede.ciudad,
          barrio: sede.barrio,
          gimnasio: gym ? { id: gym.id, nombre: gym.nombre } : null,
        } : null,
      };
    }),
  };
}

function adminSetUserSedes(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.rol !== 'client') {
    throw _err('NOT_CLIENT', 'Solo se administran sedes de clientes en este flujo');
  }

  const rawAssignments = Array.isArray(payload.assignments) ? payload.assignments : [];
  const bySede = {};
  const orderedSedeIds = [];
  for (let i = 0; i < rawAssignments.length; i++) {
    const sedeId = vUuid(vRequired(rawAssignments[i].sedeId, 'sedeId'), 'sedeId');
    const sede = dbFindById('sedes', sedeId);
    if (!sede) throw _err('SEDE_NOT_FOUND', 'Sede no encontrada');
    if (!bySede[sedeId]) orderedSedeIds.push(sedeId);
    bySede[sedeId] = {
      sedeId: sedeId,
      principal: rawAssignments[i].principal === true || rawAssignments[i].principal === 'TRUE',
    };
  }

  let hasPrincipal = false;
  for (let j = 0; j < orderedSedeIds.length; j++) {
    if (bySede[orderedSedeIds[j]].principal) {
      if (!hasPrincipal) {
        hasPrincipal = true;
      } else {
        bySede[orderedSedeIds[j]].principal = false;
      }
    }
  }
  if (!hasPrincipal && orderedSedeIds.length > 0) {
    bySede[orderedSedeIds[0]].principal = true;
  }

  const existing = dbListAll('sedes_usuarios', function (su) {
    return su.user_id === userId;
  });
  const existingBySede = {};
  for (let k = 0; k < existing.length; k++) {
    existingBySede[existing[k].sede_id] = existing[k];
  }

  const now = dbNowUtc();
  const keptIds = {};
  for (let a = 0; a < orderedSedeIds.length; a++) {
    const desired = bySede[orderedSedeIds[a]];
    const found = existingBySede[desired.sedeId];
    if (found) {
      dbUpdateById('sedes_usuarios', found.id, {
        principal: desired.principal,
      });
      keptIds[found.id] = true;
    } else {
      const created = dbInsert('sedes_usuarios', {
        id: cryptoUuid(),
        sede_id: desired.sedeId,
        user_id: userId,
        principal: desired.principal,
        created_at: now,
      });
      keptIds[created.id] = true;
    }
  }

  const sheet = db_getSheet_('sedes_usuarios');
  const headers = db_getHeaders_(sheet);
  const idCol = headers.indexOf('id') + 1;
  for (let r = sheet.getLastRow(); r >= 2; r--) {
    const id = sheet.getRange(r, idCol).getValue();
    const row = existing.find(function (su) { return su.id === id; });
    if (row && !keptIds[id]) {
      sheet.deleteRow(r);
    }
  }

  auditOk(ctx.userId, 'set_user_sedes', 'sedes_usuarios', userId,
    JSON.stringify(existing), JSON.stringify(orderedSedeIds.map(function (id) { return bySede[id]; })), ctx.reqMeta);
  return adminGetUserSedes({ userId: userId }, ctx);
}

function adminSuspendUser(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  if (userId === ctx.userId) throw _err('SELF_FORBIDDEN', 'No puedes suspenderte a ti mismo');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  dbUpdateById('usuarios', userId, {
    estado: 'suspended',
    updated_at: dbNowUtc(),
  });

  // Revocar todas las sesiones activas
  const sesiones = dbListAll('sesiones', function (s) {
    return s.user_id === userId && s.revoked !== true && s.revoked !== 'TRUE';
  });
  for (let i = 0; i < sesiones.length; i++) {
    dbUpdateById('sesiones', sesiones[i].token, { revoked: true });
  }

  auditOk(ctx.userId, 'suspend_user', 'usuario', userId, '', '', ctx.reqMeta);
  return { ok: true };
}

function adminReactivateUser(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  dbUpdateById('usuarios', userId, {
    estado: 'active',
    updated_at: dbNowUtc(),
  });
  auditOk(ctx.userId, 'reactivate_user', 'usuario', userId, '', '', ctx.reqMeta);
  return { ok: true };
}

function adminResendActivation(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.estado === 'active') {
    throw _err('ALREADY_ACTIVE', 'El usuario ya está activado');
  }

  const now = dbNowUtc();
  const ttlHours = (function () {
    const cfg = dbFindById('config', 'app.activation_token_ttl_hours');
    return cfg ? Number(cfg.value) : 24;
  })();

  // Invalidar tokens previos
  const oldTokens = dbListAll('tokens_temporales', function (t) {
    return t.user_id === userId && t.tipo === 'activation' && !t.used_at;
  });
  for (let i = 0; i < oldTokens.length; i++) {
    dbUpdateById('tokens_temporales', oldTokens[i].token, { used_at: now });
  }

  const token = cryptoRandomHex(32);
  dbInsert('tokens_temporales', {
    token: token, tipo: 'activation', user_id: userId,
    created_at: now, expires_at: dbAddHours(now, ttlHours), used_at: '',
  });

  emailSendActivationLink({ email: user.email, nombres: user.nombres }, token);

  auditOk(ctx.userId, 'resend_activation', 'usuario', userId, '', '', ctx.reqMeta);
  return {
    ok: true,
    activationLink: 'https://dyoma-web.github.io/alfallo/#/activate?token=' + token,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Trainer profile — extensión profesional del usuario con rol=trainer
// ──────────────────────────────────────────────────────────────────────────

function adminUpsertTrainerProfile(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.rol !== 'trainer') {
    throw _err('NOT_TRAINER', 'El usuario no tiene rol de entrenador');
  }

  const data = {
    perfil_profesional: vString(payload.perfilProfesional || '', 'perfil_profesional', { max: 2000 }),
    habilidades: payload.habilidades
      ? (Array.isArray(payload.habilidades) ? payload.habilidades.join(',') : String(payload.habilidades))
      : '',
    tipos_entrenamiento: payload.tiposEntrenamiento
      ? (Array.isArray(payload.tiposEntrenamiento) ? payload.tiposEntrenamiento.join(',') : String(payload.tiposEntrenamiento))
      : '',
    certificaciones: payload.certificaciones || '',
    restricciones: payload.restricciones || '',
    redes_sociales: payload.redesSociales || {},
    franja_trabajo: payload.franjaTrabajo || {},
    politica_cancelacion_id: payload.politicaCancelacionId || '',
    visibilidad_default: vEnum(payload.visibilidadDefault || 'solo_franjas',
      'visibilidad_default', ['nombres_visibles', 'solo_franjas']),
    cupos_estrictos: payload.cuposEstrictos !== false,
    cupos_personalizado: payload.cuposPersonalizado != null
      ? Math.max(1, Number(payload.cuposPersonalizado)) : 1,
    cupos_semipersonalizado: payload.cuposSemipersonalizado != null
      ? Math.max(1, Number(payload.cuposSemipersonalizado)) : 5,
    cupos_grupal: payload.cuposGrupal != null
      ? Math.max(1, Number(payload.cuposGrupal)) : 15,
    meta_economica_mensual: payload.metaEconomicaMensual ? Number(payload.metaEconomicaMensual) : 0,
    meta_usuarios_activos: payload.metaUsuariosActivos ? Number(payload.metaUsuariosActivos) : 0,
    categoria_profesional: payload.categoriaProfesional
      ? vEnum(payload.categoriaProfesional, 'categoriaProfesional',
          ['entrenador', 'fisio', 'evaluador', 'nutricionista', 'otro'])
      : 'entrenador',
    tipo_profesional: payload.tipoProfesional
      ? vString(payload.tipoProfesional, 'tipoProfesional', { max: 120 })
      : '',
    updated_at: dbNowUtc(),
  };

  const existing = dbFindById('entrenadores_perfil', userId);
  let result;
  if (existing) {
    result = dbUpdateById('entrenadores_perfil', userId, data);
  } else {
    data.user_id = userId;
    data.calificacion_promedio = 0;
    data.total_calificaciones = 0;
    data.created_at = dbNowUtc();
    result = dbInsert('entrenadores_perfil', data);
  }

  auditOk(ctx.userId, 'upsert_trainer_profile', 'entrenadores_perfil', userId,
    '', JSON.stringify(result), ctx.reqMeta);
  return { profile: result };
}

function adminGetTrainerProfile(payload, ctx) {
  admin_requireAdmin_(ctx);
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  return { profile: dbFindById('entrenadores_perfil', userId) };
}

// ──────────────────────────────────────────────────────────────────────────
// Sedes — CRUD
// ──────────────────────────────────────────────────────────────────────────

function adminListSedes(_payload, ctx) {
  admin_requireAdmin_(ctx);
  const sedes = dbListAll('sedes', function () { return true; });
  sedes.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  // Cache de gimnasios
  const gymCache = {};
  function lookupGym(id) {
    if (!id) return null;
    if (id in gymCache) return gymCache[id];
    const g = dbFindById('gimnasios', id);
    gymCache[id] = g ? { id: g.id, nombre: g.nombre, verificado: g.verificado === true } : null;
    return gymCache[id];
  }

  return sedes.map(function (s) {
    const trainers = dbListAll('sedes_entrenadores', function (st) {
      return st.sede_id === s.id && st.estado === 'active';
    });
    const users = dbListAll('sedes_usuarios', function (su) {
      return su.sede_id === s.id;
    });
    return Object.assign({}, s, {
      trainersCount: trainers.length,
      usuariosCount: users.length,
      gimnasio: lookupGym(s.gimnasio_id),
    });
  });
}

function adminCreateSede(payload, ctx) {
  admin_requireAdmin_(ctx);

  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 120 });
  const codigo = payload.codigoInterno
    ? vString(payload.codigoInterno, 'codigo_interno', { max: 30 })
    : '';
  const categoriaSede = payload.categoriaSede
    ? vEnum(payload.categoriaSede, 'categoriaSede', ['basica', 'plus', 'premium', 'elite'])
    : 'basica';
  const categoriaRank = payload.categoriaRank
    ? vNumber(payload.categoriaRank, 'categoriaRank', { min: 1, max: 4, int: true })
    : 1;

  const id = cryptoUuid();
  const now = dbNowUtc();
  const sede = {
    id: id,
    nombre: nombre,
    codigo_interno: codigo,
    direccion: payload.direccion || '',
    ciudad: payload.ciudad || '',
    barrio: payload.barrio || '',
    telefono: payload.telefono || '',
    responsable: payload.responsable || '',
    horarios: payload.horarios || {},
    capacidad: payload.capacidad ? Number(payload.capacidad) : '',
    observaciones: payload.observaciones || '',
    servicios: Array.isArray(payload.servicios)
      ? payload.servicios.join(',')
      : (payload.servicios || ''),
    reglas: payload.reglas || '',
    estado: 'active',
    gimnasio_id: payload.gimnasioId ? vUuid(payload.gimnasioId, 'gimnasioId') : '',
    categoria_sede: categoriaSede,
    categoria_rank: categoriaRank,
    created_at: now,
    updated_at: now,
  };

  dbInsert('sedes', sede);
  auditOk(ctx.userId, 'create_sede', 'sede', id, '', JSON.stringify(sede), ctx.reqMeta);
  return { sede: sede };
}

function adminUpdateSede(payload, ctx) {
  admin_requireAdmin_(ctx);
  const sedeId = vUuid(vRequired(payload.sedeId, 'sedeId'), 'sedeId');
  const before = dbFindById('sedes', sedeId);
  if (!before) throw _err('NOT_FOUND', 'Sede no encontrada');

  const allowed = ['nombre', 'codigo_interno', 'direccion', 'ciudad', 'barrio',
                   'telefono', 'responsable', 'horarios', 'capacidad',
                   'observaciones', 'servicios', 'reglas', 'estado', 'gimnasio_id',
                   'categoria_sede', 'categoria_rank'];
  const patch = {};
  for (let i = 0; i < allowed.length; i++) {
    const k = allowed[i];
    const camelKey = k.replace(/_(.)/g, function (_, c) { return c.toUpperCase(); });
    if (k in payload) patch[k] = payload[k];
    else if (camelKey in payload) patch[k] = payload[camelKey];
  }
  if ('categoria_sede' in patch) {
    patch.categoria_sede = patch.categoria_sede
      ? vEnum(patch.categoria_sede, 'categoriaSede', ['basica', 'plus', 'premium', 'elite'])
      : '';
  }
  if ('categoria_rank' in patch) {
    patch.categoria_rank = patch.categoria_rank
      ? vNumber(patch.categoria_rank, 'categoriaRank', { min: 1, max: 4, int: true })
      : '';
  }
  if ('servicios' in patch && Array.isArray(patch.servicios)) {
    patch.servicios = patch.servicios.join(',');
  }
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('sedes', sedeId, patch);
  auditOk(ctx.userId, 'update_sede', 'sede', sedeId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { sede: updated };
}

function adminAssignTrainerToSede(payload, ctx) {
  admin_requireAdmin_(ctx);
  const sedeId = vUuid(vRequired(payload.sedeId, 'sedeId'), 'sedeId');
  const trainerId = vUuid(vRequired(payload.trainerId, 'trainerId'), 'trainerId');

  // ¿Ya hay asignación activa?
  const existing = dbListAll('sedes_entrenadores', function (st) {
    return st.sede_id === sedeId && st.entrenador_id === trainerId && st.estado === 'active';
  });
  if (existing.length > 0) return { already: true, id: existing[0].id };

  const now = dbNowUtc();
  const created = dbInsert('sedes_entrenadores', {
    id: cryptoUuid(),
    sede_id: sedeId,
    entrenador_id: trainerId,
    desde: now, hasta: '', estado: 'active',
  });
  auditOk(ctx.userId, 'assign_trainer_to_sede', 'sedes_entrenadores', created.id,
    '', JSON.stringify(created), ctx.reqMeta);
  return { assignment: created };
}

function adminUnassignTrainerFromSede(payload, ctx) {
  admin_requireAdmin_(ctx);
  const assignmentId = vUuid(vRequired(payload.assignmentId, 'assignmentId'), 'assignmentId');
  dbUpdateById('sedes_entrenadores', assignmentId, {
    estado: 'inactive',
    hasta: dbNowUtc(),
  });
  auditOk(ctx.userId, 'unassign_trainer_sede', 'sedes_entrenadores', assignmentId,
    '', '', ctx.reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Planes catálogo — CRUD
// ──────────────────────────────────────────────────────────────────────────

function adminListPlanesCatalogo(_payload, ctx) {
  admin_requireAdmin_(ctx);
  const planes = dbListAll('planes_catalogo', function () { return true; });
  planes.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  // Enriquecer con datos del entrenador y sede
  return planes.map(function (p) {
    const t = p.entrenador_id ? dbFindById('usuarios', p.entrenador_id) : null;
    const s = p.sede_id ? dbFindById('sedes', p.sede_id) : null;
    return Object.assign({}, p, {
      entrenador: t ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos } : null,
      sede: s ? { id: s.id, nombre: s.nombre } : null,
    });
  });
}

function adminCreatePlanCatalogo(payload, ctx) {
  admin_requireAdmin_(ctx);

  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 120 });
  const tipo = vEnum(payload.tipo, 'tipo', ['personalizado', 'semipersonalizado', 'grupal']);
  const numSesiones = vNumber(vRequired(payload.numSesiones, 'numSesiones'),
    'numSesiones', { min: 1, max: 1000, int: true });
  const precio = vNumber(vRequired(payload.precio, 'precio'), 'precio', { min: 0 });
  const moneda = payload.moneda || 'COP';
  const vigenciaDias = vNumber(vRequired(payload.vigenciaDias, 'vigenciaDias'),
    'vigenciaDias', { min: 1, max: 730, int: true });

  const id = cryptoUuid();
  const now = dbNowUtc();

  // Default cupos por tipo si no vienen
  let defaultMaxSimultaneos = 1;
  if (tipo === 'semipersonalizado') defaultMaxSimultaneos = 5;
  if (tipo === 'grupal') defaultMaxSimultaneos = 15;

  const plan = {
    id: id,
    nombre: nombre,
    descripcion: payload.descripcion || '',
    tipo: tipo,
    num_sesiones: numSesiones,
    precio: precio,
    moneda: moneda,
    vigencia_dias: vigenciaDias,
    entrenador_id: payload.entrenadorId
      ? vUuid(payload.entrenadorId, 'entrenadorId')
      : '',
    sede_id: payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '',
    cupos_max_simultaneos: payload.cuposMaxSimultaneos != null
      ? Math.max(1, Number(payload.cuposMaxSimultaneos))
      : defaultMaxSimultaneos,
    cupos_estricto: payload.cuposEstricto != null
      ? Boolean(payload.cuposEstricto)
      : (tipo === 'personalizado'),
    estado: 'active',
    created_at: now,
    updated_at: now,
    created_by: ctx.userId,
  };

  dbInsert('planes_catalogo', plan);
  auditOk(ctx.userId, 'create_plan_catalogo', 'planes_catalogo', id,
    '', JSON.stringify(plan), ctx.reqMeta);
  return { plan: plan };
}

function adminUpdatePlanCatalogo(payload, ctx) {
  admin_requireAdmin_(ctx);
  const planId = vUuid(vRequired(payload.planId, 'planId'), 'planId');
  const before = dbFindById('planes_catalogo', planId);
  if (!before) throw _err('NOT_FOUND', 'Plan no encontrado');

  const patch = {};
  if ('nombre' in payload) patch.nombre = payload.nombre;
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('precio' in payload) patch.precio = Number(payload.precio);
  if ('numSesiones' in payload) patch.num_sesiones = Number(payload.numSesiones);
  if ('vigenciaDias' in payload) patch.vigencia_dias = Number(payload.vigenciaDias);
  if ('moneda' in payload) patch.moneda = payload.moneda;
  if ('estado' in payload) patch.estado = payload.estado;
  if ('cuposMaxSimultaneos' in payload) {
    patch.cupos_max_simultaneos = Math.max(1, Number(payload.cuposMaxSimultaneos));
  }
  if ('cuposEstricto' in payload) {
    patch.cupos_estricto = Boolean(payload.cuposEstricto);
  }
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('planes_catalogo', planId, patch);
  auditOk(ctx.userId, 'update_plan_catalogo', 'planes_catalogo', planId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { plan: updated };
}

// ──────────────────────────────────────────────────────────────────────────
// Asignar plan a usuario
// ──────────────────────────────────────────────────────────────────────────

function adminAssignPlanToUser(payload, ctx) {
  admin_requireAdmin_(ctx);

  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  const planCatalogoId = vUuid(vRequired(payload.planCatalogoId, 'planCatalogoId'),
    'planCatalogoId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.rol !== 'client') throw _err('NOT_CLIENT', 'Solo se asignan planes a clientes');

  const cat = dbFindById('planes_catalogo', planCatalogoId);
  if (!cat) throw _err('NOT_FOUND', 'Plan en catálogo no encontrado');
  if (cat.estado !== 'active') throw _err('PLAN_INACTIVE', 'Plan no está activo en catálogo');

  // ¿Hay un plan activo previo? Algunos casos requieren cancelar el viejo;
  // por defecto lo dejamos pero advertimos.
  const previos = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId && p.estado === 'active';
  });

  const trainerId = payload.entrenadorId
    ? vUuid(payload.entrenadorId, 'entrenadorId')
    : (cat.entrenador_id || user.entrenador_asignado_id || '');
  const sedeId = payload.sedeId
    ? vUuid(payload.sedeId, 'sedeId')
    : (cat.sede_id || '');

  const id = cryptoUuid();
  const now = dbNowUtc();
  const fechaCompra = payload.fechaCompraUtc
    ? vIsoDate(payload.fechaCompraUtc, 'fechaCompraUtc')
    : now;
  const fechaVenc = dbAddHours(fechaCompra, Number(cat.vigencia_dias) * 24);

  const planUsuario = {
    id: id,
    user_id: userId,
    plan_catalogo_id: planCatalogoId,
    entrenador_id: trainerId,
    sede_id: sedeId,
    fecha_compra_utc: fechaCompra,
    fecha_vencimiento_utc: fechaVenc,
    sesiones_totales: Number(cat.num_sesiones),
    sesiones_consumidas: 0,
    precio_pagado: payload.precioPagado != null ? Number(payload.precioPagado) : Number(cat.precio),
    moneda: payload.moneda || cat.moneda || 'COP',
    estado: 'active',
    transferido_a: '', transferido_at: '', transferido_por: '',
    notas: payload.notas || '',
    created_at: now,
    updated_at: now,
  };

  dbInsert('planes_usuario', planUsuario);

  // Si el cliente no tenía entrenador asignado, asignárselo del plan
  if (!user.entrenador_asignado_id && trainerId) {
    dbUpdateById('usuarios', userId, {
      entrenador_asignado_id: trainerId,
      updated_at: now,
    });
  }

  auditOk(ctx.userId, 'assign_plan_to_user', 'planes_usuario', id,
    '', JSON.stringify(planUsuario), ctx.reqMeta);

  return {
    plan: planUsuario,
    advertencia: previos.length > 0
      ? 'El usuario ya tenía ' + previos.length + ' plan(es) activo(s). Considera cancelarlos.'
      : null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Listar trainers (helper para forms)
// ──────────────────────────────────────────────────────────────────────────

function adminListTrainers(_payload, ctx) {
  admin_requireAdmin_(ctx);
  const trainers = dbListAll('usuarios', function (u) {
    return u.rol === 'trainer' && u.estado === 'active';
  });
  trainers.sort(function (a, b) {
    return String(a.nombres || '').localeCompare(String(b.nombres || ''));
  });
  return trainers.map(function (t) {
    return {
      id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick, email: t.email,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Audit log viewer — solo admin
// ──────────────────────────────────────────────────────────────────────────

function adminListAuditLog(payload, ctx) {
  admin_requireAdmin_(ctx);
  const limit = payload && payload.limit
    ? Math.min(500, Math.max(1, Number(payload.limit)))
    : 100;

  const userIdFilter = payload && payload.userId ? String(payload.userId) : null;
  const entidadFilter = payload && payload.entidad ? String(payload.entidad) : null;
  const resultadoFilter = payload && payload.resultado ? String(payload.resultado) : null;

  const all = dbListAll('auditoria', function (a) {
    if (userIdFilter && a.user_id !== userIdFilter) return false;
    if (entidadFilter && a.entidad !== entidadFilter) return false;
    if (resultadoFilter && a.resultado !== resultadoFilter) return false;
    return true;
  });

  all.sort(function (a, b) {
    return String(b.created_at_utc).localeCompare(String(a.created_at_utc));
  });

  const userCache = {};
  function lookupUserName(id) {
    if (!id) return '';
    if (id in userCache) return userCache[id];
    const u = dbFindById('usuarios', id);
    userCache[id] = u
      ? (String(u.nombres || '') + ' ' + String(u.apellidos || '')).trim() || u.email
      : '';
    return userCache[id];
  }

  return {
    items: all.slice(0, limit).map(function (r) {
      return {
        id: r.id,
        createdAt: r.created_at_utc,
        userId: r.user_id,
        userName: lookupUserName(r.user_id),
        accion: r.accion,
        entidad: r.entidad,
        entidadId: r.entidad_id,
        resultado: r.resultado,
        errorMsg: r.error_msg,
        ip: r.ip,
        userAgent: r.user_agent,
      };
    }),
    totalReturned: Math.min(all.length, limit),
    totalMatch: all.length,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// gimnasios.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * gimnasios.gs — Endpoints de gimnasios (Bodytech, SmartFit, etc).
 *
 * Iteración 10. Solo Admin crea/edita. Trainers ven la lista pública para
 * asignar sedes. Si su gimnasio no está, hacen una solicitud (solicitudes.gs).
 */

// ──────────────────────────────────────────────────────────────────────────
// Lista pública — accesible para cualquier usuario autenticado
// ──────────────────────────────────────────────────────────────────────────

function gimnasiosListPublic(_payload, _ctx) {
  const all = dbListAll('gimnasios', function (g) {
    return g.estado === 'active';
  });
  all.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });
  return all.map(function (g) {
    return {
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion,
      logo_url: g.logo_url,
      pais: g.pais,
      verificado: g.verificado === true || g.verificado === 'TRUE',
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Admin — CRUD
// ──────────────────────────────────────────────────────────────────────────

function adminListGimnasios(_payload, ctx) {
  admin_requireAdmin_(ctx);
  const all = dbListAll('gimnasios', function () { return true; });
  all.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  // Enriquecer con conteo de sedes
  return all.map(function (g) {
    const sedesCount = dbListAll('sedes', function (s) {
      return s.gimnasio_id === g.id && s.estado === 'active';
    }).length;
    return Object.assign({}, g, { sedesCount: sedesCount });
  });
}

function adminCreateGimnasio(payload, ctx) {
  admin_requireAdmin_(ctx);
  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 120 });

  // Validar unicidad por nombre (case-insensitive)
  const existing = dbListAll('gimnasios', function (g) {
    return String(g.nombre || '').toLowerCase() === nombre.toLowerCase();
  });
  if (existing.length > 0) {
    throw _err('GIMNASIO_EXISTS', 'Ya existe un gimnasio con ese nombre');
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  const gym = {
    id: id,
    nombre: nombre,
    descripcion: payload.descripcion || '',
    logo_url: payload.logoUrl || '',
    pais: payload.pais || 'Colombia',
    verificado: payload.verificado === true,
    estado: 'active',
    created_at: now,
    updated_at: now,
    created_by: ctx.userId,
  };
  dbInsert('gimnasios', gym);

  auditOk(ctx.userId, 'create_gimnasio', 'gimnasio', id, '', JSON.stringify(gym), ctx.reqMeta);
  return { gimnasio: gym };
}

function adminUpdateGimnasio(payload, ctx) {
  admin_requireAdmin_(ctx);
  const gymId = vUuid(vRequired(payload.gimnasioId, 'gimnasioId'), 'gimnasioId');
  const before = dbFindById('gimnasios', gymId);
  if (!before) throw _err('NOT_FOUND', 'Gimnasio no encontrado');

  const patch = {};
  if ('nombre' in payload) patch.nombre = payload.nombre;
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('logoUrl' in payload) patch.logo_url = payload.logoUrl;
  if ('pais' in payload) patch.pais = payload.pais;
  if ('verificado' in payload) patch.verificado = payload.verificado === true;
  if ('estado' in payload) patch.estado = payload.estado;
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('gimnasios', gymId, patch);
  auditOk(ctx.userId, 'update_gimnasio', 'gimnasio', gymId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { gimnasio: updated };
}


// ═══════════════════════════════════════════════════════════════════════
// solicitudes.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * solicitudes.gs — Solicitudes de creación de gimnasios y sedes.
 *
 * Iteración 10. Los entrenadores piden, el admin aprueba o rechaza.
 * Cuando se aprueba `crear_gimnasio` se crea la entidad en `gimnasios`.
 * Cuando se aprueba `crear_sede` se crea la entidad en `sedes`.
 */

// Tipos válidos para solicitudes (Iter 10)
const SOLICITUD_TYPES_NEW = ['crear_gimnasio', 'crear_sede'];

// ──────────────────────────────────────────────────────────────────────────
// Crear solicitud — trainer / admin / super_admin
// ──────────────────────────────────────────────────────────────────────────

function solicitudesCreate(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin pueden crear solicitudes');
  }

  const tipo = vEnum(payload.tipo, 'tipo', SOLICITUD_TYPES_NEW);
  const datos = payload.datos && typeof payload.datos === 'object' ? payload.datos : {};

  // Validación específica por tipo
  if (tipo === 'crear_gimnasio') {
    vString(vRequired(datos.nombre, 'datos.nombre'), 'datos.nombre', { min: 2, max: 120 });
    if (!Array.isArray(datos.sedes) || datos.sedes.length === 0) {
      throw _err('VALIDATION', 'Debes incluir al menos una sede');
    }
    for (let i = 0; i < datos.sedes.length; i++) {
      vString(vRequired(datos.sedes[i].nombre, 'datos.sedes[' + i + '].nombre'),
        'datos.sedes[' + i + '].nombre', { min: 2, max: 120 });
    }
  } else if (tipo === 'crear_sede') {
    if (!datos.gimnasioId) {
      throw _err('VALIDATION', 'Debes especificar el gimnasio al que pertenece la sede');
    }
    vUuid(datos.gimnasioId, 'datos.gimnasioId');
    vString(vRequired(datos.nombre, 'datos.nombre'), 'datos.nombre', { min: 2, max: 120 });
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  dbInsert('solicitudes', {
    id: id,
    tipo: tipo,
    user_id: ctx.userId,
    target_id: tipo === 'crear_sede' ? String(datos.gimnasioId) : '',
    datos: datos,
    estado: 'pending',
    resuelta_por: '',
    resuelta_at_utc: '',
    motivo_resolucion: '',
    created_at: now,
  });

  auditOk(ctx.userId, 'create_solicitud', 'solicitud', id,
    '', JSON.stringify({ tipo: tipo }), ctx.reqMeta);

  return {
    ok: true,
    solicitudId: id,
    estado: 'pending',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Listar — trainer ve las suyas, admin ve todas (con filtro)
// ──────────────────────────────────────────────────────────────────────────

function solicitudesList(payload, ctx) {
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const filterEstado = payload && payload.estado ? String(payload.estado) : null;

  const all = dbListAll('solicitudes', function (s) {
    if (!isAdmin && s.user_id !== ctx.userId) return false;
    if (filterEstado && s.estado !== filterEstado) return false;
    if (SOLICITUD_TYPES_NEW.indexOf(String(s.tipo)) === -1) return false;
    return true;
  });

  all.sort(function (a, b) {
    return String(b.created_at).localeCompare(String(a.created_at));
  });

  // Enriquecer con datos del solicitante (admin necesita verlo)
  const userCache = {};
  function lookupUser(id) {
    if (!id) return null;
    if (id in userCache) return userCache[id];
    const u = dbFindById('usuarios', id);
    userCache[id] = u
      ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, email: u.email }
      : null;
    return userCache[id];
  }

  return all.map(function (s) {
    return Object.assign({}, s, {
      solicitante: lookupUser(s.user_id),
      resuelto_por_user: lookupUser(s.resuelta_por),
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Resolver (aprobar / rechazar) — solo admin
// ──────────────────────────────────────────────────────────────────────────

function solicitudesResolve(payload, ctx) {
  admin_requireAdmin_(ctx);

  const solicitudId = vUuid(vRequired(payload.solicitudId, 'solicitudId'), 'solicitudId');
  const accion = vEnum(payload.accion, 'accion', ['approve', 'reject']);
  const motivo = payload.motivo ? vString(payload.motivo, 'motivo', { max: 500 }) : '';

  const sol = dbFindById('solicitudes', solicitudId);
  if (!sol) throw _err('NOT_FOUND', 'Solicitud no encontrada');
  if (sol.estado !== 'pending') {
    throw _err('INVALID_STATE', 'Esta solicitud ya fue resuelta');
  }

  const now = dbNowUtc();
  let createdEntity = null;

  if (accion === 'approve') {
    if (sol.tipo === 'crear_gimnasio') {
      createdEntity = solicitudes_approveCreateGimnasio_(sol, ctx);
    } else if (sol.tipo === 'crear_sede') {
      createdEntity = solicitudes_approveCreateSede_(sol, ctx);
    } else {
      throw _err('UNSUPPORTED', 'Tipo de solicitud no soportado para auto-aprobación');
    }
  }

  dbUpdateById('solicitudes', solicitudId, {
    estado: accion === 'approve' ? 'approved' : 'rejected',
    resuelta_por: ctx.userId,
    resuelta_at_utc: now,
    motivo_resolucion: motivo,
  });

  // Crear alerta al solicitante
  alerts_create_({
    userId: sol.user_id,
    tipo: accion === 'approve' ? 'sistema_anuncio' : 'sistema_anuncio',
    severidad: accion === 'approve' ? 'info' : 'warn',
    titulo: accion === 'approve'
      ? 'Tu solicitud fue aprobada'
      : 'Tu solicitud fue rechazada',
    descripcion: motivo
      ? motivo
      : (accion === 'approve'
        ? 'Ya está disponible en la plataforma.'
        : 'Contáctanos si tienes preguntas.'),
    accionUrl: '/solicitudes',
    entidadRef: solicitudId,
  });

  auditOk(ctx.userId, 'resolve_solicitud', 'solicitud', solicitudId,
    '', JSON.stringify({ accion: accion }), ctx.reqMeta);

  return {
    ok: true,
    estado: accion === 'approve' ? 'approved' : 'rejected',
    createdEntity: createdEntity,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers para aprobar tipos específicos
// ──────────────────────────────────────────────────────────────────────────

function solicitudes_approveCreateGimnasio_(sol, ctx) {
  const datos = typeof sol.datos === 'object' ? sol.datos : JSON.parse(sol.datos || '{}');
  const now = dbNowUtc();

  // Crear gimnasio
  const gymId = cryptoUuid();
  dbInsert('gimnasios', {
    id: gymId,
    nombre: String(datos.nombre || '').trim(),
    descripcion: datos.descripcion || '',
    logo_url: '',
    pais: datos.pais || 'Colombia',
    verificado: false,
    estado: 'active',
    created_at: now,
    updated_at: now,
    created_by: ctx.userId,
  });

  // Crear las sedes asociadas
  const createdSedes = [];
  if (Array.isArray(datos.sedes)) {
    for (let i = 0; i < datos.sedes.length; i++) {
      const sd = datos.sedes[i];
      const sedeId = cryptoUuid();
      dbInsert('sedes', {
        id: sedeId,
        nombre: String(sd.nombre || '').trim(),
        codigo_interno: sd.codigo_interno || '',
        direccion: sd.direccion || '',
        ciudad: sd.ciudad || '',
        barrio: sd.barrio || '',
        telefono: sd.telefono || '',
        responsable: sd.responsable || '',
        horarios: sd.horarios || {},
        capacidad: sd.capacidad || '',
        observaciones: sd.observaciones || '',
        servicios: Array.isArray(sd.servicios) ? sd.servicios.join(',') : (sd.servicios || ''),
        reglas: sd.reglas || '',
        estado: 'active',
        gimnasio_id: gymId,
        created_at: now,
        updated_at: now,
      });
      createdSedes.push({ id: sedeId, nombre: sd.nombre });
    }
  }

  return { gimnasioId: gymId, sedes: createdSedes };
}

function solicitudes_approveCreateSede_(sol, ctx) {
  const datos = typeof sol.datos === 'object' ? sol.datos : JSON.parse(sol.datos || '{}');
  const now = dbNowUtc();

  const sedeId = cryptoUuid();
  dbInsert('sedes', {
    id: sedeId,
    nombre: String(datos.nombre || '').trim(),
    codigo_interno: datos.codigo_interno || '',
    direccion: datos.direccion || '',
    ciudad: datos.ciudad || '',
    barrio: datos.barrio || '',
    telefono: datos.telefono || '',
    responsable: datos.responsable || '',
    horarios: datos.horarios || {},
    capacidad: datos.capacidad || '',
    observaciones: datos.observaciones || '',
    servicios: Array.isArray(datos.servicios) ? datos.servicios.join(',') : (datos.servicios || ''),
    reglas: datos.reglas || '',
    estado: 'active',
    gimnasio_id: String(datos.gimnasioId || ''),
    created_at: now,
    updated_at: now,
  });

  void ctx;
  return { sedeId: sedeId, gimnasioId: datos.gimnasioId };
}


// ═══════════════════════════════════════════════════════════════════════
// availability.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * availability.gs — Franjas de no-disponibilidad de entrenadores y admin.
 *
 * Iteración 12. Soporta reglas one-off + recurrentes (daily/weekly), tipo
 * Google Calendar pero simplificado: sin RRULE completo.
 *
 * Aplica a:
 *   entity_type='trainer' (entity_id=user_id del trainer)
 *   entity_type='global'  (afecta a TODOS los trainers — solo admin lo usa)
 *
 * El bookingSubmit verifica conflicto con availability_checkConflict_ antes
 * de aceptar un nuevo agendamiento.
 */

const RECURRENCE_TYPES = ['none', 'daily', 'weekly'];
const ENTITY_TYPES = ['trainer', 'global'];
const ONE_DAY_MS = 86400000;

// ──────────────────────────────────────────────────────────────────────────
// Crear / actualizar / borrar
// ──────────────────────────────────────────────────────────────────────────

function availabilityCreate(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }

  const titulo = vString(vRequired(payload.titulo, 'titulo'), 'titulo', { min: 1, max: 120 });
  const fechaInicio = vIsoDate(vRequired(payload.fechaInicioUtc, 'fechaInicioUtc'), 'fechaInicioUtc');
  const fechaFin = vIsoDate(vRequired(payload.fechaFinUtc, 'fechaFinUtc'), 'fechaFinUtc');
  if (new Date(fechaFin) <= new Date(fechaInicio)) {
    throw _err('VALIDATION', 'La fecha fin debe ser posterior al inicio');
  }

  const recurrence = vEnum(payload.recurrence || 'none', 'recurrence', RECURRENCE_TYPES);

  let intervalo = 1;
  if (recurrence !== 'none') {
    intervalo = payload.intervalo
      ? vNumber(payload.intervalo, 'intervalo', { min: 1, max: 52, int: true })
      : 1;
  }

  let diasSemana = '';
  if (recurrence === 'weekly') {
    if (!Array.isArray(payload.diasSemana) || payload.diasSemana.length === 0) {
      throw _err('VALIDATION', 'Para recurrencia semanal, indica al menos un día de la semana');
    }
    diasSemana = payload.diasSemana
      .filter(function (d) { return d >= 0 && d <= 6; })
      .map(function (d) { return String(Number(d)); })
      .join(',');
  }

  const fechaFinRecurrencia = payload.fechaFinRecurrenciaUtc
    ? vIsoDate(payload.fechaFinRecurrenciaUtc, 'fechaFinRecurrenciaUtc')
    : '';

  // entity scope
  let entityType, entityId;
  if (ctx.role === 'admin' || ctx.role === 'super_admin') {
    entityType = vEnum(payload.entityType || 'global', 'entityType', ENTITY_TYPES);
    entityId = payload.entityId ? vUuid(payload.entityId, 'entityId') : '';
    if (entityType === 'trainer' && !entityId) {
      throw _err('VALIDATION', 'Para entity_type=trainer debe venir entityId');
    }
  } else {
    // trainer crea solo para sí mismo
    entityType = 'trainer';
    entityId = ctx.userId;
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  const rule = {
    id: id,
    entity_type: entityType,
    entity_id: entityId,
    titulo: titulo,
    descripcion: payload.descripcion || '',
    fecha_inicio_utc: fechaInicio,
    fecha_fin_utc: fechaFin,
    recurrence: recurrence,
    dias_semana: diasSemana,
    intervalo: intervalo,
    fecha_fin_recurrencia: fechaFinRecurrencia,
    estado: 'active',
    created_at: now,
    updated_at: now,
    created_by: ctx.userId,
  };

  dbInsert('unavailability', rule);
  auditOk(ctx.userId, 'create_unavailability', 'unavailability', id,
    '', JSON.stringify({ titulo: titulo, recurrence: recurrence }), ctx.reqMeta);
  return { rule: rule };
}

function availabilityUpdate(payload, ctx) {
  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const before = dbFindById('unavailability', id);
  if (!before) throw _err('NOT_FOUND', 'Franja no encontrada');

  // Permisos
  if (ctx.role === 'trainer' && before.entity_id !== ctx.userId) {
    throw _err('FORBIDDEN', 'No es tu franja');
  }
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Sin permiso');
  }

  const patch = {};
  if ('titulo' in payload) patch.titulo = vString(payload.titulo, 'titulo', { min: 1, max: 120 });
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('fechaInicioUtc' in payload) patch.fecha_inicio_utc = vIsoDate(payload.fechaInicioUtc, 'fechaInicioUtc');
  if ('fechaFinUtc' in payload) patch.fecha_fin_utc = vIsoDate(payload.fechaFinUtc, 'fechaFinUtc');
  if ('recurrence' in payload) patch.recurrence = vEnum(payload.recurrence, 'recurrence', RECURRENCE_TYPES);
  if ('intervalo' in payload) patch.intervalo = Number(payload.intervalo) || 1;
  if ('diasSemana' in payload) {
    patch.dias_semana = Array.isArray(payload.diasSemana)
      ? payload.diasSemana.map(Number).join(',')
      : (payload.diasSemana || '');
  }
  if ('fechaFinRecurrenciaUtc' in payload) {
    patch.fecha_fin_recurrencia = payload.fechaFinRecurrenciaUtc || '';
  }
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('unavailability', id, patch);
  auditOk(ctx.userId, 'update_unavailability', 'unavailability', id,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { rule: updated };
}

function availabilityDelete(payload, ctx) {
  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const item = dbFindById('unavailability', id);
  if (!item) throw _err('NOT_FOUND', 'Franja no encontrada');

  if (ctx.role === 'trainer' && item.entity_id !== ctx.userId) {
    throw _err('FORBIDDEN', 'No es tu franja');
  }
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Sin permiso');
  }

  dbUpdateById('unavailability', id, { estado: 'archived', updated_at: dbNowUtc() });
  auditOk(ctx.userId, 'delete_unavailability', 'unavailability', id, '', '', ctx.reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Listar reglas
// ──────────────────────────────────────────────────────────────────────────

function availabilityList(payload, ctx) {
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isTrainer = ctx.role === 'trainer';
  const isClient = ctx.role === 'client';

  // Filtros opcionales
  const filterEntityId = payload && payload.entityId ? String(payload.entityId) : null;

  // Si es cliente, calcular su entrenador asignado para mostrar la availability
  let clientTrainerId = null;
  if (isClient) {
    const me = dbFindById('usuarios', ctx.userId);
    clientTrainerId = me ? me.entrenador_asignado_id : null;
  }

  return dbListAll('unavailability', function (u) {
    if (u.estado !== 'active') return false;
    if (!isAdmin) {
      if (isTrainer) {
        // Trainer ve solo sus propias franjas + globales
        if (u.entity_type === 'trainer' && u.entity_id !== ctx.userId) return false;
      } else if (isClient) {
        // Cliente ve solo las de su entrenador asignado + globales
        if (u.entity_type === 'trainer' && u.entity_id !== clientTrainerId) return false;
      } else {
        return false;
      }
    }
    if (filterEntityId) {
      if (u.entity_type === 'trainer' && u.entity_id !== filterEntityId) return false;
    }
    return true;
  });
}

/**
 * Devuelve las reglas expandidas en el rango [fromUtc, toUtc] como eventos
 * concretos para mostrar en el calendario.
 */
function availabilityExpanded(payload, ctx) {
  const fromUtc = vIsoDate(vRequired(payload.fromUtc, 'fromUtc'), 'fromUtc');
  const toUtc = vIsoDate(vRequired(payload.toUtc, 'toUtc'), 'toUtc');
  const filterEntityId = payload.entityId ? String(payload.entityId) : null;

  const rules = availabilityList({ entityId: filterEntityId }, ctx);

  // Cache de nombres de trainers (admin necesita verlo en la franja)
  const trainerNameCache = {};
  function lookupTrainerName(id) {
    if (!id) return '';
    if (id in trainerNameCache) return trainerNameCache[id];
    const u = dbFindById('usuarios', id);
    trainerNameCache[id] = u
      ? (String(u.nombres || '') + ' ' + String(u.apellidos || '')).trim()
      : '';
    return trainerNameCache[id];
  }

  const events = [];
  for (let i = 0; i < rules.length; i++) {
    const occs = availability_expand_(rules[i], fromUtc, toUtc);
    const trainerName = rules[i].entity_type === 'trainer'
      ? lookupTrainerName(rules[i].entity_id)
      : '';
    for (let j = 0; j < occs.length; j++) {
      events.push({
        ruleId: rules[i].id,
        titulo: rules[i].titulo,
        descripcion: rules[i].descripcion,
        entityType: rules[i].entity_type,
        entityId: rules[i].entity_id,
        trainerName: trainerName,
        recurrence: rules[i].recurrence,
        start: occs[j].start,
        end: occs[j].end,
      });
    }
  }
  return events;
}

// ──────────────────────────────────────────────────────────────────────────
// Verificación de conflicto — usado por bookings.gs
// ──────────────────────────────────────────────────────────────────────────

/**
 * Verifica si el booking propuesto cae dentro de alguna franja de
 * no-disponibilidad del trainer (o global).
 * @return {Object|null} la regla en conflicto, o null si no hay
 */
function availability_checkConflict_(trainerId, fechaInicioUtc, durationMin) {
  const bStart = new Date(fechaInicioUtc).getTime();
  const bEnd = bStart + (Number(durationMin) || 60) * 60000;

  const rules = dbListAll('unavailability', function (u) {
    if (u.estado !== 'active') return false;
    if (u.entity_type === 'trainer' && u.entity_id === trainerId) return true;
    if (u.entity_type === 'global') return true;
    return false;
  });

  if (rules.length === 0) return null;

  // Expandir solo en el rango cercano al booking
  const fromUtc = new Date(bStart - 7 * ONE_DAY_MS).toISOString();
  const toUtc = new Date(bEnd + 7 * ONE_DAY_MS).toISOString();

  for (let i = 0; i < rules.length; i++) {
    const occs = availability_expand_(rules[i], fromUtc, toUtc);
    for (let j = 0; j < occs.length; j++) {
      const oStart = new Date(occs[j].start).getTime();
      const oEnd = new Date(occs[j].end).getTime();
      if (oStart < bEnd && bStart < oEnd) {
        return rules[i];
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Expansión de recurrencia
// ──────────────────────────────────────────────────────────────────────────

function sedeBlocksCreate(payload, ctx) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo admin puede bloquear sedes');
  }

  const sedeId = vUuid(vRequired(payload.sedeId, 'sedeId'), 'sedeId');
  const sede = dbFindById('sedes', sedeId);
  if (!sede) throw _err('NOT_FOUND', 'Sede no encontrada');

  const desdeUtc = vIsoDate(vRequired(payload.desdeUtc, 'desdeUtc'), 'desdeUtc');
  const hastaUtc = vIsoDate(vRequired(payload.hastaUtc, 'hastaUtc'), 'hastaUtc');
  if (new Date(hastaUtc) <= new Date(desdeUtc)) {
    throw _err('VALIDATION', 'La fecha fin debe ser posterior al inicio');
  }

  const motivo = vString(payload.motivo || 'Sede bloqueada', 'motivo', { max: 300 });
  const id = cryptoUuid();
  const now = dbNowUtc();
  const block = {
    id: id,
    sede_id: sedeId,
    desde_utc: desdeUtc,
    hasta_utc: hastaUtc,
    motivo: motivo,
    creado_por: ctx.userId,
    created_at: now,
  };

  dbInsert('sedes_bloqueos', block);
  auditOk(ctx.userId, 'create_sede_block', 'sedes_bloqueos', id,
    '', JSON.stringify({ sedeId: sedeId, motivo: motivo }), ctx.reqMeta);
  return { block: block };
}

function sedeBlocksUpdate(payload, ctx) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo admin puede editar bloqueos de sede');
  }

  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const before = dbFindById('sedes_bloqueos', id);
  if (!before) throw _err('NOT_FOUND', 'Bloqueo no encontrado');

  const patch = {};
  if ('sedeId' in payload) {
    const sedeId = vUuid(vRequired(payload.sedeId, 'sedeId'), 'sedeId');
    const sede = dbFindById('sedes', sedeId);
    if (!sede) throw _err('NOT_FOUND', 'Sede no encontrada');
    patch.sede_id = sedeId;
  }
  if ('desdeUtc' in payload) patch.desde_utc = vIsoDate(payload.desdeUtc, 'desdeUtc');
  if ('hastaUtc' in payload) patch.hasta_utc = vIsoDate(payload.hastaUtc, 'hastaUtc');
  if ('motivo' in payload) patch.motivo = vString(payload.motivo || 'Sede bloqueada', 'motivo', { max: 300 });

  const nextDesde = patch.desde_utc || before.desde_utc;
  const nextHasta = patch.hasta_utc || before.hasta_utc;
  if (new Date(nextHasta) <= new Date(nextDesde)) {
    throw _err('VALIDATION', 'La fecha fin debe ser posterior al inicio');
  }

  const updated = dbUpdateById('sedes_bloqueos', id, patch);
  auditOk(ctx.userId, 'update_sede_block', 'sedes_bloqueos', id,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { block: updated };
}

function sedeBlocksDelete(payload, ctx) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo admin puede eliminar bloqueos de sede');
  }

  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const block = dbFindById('sedes_bloqueos', id);
  if (!block) throw _err('NOT_FOUND', 'Bloqueo no encontrado');

  const sheet = db_getSheet_('sedes_bloqueos');
  const headers = db_getHeaders_(sheet);
  const pkIdx = headers.indexOf('id');
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][pkIdx]) === String(id)) {
        sheet.deleteRow(i + 2);
        break;
      }
    }
  }

  auditOk(ctx.userId, 'delete_sede_block', 'sedes_bloqueos', id,
    JSON.stringify(block), '', ctx.reqMeta);
  return { ok: true };
}

function sedeBlocksExpanded(payload, ctx) {
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isTrainer = ctx.role === 'trainer';
  const isClient = ctx.role === 'client';
  if (!isAdmin && !isTrainer && !isClient) {
    throw _err('FORBIDDEN', 'Sin permiso');
  }

  const fromUtc = vIsoDate(vRequired(payload.fromUtc, 'fromUtc'), 'fromUtc');
  const toUtc = vIsoDate(vRequired(payload.toUtc, 'toUtc'), 'toUtc');
  const fromTs = new Date(fromUtc).getTime();
  const toTs = new Date(toUtc).getTime();
  const filterSedeId = payload.sedeId ? String(payload.sedeId) : '';

  const allowedSedes = {};
  if (!isAdmin) {
    const sheet = isTrainer ? 'sedes_entrenadores' : 'sedes_usuarios';
    const userCol = isTrainer ? 'entrenador_id' : 'user_id';
    const rows = dbListAll(sheet, function (r) {
      if (String(r[userCol]) !== ctx.userId) return false;
      if (isTrainer && r.estado !== 'active') return false;
      return true;
    });
    for (let i = 0; i < rows.length; i++) {
      allowedSedes[rows[i].sede_id] = true;
    }
  }

  const sedeCache = {};
  function lookupSedeName(id) {
    if (!id) return '';
    if (id in sedeCache) return sedeCache[id];
    const s = dbFindById('sedes', id);
    sedeCache[id] = s ? s.nombre : '';
    return sedeCache[id];
  }

  return dbListAll('sedes_bloqueos', function (b) {
    if (filterSedeId && b.sede_id !== filterSedeId) return false;
    if (!isAdmin && !allowedSedes[b.sede_id]) return false;
    const start = new Date(b.desde_utc).getTime();
    const end = new Date(b.hasta_utc).getTime();
    return start < toTs && fromTs < end;
  }).map(function (b) {
    const sedeName = lookupSedeName(b.sede_id);
    return {
      ruleId: b.id,
      titulo: sedeName ? ('Sede bloqueada: ' + sedeName) : 'Sede bloqueada',
      descripcion: b.motivo,
      entityType: 'sede',
      entityId: b.sede_id,
      sedeName: sedeName,
      start: b.desde_utc,
      end: b.hasta_utc,
    };
  });
}

function sedeBlocks_checkConflict_(sedeId, fechaInicioUtc, durationMin) {
  if (!sedeId) return null;
  const bStart = new Date(fechaInicioUtc).getTime();
  const bEnd = bStart + (Number(durationMin) || 60) * 60000;

  const blocks = dbListAll('sedes_bloqueos', function (b) {
    if (b.sede_id !== sedeId) return false;
    const start = new Date(b.desde_utc).getTime();
    const end = new Date(b.hasta_utc).getTime();
    return start < bEnd && bStart < end;
  });

  return blocks.length > 0 ? blocks[0] : null;
}

function availability_expand_(rule, fromUtc, toUtc) {
  const fromTs = new Date(fromUtc).getTime();
  const toTs = new Date(toUtc).getTime();
  const startTime = new Date(rule.fecha_inicio_utc).getTime();
  const endTime = new Date(rule.fecha_fin_utc).getTime();
  const duration = endTime - startTime;

  if (duration <= 0) return [];

  const recurrence = String(rule.recurrence || 'none');
  const occurrences = [];

  // None: una sola ocurrencia
  if (recurrence === 'none') {
    if (endTime >= fromTs && startTime <= toTs) {
      occurrences.push({
        start: rule.fecha_inicio_utc,
        end: rule.fecha_fin_utc,
      });
    }
    return occurrences;
  }

  const recEndTs = rule.fecha_fin_recurrencia
    ? Math.min(new Date(rule.fecha_fin_recurrencia).getTime(), toTs + duration)
    : toTs + duration;

  const interval = Math.max(1, Number(rule.intervalo) || 1);

  if (recurrence === 'daily') {
    let current = startTime;
    let safety = 0;
    while (current <= recEndTs && safety < 1000) {
      const occEnd = current + duration;
      if (occEnd >= fromTs && current <= toTs) {
        occurrences.push({
          start: new Date(current).toISOString(),
          end: new Date(occEnd).toISOString(),
        });
      }
      current += interval * ONE_DAY_MS;
      safety++;
    }
    return occurrences;
  }

  if (recurrence === 'weekly') {
    const dows = String(rule.dias_semana || '').split(',')
      .map(Number).filter(function (d) { return !isNaN(d) && d >= 0 && d <= 6; });
    if (dows.length === 0) {
      dows.push(new Date(startTime).getUTCDay());
    }

    // Iterar semana a semana desde la primera ocurrencia
    const oneWeek = 7 * ONE_DAY_MS;
    const startDate = new Date(startTime);
    // anchor: domingo de la semana en que cae fecha_inicio
    const anchorWeek = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate() - startDate.getUTCDay(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds()
    ));
    const timeMs = startTime - Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    );

    let weekStart = anchorWeek.getTime();
    let safety = 0;
    while (weekStart <= recEndTs && safety < 200) {
      for (let d = 0; d < dows.length; d++) {
        const dayMidnight = weekStart - timeMs + dows[d] * ONE_DAY_MS;
        const occStart = dayMidnight + timeMs;
        const occEnd = occStart + duration;

        // Solo emitir si la ocurrencia cae después del fecha_inicio original
        if (occStart < startTime) continue;
        if (occStart > recEndTs) continue;

        if (occEnd >= fromTs && occStart <= toTs) {
          occurrences.push({
            start: new Date(occStart).toISOString(),
            end: new Date(occEnd).toISOString(),
          });
        }
      }
      weekStart += interval * oneWeek;
      safety++;
    }
    return occurrences;
  }

  return occurrences;
}


// ═══════════════════════════════════════════════════════════════════════
// grupos.gs
// ═══════════════════════════════════════════════════════════════════════

/**
 * grupos.gs — Grupos de entrenamiento (semipersonalizados / grupales).
 *
 * Iteración 13. Trainer crea grupos y agrega/quita miembros.
 * Cada grupo tiene un color que pinta los agendamientos de sus miembros
 * en el calendario.
 *
 * Permisos:
 *   - Trainer: CRUD solo de sus grupos (entrenador_id === ctx.userId)
 *   - Admin: ve y edita todos
 *   - Cliente: solo lectura de los grupos a los que pertenece
 */

const GROUP_TIPOS = ['semipersonalizado', 'grupal'];

// ──────────────────────────────────────────────────────────────────────────
// Crear / actualizar / archivar
// ──────────────────────────────────────────────────────────────────────────

function gruposCreate(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }

  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 80 });
  const tipo = vEnum(payload.tipo || 'semipersonalizado', 'tipo', GROUP_TIPOS);
  // capacidadMax opcional: 0 o vacío = sin límite. Si viene > 0 limita la
  // cantidad de miembros que se pueden agregar.
  const capacidadMax = payload.capacidadMax
    ? Math.max(0, Number(payload.capacidadMax) | 0)
    : 0;
  const color = grupos_validateColor_(payload.color || '#C8FF3D');

  // El trainer dueño es ctx.userId si rol=trainer; admin puede pasar entrenadorId
  let entrenadorId;
  if (ctx.role === 'trainer') {
    entrenadorId = ctx.userId;
  } else {
    if (!payload.entrenadorId) {
      throw _err('VALIDATION', 'Admin debe especificar entrenadorId');
    }
    entrenadorId = vUuid(payload.entrenadorId, 'entrenadorId');
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  const grupo = {
    id: id,
    nombre: nombre,
    descripcion: payload.descripcion || '',
    entrenador_id: entrenadorId,
    sede_id: payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '',
    tipo: tipo,
    capacidad_max: capacidadMax,
    color: color,
    estado: 'active',
    created_at: now,
    updated_at: now,
  };
  dbInsert('grupos', grupo);
  auditOk(ctx.userId, 'create_grupo', 'grupo', id, '', JSON.stringify(grupo), ctx.reqMeta);
  return { grupo: grupo };
}

function gruposUpdate(payload, ctx) {
  const grupoId = vUuid(vRequired(payload.grupoId, 'grupoId'), 'grupoId');
  const before = dbFindById('grupos', grupoId);
  if (!before) throw _err('NOT_FOUND', 'Grupo no encontrado');
  grupos_requireOwnership_(before, ctx);

  const patch = {};
  if ('nombre' in payload) patch.nombre = vString(payload.nombre, 'nombre', { min: 2, max: 80 });
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('color' in payload) patch.color = grupos_validateColor_(payload.color);
  if ('capacidadMax' in payload) patch.capacidad_max = Number(payload.capacidadMax) || 5;
  if ('sedeId' in payload) patch.sede_id = payload.sedeId ? String(payload.sedeId) : '';
  if ('estado' in payload) patch.estado = payload.estado;
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('grupos', grupoId, patch);
  auditOk(ctx.userId, 'update_grupo', 'grupo', grupoId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { grupo: updated };
}

// ──────────────────────────────────────────────────────────────────────────
// Listar
// ──────────────────────────────────────────────────────────────────────────

function gruposList(payload, ctx) {
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isTrainer = ctx.role === 'trainer';
  const filterEstado = (payload && payload.estado) ? String(payload.estado) : 'active';

  let grupos = dbListAll('grupos', function (g) {
    if (filterEstado && g.estado !== filterEstado) return false;
    if (isAdmin) return true;
    if (isTrainer) return g.entrenador_id === ctx.userId;
    // Cliente: solo grupos a los que pertenece
    const miembros = dbListAll('grupos_miembros', function (m) {
      return m.user_id === ctx.userId && m.grupo_id === g.id && m.estado === 'active';
    });
    return miembros.length > 0;
  });

  grupos.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  // Enriquecer con miembros activos + datos del entrenador
  const userCache = {};
  function lookupUser(id) {
    if (!id) return null;
    if (id in userCache) return userCache[id];
    const u = dbFindById('usuarios', id);
    userCache[id] = u
      ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick }
      : null;
    return userCache[id];
  }

  return grupos.map(function (g) {
    const miembros = dbListAll('grupos_miembros', function (m) {
      return m.grupo_id === g.id && m.estado === 'active';
    }).map(function (m) {
      return Object.assign({}, m, { usuario: lookupUser(m.user_id) });
    });
    return Object.assign({}, g, {
      entrenador: lookupUser(g.entrenador_id),
      miembros: miembros,
      miembrosCount: miembros.length,
    });
  });
}

/**
 * Lista miembros activos de un grupo específico (acceso: trainer dueño o admin).
 */
function gruposListMembers(payload, ctx) {
  const grupoId = vUuid(vRequired(payload.grupoId, 'grupoId'), 'grupoId');
  const grupo = dbFindById('grupos', grupoId);
  if (!grupo) throw _err('NOT_FOUND', 'Grupo no encontrado');
  grupos_requireOwnership_(grupo, ctx);

  const miembros = dbListAll('grupos_miembros', function (m) {
    return m.grupo_id === grupoId && m.estado === 'active';
  });
  return miembros.map(function (m) {
    const u = dbFindById('usuarios', m.user_id);
    return {
      id: m.id,
      user_id: m.user_id,
      fecha_ingreso_utc: m.fecha_ingreso_utc,
      usuario: u
        ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick, email: u.email }
        : null,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Agregar / quitar miembros
// ──────────────────────────────────────────────────────────────────────────

function gruposAddMember(payload, ctx) {
  const grupoId = vUuid(vRequired(payload.grupoId, 'grupoId'), 'grupoId');
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const grupo = dbFindById('grupos', grupoId);
  if (!grupo) throw _err('NOT_FOUND', 'Grupo no encontrado');
  grupos_requireOwnership_(grupo, ctx);

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  if (user.rol !== 'client') throw _err('NOT_CLIENT', 'Solo se agregan clientes a grupos');

  // ¿Ya es miembro activo?
  const existing = dbListAll('grupos_miembros', function (m) {
    return m.grupo_id === grupoId && m.user_id === userId && m.estado === 'active';
  });
  if (existing.length > 0) {
    return { already: true, id: existing[0].id };
  }

  // Verificar capacidad SOLO si está configurada (0 o vacío = sin límite)
  const cap = Number(grupo.capacidad_max) || 0;
  if (cap > 0) {
    const activeCount = dbListAll('grupos_miembros', function (m) {
      return m.grupo_id === grupoId && m.estado === 'active';
    }).length;
    if (activeCount >= cap) {
      throw _err('GROUP_FULL', 'El grupo alcanzó su capacidad máxima');
    }
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  dbInsert('grupos_miembros', {
    id: id,
    grupo_id: grupoId,
    user_id: userId,
    fecha_ingreso_utc: now,
    fecha_salida_utc: '',
    estado: 'active',
  });

  auditOk(ctx.userId, 'add_group_member', 'grupos_miembros', id,
    '', JSON.stringify({ grupoId: grupoId, userId: userId }), ctx.reqMeta);
  return { ok: true, id: id };
}

function gruposRemoveMember(payload, ctx) {
  const memberId = vUuid(vRequired(payload.memberId, 'memberId'), 'memberId');
  const member = dbFindById('grupos_miembros', memberId);
  if (!member) throw _err('NOT_FOUND', 'Miembro no encontrado');

  const grupo = dbFindById('grupos', member.grupo_id);
  if (!grupo) throw _err('NOT_FOUND', 'Grupo no encontrado');
  grupos_requireOwnership_(grupo, ctx);

  dbUpdateById('grupos_miembros', memberId, {
    estado: 'inactive',
    fecha_salida_utc: dbNowUtc(),
  });
  auditOk(ctx.userId, 'remove_group_member', 'grupos_miembros', memberId, '', '', ctx.reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function grupos_requireOwnership_(grupo, ctx) {
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  if (isAdmin) return;
  if (ctx.role === 'trainer' && grupo.entrenador_id === ctx.userId) return;
  throw _err('FORBIDDEN', 'No tienes permiso sobre este grupo');
}

function grupos_validateColor_(color) {
  const s = String(color || '').trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(s)) {
    throw _err('VALIDATION', 'Color debe ser hex de 6 dígitos (#RRGGBB)');
  }
  return s.toLowerCase();
}

/**
 * Devuelve los grupos a los que pertenece un usuario (con color, para
 * pintar agendamientos en calendario). Helper interno de bookings.gs.
 */
function grupos_getUserGroups_(userId) {
  const memberships = dbListAll('grupos_miembros', function (m) {
    return m.user_id === userId && m.estado === 'active';
  });
  if (memberships.length === 0) return [];

  const result = [];
  for (let i = 0; i < memberships.length; i++) {
    const g = dbFindById('grupos', memberships[i].grupo_id);
    if (g && g.estado === 'active') {
      result.push({
        id: g.id,
        nombre: g.nombre,
        color: g.color,
      });
    }
  }
  return result;
}


// ═══════════════════════════════════════════════════════════════════════
// backup.gs
// ═══════════════════════════════════════════════════════════════════════

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

    // ── Dashboard / perfil (Iter 5) ──────────────────────────────────────
    case 'getUserDashboard':
      return dashboardGetUser(payload, ctx);

    case 'getMyPlan':
      return dashboardGetMyPlan(payload, ctx);

    case 'getProfile':
      return dashboardGetProfile(payload, ctx);

    case 'updateProfile':
      return dashboardUpdateProfile(payload, ctx);

    // ── Bookings (Iter 5) ────────────────────────────────────────────────
    case 'createDraftBooking':
      return bookingsCreateDraft(payload, ctx);

    case 'submitBooking':
      return bookingsSubmit(payload, ctx);

    case 'cancelBooking':
      return bookingsCancel(payload, ctx);

    case 'listMyBookings':
      return bookingsListMine(payload, ctx);

    // ── Bookings — acciones del entrenador (Iter 6) ──────────────────────
    case 'confirmBooking':
      return bookingsConfirm(payload, ctx);

    case 'rejectBooking':
      return bookingsReject(payload, ctx);

    case 'registerAttendance':
      return bookingsRegisterAttendance(payload, ctx);

    // ── Trainer (Iter 6) ─────────────────────────────────────────────────
    case 'getTrainerDashboard':
      return trainerGetDashboard(payload, ctx);

    case 'listMyUsers':
      return trainerListMyUsers(payload, ctx);

    case 'listMyWorkLocations':
      return trainerListMyWorkLocations(payload, ctx);

    case 'getUserOperationalProfile':
      return trainerGetUserProfile(payload, ctx);

    // ── Trainer · Metas con tiers (Iter 14) ──────────────────────────────
    case 'getTrainerMetas':
      return trainerGetMetas(payload, ctx);

    case 'listMyMetas':
      return metasListMine(payload, ctx);

    case 'createMyMeta':
      return metasCreate(payload, ctx);

    case 'updateMyMeta':
      return metasUpdate(payload, ctx);

    case 'deleteMyMeta':
      return metasDelete(payload, ctx);

    // ── Admin (Iter 7) ──────────────────────────────────────────────────
    case 'getAdminDashboard':
      return adminGetDashboard(payload, ctx);

    case 'adminListUsers':
      return adminListUsers(payload, ctx);

    case 'adminCreateUser':
      return adminCreateUser(payload, ctx);

    case 'adminUpdateUser':
      return adminUpdateUser(payload, ctx);

    case 'adminGetUserSedes':
      return adminGetUserSedes(payload, ctx);

    case 'adminSetUserSedes':
      return adminSetUserSedes(payload, ctx);

    case 'adminSuspendUser':
      return adminSuspendUser(payload, ctx);

    case 'adminReactivateUser':
      return adminReactivateUser(payload, ctx);

    case 'adminResendActivation':
      return adminResendActivation(payload, ctx);

    case 'adminUpsertTrainerProfile':
      return adminUpsertTrainerProfile(payload, ctx);

    case 'adminGetTrainerProfile':
      return adminGetTrainerProfile(payload, ctx);

    case 'adminListSedes':
      return adminListSedes(payload, ctx);

    case 'adminCreateSede':
      return adminCreateSede(payload, ctx);

    case 'adminUpdateSede':
      return adminUpdateSede(payload, ctx);

    case 'adminAssignTrainerToSede':
      return adminAssignTrainerToSede(payload, ctx);

    case 'adminUnassignTrainerFromSede':
      return adminUnassignTrainerFromSede(payload, ctx);

    case 'adminListPlanesCatalogo':
      return adminListPlanesCatalogo(payload, ctx);

    case 'adminCreatePlanCatalogo':
      return adminCreatePlanCatalogo(payload, ctx);

    case 'adminUpdatePlanCatalogo':
      return adminUpdatePlanCatalogo(payload, ctx);

    case 'adminAssignPlanToUser':
      return adminAssignPlanToUser(payload, ctx);

    case 'adminListTrainers':
      return adminListTrainers(payload, ctx);

    case 'adminListAuditLog':
      return adminListAuditLog(payload, ctx);

    // ── Gimnasios (Iter 10) ──────────────────────────────────────────────
    case 'listGimnasiosPublic':
      return gimnasiosListPublic(payload, ctx);

    case 'adminListGimnasios':
      return adminListGimnasios(payload, ctx);

    case 'adminCreateGimnasio':
      return adminCreateGimnasio(payload, ctx);

    case 'adminUpdateGimnasio':
      return adminUpdateGimnasio(payload, ctx);

    // ── Solicitudes (Iter 10) ────────────────────────────────────────────
    case 'createSolicitud':
      return solicitudesCreate(payload, ctx);

    case 'listSolicitudes':
      return solicitudesList(payload, ctx);

    case 'resolveSolicitud':
      return solicitudesResolve(payload, ctx);

    // ── No-disponibilidad (Iter 12) ──────────────────────────────────────
    case 'createUnavailability':
      return availabilityCreate(payload, ctx);

    case 'updateUnavailability':
      return availabilityUpdate(payload, ctx);

    case 'deleteUnavailability':
      return availabilityDelete(payload, ctx);

    case 'listUnavailability':
      return availabilityList(payload, ctx);

    case 'expandUnavailability':
      return availabilityExpanded(payload, ctx);

    case 'createSedeBlock':
      return sedeBlocksCreate(payload, ctx);

    case 'updateSedeBlock':
      return sedeBlocksUpdate(payload, ctx);

    case 'deleteSedeBlock':
      return sedeBlocksDelete(payload, ctx);

    case 'expandSedeBlocks':
      return sedeBlocksExpanded(payload, ctx);

    // ── Grupos (Iter 13) ─────────────────────────────────────────────────
    case 'createGrupo':
      return gruposCreate(payload, ctx);

    case 'updateGrupo':
      return gruposUpdate(payload, ctx);

    case 'listGrupos':
      return gruposList(payload, ctx);

    case 'listGrupoMembers':
      return gruposListMembers(payload, ctx);

    case 'addGrupoMember':
      return gruposAddMember(payload, ctx);

    case 'removeGrupoMember':
      return gruposRemoveMember(payload, ctx);

    // ── Options (Iter 5) ─────────────────────────────────────────────────
    case 'getBookingOptions':
      return optionsGetBookingOptions(payload, ctx);

    case 'getTrainerBusySlots':
      return optionsGetTrainerBusySlots(payload, ctx);

    case 'getSlotCapacity':
      return bookingsGetSlotCapacity(payload, ctx);

    case 'getSlotStates':
      return bookingsGetSlotStates(payload, ctx);

    // ── Alertas (Iter 5) ─────────────────────────────────────────────────
    case 'listAlerts':
      return alertsListMine(payload, ctx);

    case 'markAlertRead':
      return alertsMarkRead(payload, ctx);

    case 'markAllAlertsRead':
      return alertsMarkAllRead(payload, ctx);

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

  // 3b. Migrar columnas faltantes en hojas existentes (cuando schema se amplía)
  const colsAdded = bootstrap_addMissingColumns_();
  if (colsAdded > 0) {
    Logger.log('✓ Columnas migradas: ' + colsAdded);
  }

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

/**
 * Agrega columnas faltantes a hojas existentes cuando el schema se amplía.
 * Devuelve el número total de columnas agregadas. Idempotente.
 */
function bootstrap_addMissingColumns_() {
  const ss = db_getSpreadsheet_();
  let totalAdded = 0;

  for (const name in SCHEMA) {
    const sh = ss.getSheetByName(name);
    if (!sh) continue; // ya manejado por createMissingSheets

    const expected = SCHEMA[name];
    const lastCol = sh.getLastColumn();
    if (lastCol === 0) continue;

    const actual = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    const missing = expected.filter(function (h) { return actual.indexOf(h) === -1; });
    if (missing.length === 0) continue;

    for (let i = 0; i < missing.length; i++) {
      const col = missing[i];
      const newColIdx = sh.getLastColumn() + 1;
      sh.getRange(1, newColIdx).setValue(col);
      sh.getRange(1, newColIdx)
        .setFontWeight('bold')
        .setBackground('#1F2620')
        .setFontColor('#F2F4EF');
    }

    Logger.log('  ✓ ' + name + ': ' + missing.length + ' col(s) → ' + missing.join(', '));
    totalAdded += missing.length;
  }

  return totalAdded;
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
// seedDevData — crea entrenador + sede + plan + cliente de prueba
// Útil para Iteración 5: el cliente puede agendar antes de que existan UI
// de admin/entrenador para crear estos datos manualmente.
// IDEMPOTENTE — si ya existe el cliente test, solo regenera el activation.
// ──────────────────────────────────────────────────────────────────────────

const SEED_TRAINER = {
  email: 'andrea.entrenadora@alfallo.test',
  nombres: 'Andrea',
  apellidos: 'Gómez',
  nick: 'andrea',
};

const SEED_CLIENT = {
  email: 'cliente.test@alfallo.test',
  nombres: 'Carlos',
  apellidos: 'Prueba',
  nick: 'carlitos',
};

const SEED_SEDE = {
  nombre: 'Sede Norte',
  codigo: 'NOR-01',
  direccion: 'Cra 11 # 90-50',
  ciudad: 'Bogotá',
};

const SEED_PLAN = {
  nombre: '10 sesiones personalizadas',
  descripcion: 'Plan estándar de 10 sesiones, vigencia 60 días',
  tipo: 'personalizado',
  numSesiones: 10,
  precio: 600000,
  vigenciaDias: 60,
};

function seedDevData() {
  Logger.log('=== SEED DEV DATA ===');

  // Necesita PEPPER (bootstrap previo)
  if (!PropertiesService.getScriptProperties().getProperty('PEPPER')) {
    Logger.log('✗ PEPPER no configurado. Ejecuta bootstrap() primero.');
    return;
  }

  const now = dbNowUtc();

  // 1. Trainer
  let trainerId = dbIndexLookup('email', SEED_TRAINER.email);
  if (!trainerId) {
    trainerId = cryptoUuid();
    dbInsert('usuarios', {
      id: trainerId,
      email: SEED_TRAINER.email,
      rol: 'trainer',
      nombres: SEED_TRAINER.nombres,
      apellidos: SEED_TRAINER.apellidos,
      nick: SEED_TRAINER.nick,
      cedula: '', celular: '3001234567', foto_url: '',
      estado: 'active',
      preferencias_notif: { in_app: true, email: true },
      privacidad_fotos: 'solo_yo',
      entrenador_asignado_id: '',
      created_at: now, updated_at: now, last_login_at: '',
      created_by: 'seed',
    });
    dbIndexUpsert('email', SEED_TRAINER.email, trainerId);
    dbIndexUpsert('nick', SEED_TRAINER.nick, trainerId);

    // Hash de password fijo "trainer123" para pruebas (NO usar en prod real)
    const seedPwd = cryptoHashPassword('trainer123');
    dbInsert('usuarios_pwd', {
      user_id: trainerId, salt: seedPwd.salt, hash: seedPwd.hash,
      algoritmo: seedPwd.algoritmo, updated_at: now, forzar_cambio: false,
    });

    // Perfil
    dbInsert('entrenadores_perfil', {
      user_id: trainerId,
      perfil_profesional: 'Entrenadora certificada en funcional y pesas. 5 años de experiencia.',
      habilidades: 'pesas,cardio,funcional',
      tipos_entrenamiento: 'personalizado,semipersonalizado',
      certificaciones: 'NSCA-CPT 2021',
      restricciones: '',
      redes_sociales: { ig: '@andrea.gym' },
      franja_trabajo: { lun: ['06:00-12:00', '15:00-20:00'], mar: ['06:00-12:00'] },
      politica_cancelacion_id: '',
      visibilidad_default: 'nombres_visibles',
      cupos_estrictos: true,
      meta_economica_mensual: 5000000,
      meta_usuarios_activos: 20,
      calificacion_promedio: 0,
      total_calificaciones: 0,
      created_at: now, updated_at: now,
    });

    Logger.log('✓ Trainer creado: ' + SEED_TRAINER.email + ' (password: trainer123)');
  } else {
    Logger.log('• Trainer ya existía');
  }

  // 2. Sede
  const sedesExisting = dbListAll('sedes', function (s) {
    return s.codigo_interno === SEED_SEDE.codigo;
  });
  let sedeId;
  if (sedesExisting.length > 0) {
    sedeId = sedesExisting[0].id;
    Logger.log('• Sede ya existía');
  } else {
    sedeId = cryptoUuid();
    dbInsert('sedes', {
      id: sedeId,
      nombre: SEED_SEDE.nombre,
      codigo_interno: SEED_SEDE.codigo,
      direccion: SEED_SEDE.direccion,
      ciudad: SEED_SEDE.ciudad,
      barrio: 'Chicó',
      telefono: '6011234567',
      responsable: 'Andrea Gómez',
      horarios: { lun: '05:00-22:00', mar: '05:00-22:00', mie: '05:00-22:00', jue: '05:00-22:00', vie: '05:00-22:00', sab: '07:00-14:00' },
      capacidad: 50,
      observaciones: '',
      servicios: 'pesas,cardio,funcional',
      reglas: 'Toalla obligatoria. Limpiar equipo después de usar.',
      estado: 'active',
      created_at: now, updated_at: now,
    });
    Logger.log('✓ Sede creada: ' + SEED_SEDE.nombre);

    // Asignar trainer a sede
    dbInsert('sedes_entrenadores', {
      id: cryptoUuid(),
      sede_id: sedeId,
      entrenador_id: trainerId,
      desde: now, hasta: '', estado: 'active',
    });
  }

  // 3. Plan en catálogo
  const planesExisting = dbListAll('planes_catalogo', function (p) {
    return p.nombre === SEED_PLAN.nombre && p.entrenador_id === trainerId;
  });
  let planCatalogoId;
  if (planesExisting.length > 0) {
    planCatalogoId = planesExisting[0].id;
    Logger.log('• Plan en catálogo ya existía');
  } else {
    planCatalogoId = cryptoUuid();
    dbInsert('planes_catalogo', {
      id: planCatalogoId,
      nombre: SEED_PLAN.nombre,
      descripcion: SEED_PLAN.descripcion,
      tipo: SEED_PLAN.tipo,
      num_sesiones: SEED_PLAN.numSesiones,
      precio: SEED_PLAN.precio,
      moneda: 'COP',
      vigencia_dias: SEED_PLAN.vigenciaDias,
      entrenador_id: trainerId,
      sede_id: sedeId,
      estado: 'active',
      created_at: now, updated_at: now,
      created_by: 'seed',
    });
    Logger.log('✓ Plan en catálogo creado: ' + SEED_PLAN.nombre);
  }

  // 4. Cliente de prueba
  let clientId = dbIndexLookup('email', SEED_CLIENT.email);
  if (!clientId) {
    clientId = cryptoUuid();
    dbInsert('usuarios', {
      id: clientId,
      email: SEED_CLIENT.email,
      rol: 'client',
      nombres: SEED_CLIENT.nombres,
      apellidos: SEED_CLIENT.apellidos,
      nick: SEED_CLIENT.nick,
      cedula: '', celular: '3009876543', foto_url: '',
      estado: 'pending',
      preferencias_notif: { in_app: true, email: true },
      privacidad_fotos: 'solo_yo',
      entrenador_asignado_id: trainerId,
      created_at: now, updated_at: now, last_login_at: '',
      created_by: 'seed',
    });
    dbIndexUpsert('email', SEED_CLIENT.email, clientId);
    dbIndexUpsert('nick', SEED_CLIENT.nick, clientId);

    // Asignarlo a la sede
    dbInsert('sedes_usuarios', {
      id: cryptoUuid(),
      sede_id: sedeId,
      user_id: clientId,
      principal: true,
      created_at: now,
    });

    // Asignarle el plan
    const fechaCompra = now;
    const fechaVenc = dbAddHours(now, SEED_PLAN.vigenciaDias * 24);
    dbInsert('planes_usuario', {
      id: cryptoUuid(),
      user_id: clientId,
      plan_catalogo_id: planCatalogoId,
      entrenador_id: trainerId,
      sede_id: sedeId,
      fecha_compra_utc: fechaCompra,
      fecha_vencimiento_utc: fechaVenc,
      sesiones_totales: SEED_PLAN.numSesiones,
      sesiones_consumidas: 0,
      precio_pagado: SEED_PLAN.precio,
      moneda: 'COP',
      estado: 'active',
      transferido_a: '', transferido_at: '', transferido_por: '',
      notas: 'Plan asignado por seed',
      created_at: now, updated_at: now,
    });

    Logger.log('✓ Cliente creado: ' + SEED_CLIENT.email);
  } else {
    Logger.log('• Cliente ya existía');
  }

  // 5. Token de activación para el cliente (si no tiene password)
  const clientPwd = dbFindById('usuarios_pwd', clientId);
  if (!clientPwd) {
    const existingTokens = dbListAll('tokens_temporales', function (t) {
      return t.user_id === clientId && t.tipo === 'activation' && !t.used_at
        && new Date(t.expires_at) > new Date();
    });
    let token;
    if (existingTokens.length > 0) {
      token = existingTokens[0].token;
    } else {
      token = cryptoRandomHex(32);
      dbInsert('tokens_temporales', {
        token: token, tipo: 'activation', user_id: clientId,
        created_at: now, expires_at: dbAddHours(now, 24), used_at: '',
      });
    }
    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('🔑 ACTIVAR CLIENTE DE PRUEBA');
    Logger.log('   Email: ' + SEED_CLIENT.email);
    Logger.log('   Link de activación (válido 24h):');
    Logger.log('   https://dyoma-web.github.io/alfallo/#/activate?token=' + token);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('');
  }

  Logger.log('=== SEED COMPLETADO ===');
  return { ok: true, trainerId: trainerId, sedeId: sedeId, planCatalogoId: planCatalogoId, clientId: clientId };
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
