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
