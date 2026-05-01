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
