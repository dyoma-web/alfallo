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

// ──────────────────────────────────────────────────────────────────────────
// listMyMetas — metas del trainer logueado en un periodo
// ──────────────────────────────────────────────────────────────────────────

function metasListMine(payload, ctx) {
  Logger.log('[DEBUG metasListMine] payload=' + JSON.stringify(payload) + ' userId=' + ctx.userId + ' role=' + ctx.role); // DEBUG
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const periodo = metas_normalizePeriod_(payload && payload.period);
  const trainerId = ctx.userId;
  Logger.log('[DEBUG metasListMine] periodo resuelto=' + periodo + ' trainerId=' + trainerId); // DEBUG

  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId && m.periodo === periodo;
  });
  Logger.log('[DEBUG metasListMine] items.length=' + items.length); // DEBUG
  items.sort(function (a, b) {
    return String(a.created_at).localeCompare(String(b.created_at));
  });

  return {
    period: periodo,
    items: items.map(function (m) {
      return {
        id: m.id,
        profesionalId: m.profesional_id,
        periodo: m.periodo,
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
  Logger.log('[DEBUG metasCreate] payload=' + JSON.stringify(payload) + ' userId=' + ctx.userId + ' role=' + ctx.role); // DEBUG
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;
  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 80 });
  const tipo = vEnum(payload.tipo, 'tipo', META_TIPOS);
  const valor = vNumber(vRequired(payload.valor, 'valor'), 'valor', { min: 0 });
  const periodo = metas_normalizePeriod_(payload.period);
  Logger.log('[DEBUG metasCreate] validados nombre=' + nombre + ' tipo=' + tipo + ' valor=' + valor + ' periodo=' + periodo); // DEBUG

  const dup = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && m.periodo === periodo
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
  Logger.log('[DEBUG metasCreate] insertado id=' + id); // DEBUG

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
      const dup = dbListAll('metas_profesional', function (m) {
        return m.profesional_id === before.profesional_id
          && m.periodo === before.periodo
          && m.id !== id
          && String(m.nombre).toLowerCase() === nuevoNombre.toLowerCase();
      });
      if (dup.length > 0) {
        throw _err('META_DUPLICATE', 'Ya tienes una meta con ese nombre en ' + before.periodo);
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
      && m.periodo === periodo
      && m.tipo === 'economica';
  });
  return items.reduce(function (sum, m) {
    return sum + (Number(m.valor) || 0);
  }, 0);
}

function metas_getTotalUsuarios_(trainerId, periodo) {
  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId
      && m.periodo === periodo
      && m.tipo === 'usuarios';
  });
  return items.reduce(function (sum, m) {
    return sum + (Number(m.valor) || 0);
  }, 0);
}

// ──────────────────────────────────────────────────────────────────────────
// DEBUG — ejecutar desde el editor para diagnosticar el flujo CRUD aislado.
// Usa el email de Andrea (seedDevData) o el primer trainer activo. Crea +
// lista + actualiza + borra una meta de prueba. Imprime cada paso.
// QUITAR esta función cuando se resuelva el problema.
// ──────────────────────────────────────────────────────────────────────────
function metas_debugTest() {
  Logger.log('=== METAS DEBUG TEST ===');

  // 0. Verificar que la hoja existe
  try {
    const sh = db_getSheet_('metas_profesional');
    Logger.log('✓ Hoja metas_profesional existe. Filas actuales: ' + sh.getLastRow());
  } catch (e) {
    Logger.log('✗ Hoja metas_profesional NO existe: ' + e.message);
    Logger.log('  → Ejecuta bootstrap() primero para crearla.');
    return { ok: false, reason: 'sheet_missing' };
  }

  // 1. Resolver un trainerId real
  let trainerId = dbIndexLookup('email', 'andrea.entrenadora@alfallo.test');
  if (!trainerId) {
    const trainers = dbListAll('usuarios', function (u) {
      return u.rol === 'trainer' && u.estado === 'active';
    });
    if (trainers.length === 0) {
      Logger.log('✗ No hay ningún trainer activo en el sheet.');
      return { ok: false, reason: 'no_trainer' };
    }
    trainerId = trainers[0].id;
    Logger.log('• Usando trainer: ' + trainers[0].email);
  } else {
    Logger.log('• Usando trainer seed: andrea.entrenadora@alfallo.test');
  }

  const ctx = { userId: trainerId, role: 'trainer', reqMeta: {} };

  // 2. CREATE
  Logger.log('--- CREATE ---');
  let createdId;
  try {
    const created = metasCreate({
      nombre: '__debug_test_' + Date.now(),
      tipo: 'economica',
      valor: 12345,
    }, ctx);
    createdId = created.meta.id;
    Logger.log('✓ CREATE ok id=' + createdId);
  } catch (e) {
    Logger.log('✗ CREATE FALLÓ: ' + e.message);
    return { ok: false, reason: 'create_failed', error: e.message };
  }

  // 3. LIST
  Logger.log('--- LIST ---');
  try {
    const list = metasListMine({}, ctx);
    Logger.log('✓ LIST ok period=' + list.period + ' items=' + list.items.length);
    Logger.log('  contenido: ' + JSON.stringify(list.items));
  } catch (e) {
    Logger.log('✗ LIST FALLÓ: ' + e.message);
  }

  // 4. UPDATE
  Logger.log('--- UPDATE ---');
  try {
    const upd = metasUpdate({ id: createdId, valor: 99999 }, ctx);
    Logger.log('✓ UPDATE ok valor=' + upd.meta.valor);
  } catch (e) {
    Logger.log('✗ UPDATE FALLÓ: ' + e.message);
  }

  // 5. DELETE
  Logger.log('--- DELETE ---');
  try {
    metasDelete({ id: createdId }, ctx);
    Logger.log('✓ DELETE ok (limpieza completa)');
  } catch (e) {
    Logger.log('✗ DELETE FALLÓ: ' + e.message);
  }

  Logger.log('=== FIN DEBUG TEST ===');
  return { ok: true };
}
