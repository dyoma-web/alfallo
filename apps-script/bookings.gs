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
  if (!lock.tryLock(10_000)) {
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

    // Conflicto: ¿hay otra sesión activa del trainer en ese horario?
    const conflicts = dbListAll('agendamientos', function (b) {
      if (b.entrenador_id !== trainerId) return false;
      if (!['solicitado', 'confirmado', 'pactado'].includes(String(b.estado))) return false;
      return bookings_overlaps_(b.fecha_inicio_utc, Number(b.duracion_min) || 60, fechaInicio, duracionMin);
    });
    if (conflicts.length > 0 && tipo === 'personalizado') {
      throw _bookingErr_('SLOT_TAKEN', 'Ese horario ya no está disponible');
    }

    // Plan: ¿activo y vigente para esa fecha?
    let requireAuth = false;
    let usePlanId = '';
    if (planUsuarioId) {
      const plan = dbFindById('planes_usuario', planUsuarioId);
      if (!plan || plan.user_id !== ctx.userId) {
        throw _bookingErr_('PLAN_INVALID', 'Plan inválido');
      }
      if (plan.estado !== 'active') {
        requireAuth = true;
      } else if (new Date(fechaInicio) > new Date(plan.fecha_vencimiento_utc)) {
        requireAuth = true;
      } else if (Number(plan.sesiones_consumidas) >= Number(plan.sesiones_totales)) {
        requireAuth = true;
      }
      usePlanId = plan.id;
    } else {
      // Sin plan, requiere autorización del entrenador
      requireAuth = true;
    }

    // Snapshot de visibilidad del entrenador al momento de creación
    const trainerProfile = dbFindById('entrenadores_perfil', trainerId);
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
      notas_usuario: notas,
      updated_at: now,
    });

    auditOk(ctx.userId, 'create_booking', 'agendamiento', bookingId,
      before, JSON.stringify({ estado: updated.estado }), ctx.reqMeta);

    return { booking: updated };
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
  const horasParaInicio = (new Date(booking.fecha_inicio_utc).getTime() - Date.now()) / 3_600_000;
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
  const fromTs = fromUtc ? new Date(fromUtc).getTime() : 0;
  const toTs = toUtc ? new Date(toUtc).getTime() : Number.MAX_SAFE_INTEGER;

  const bookings = dbListAll('agendamientos', function (b) {
    if (b.user_id !== userId) return false;
    if (includeStates.indexOf(String(b.estado)) === -1) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    return t >= fromTs && t <= toTs;
  });

  bookings.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Enriquecer con datos del entrenador y sede
  const trainerCache = {};
  const sedeCache = {};
  return bookings.map(function (b) {
    let trainerData = null;
    if (b.entrenador_id) {
      if (!(b.entrenador_id in trainerCache)) {
        const t = dbFindById('usuarios', b.entrenador_id);
        trainerCache[b.entrenador_id] = t
          ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick }
          : null;
      }
      trainerData = trainerCache[b.entrenador_id];
    }
    let sedeData = null;
    if (b.sede_id) {
      if (!(b.sede_id in sedeCache)) {
        const s = dbFindById('sedes', b.sede_id);
        sedeCache[b.sede_id] = s ? { id: s.id, nombre: s.nombre, ciudad: s.ciudad } : null;
      }
      sedeData = sedeCache[b.sede_id];
    }
    return Object.assign({}, b, { entrenador: trainerData, sede: sedeData });
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
  const aE = aS + (Number(aDur) || 60) * 60_000;
  const bS = new Date(bStart).getTime();
  const bE = bS + (Number(bDur) || 60) * 60_000;
  return aS < bE && bS < aE;
}

function bookings_getDraftTtl_() {
  const cfg = dbFindById('config', 'app.draft_booking_ttl_minutes');
  return cfg ? Number(cfg.value) : 10;
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
