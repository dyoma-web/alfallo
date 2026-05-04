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
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const periodo = metas_normalizePeriod_(payload && payload.period);
  const trainerId = ctx.userId;

  const items = dbListAll('metas_profesional', function (m) {
    return m.profesional_id === trainerId && m.periodo === periodo;
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
