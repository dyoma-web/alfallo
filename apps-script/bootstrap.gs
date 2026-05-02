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
