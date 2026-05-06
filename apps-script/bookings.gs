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

function bookingsCreateForClientByTrainer(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo profesionales y admin pueden agendar afiliados');
  }

  const trainerId = ctx.role === 'trainer'
    ? ctx.userId
    : vUuid(vRequired(payload.entrenadorId, 'entrenadorId'), 'entrenadorId');
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');
  const fechaInicio = vIsoDate(vRequired(payload.fechaInicioUtc, 'fechaInicioUtc'), 'fechaInicioUtc');
  const tipo = vEnum(payload.tipo || 'personalizado', 'tipo',
    ['personalizado', 'semipersonalizado', 'grupal']);
  const sedeId = payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '';
  const duracionMin = payload.duracionMin
    ? vNumber(payload.duracionMin, 'duracionMin', { min: 15, max: 240, int: true })
    : 60;
  const notas = payload.notas ? vString(payload.notas, 'notas', { max: 500 }) : '';

  const user = dbFindById('usuarios', userId);
  if (!user || user.rol !== 'client' || user.estado !== 'active') {
    throw _bookingErr_('USER_NOT_AVAILABLE', 'El afiliado no esta activo');
  }

  const trainer = dbFindById('usuarios', trainerId);
  if (!trainer || trainer.rol !== 'trainer' || trainer.estado !== 'active') {
    throw _bookingErr_('TRAINER_NOT_AVAILABLE', 'El profesional no esta disponible');
  }

  if (ctx.role === 'trainer') {
    const accessMap = trainer_getAccessibleClientMap_(trainerId);
    const access = accessMap[userId];
    if (!access) {
      throw _bookingErr_('FORBIDDEN', 'Este afiliado no esta asignado a tu perfil');
    }
    // #10 granularidad: sede compartida es solo lectura — no puede agendar.
    if (!trainer_canManageClient_(access.kind)) {
      throw _bookingErr_('FORBIDDEN',
        'Solo puedes agendar a afiliados asignados directamente o por relación profesional. Este cliente solo está visible por sede compartida.');
    }
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw _bookingErr_('SLOT_BUSY', 'El sistema esta ocupado. Intenta en unos segundos.');
  }

  try {
    const trainerProfile = dbFindById('entrenadores_perfil', trainerId);
    // Nota: NO se valida franja_trabajo cuando el trainer/admin agenda
    // directamente. Esa franja restringe lo que el CLIENTE puede solicitar
    // por sí mismo (ver bookingsSubmit), pero el profesional es dueño de
    // su agenda y puede aceptar sesiones fuera de su horario habitual.

    let planUsuarioId = payload.planUsuarioId ? vUuid(payload.planUsuarioId, 'planUsuarioId') : '';
    let planCatalogo = null;
    if (planUsuarioId) {
      const plan = dbFindById('planes_usuario', planUsuarioId);
      if (!plan || plan.user_id !== userId) {
        throw _bookingErr_('PLAN_INVALID', 'Plan invalido para este afiliado');
      }
      if (plan.plan_catalogo_id) planCatalogo = dbFindById('planes_catalogo', plan.plan_catalogo_id);
    } else {
      const activePlans = dbListAll('planes_usuario', function (p) {
        return p.user_id === userId
          && p.estado === 'active'
          && Number(p.sesiones_consumidas) < Number(p.sesiones_totales)
          && (!p.fecha_vencimiento_utc || new Date(fechaInicio) <= new Date(p.fecha_vencimiento_utc));
      });
      activePlans.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      if (activePlans.length > 0) {
        planUsuarioId = activePlans[0].id;
        if (activePlans[0].plan_catalogo_id) {
          planCatalogo = dbFindById('planes_catalogo', activePlans[0].plan_catalogo_id);
        }
      }
    }

    const sameSlotBookings = dbListAll('agendamientos', function (b) {
      if (b.entrenador_id !== trainerId) return false;
      if (b.tipo !== tipo) return false;
      if (['solicitado', 'confirmado', 'pactado'].indexOf(String(b.estado)) === -1) return false;
      return bookings_overlaps_(b.fecha_inicio_utc, Number(b.duracion_min) || 60, fechaInicio, duracionMin);
    });

    const cap = bookings_getCap_(planCatalogo, tipo);
    const stricts = bookings_getCapStrict_(planCatalogo, tipo);
    if (sameSlotBookings.length >= cap && (tipo === 'personalizado' || stricts)) {
      throw _bookingErr_('SLOT_FULL', tipo === 'personalizado'
        ? 'Ese horario ya no esta disponible'
        : 'El cupo de este tipo de sesion esta lleno en esa franja');
    }

    const unavailRule = availability_checkConflict_(trainerId, fechaInicio, duracionMin);
    if (unavailRule) {
      throw _bookingErr_('TRAINER_UNAVAILABLE',
        'El profesional marco esa franja como no-disponible: "' + unavailRule.titulo + '"');
    }

    const sedeBlock = sedeBlocks_checkConflict_(sedeId, fechaInicio, duracionMin);
    if (sedeBlock) {
      throw _bookingErr_('SEDE_BLOCKED',
        'La sede esta bloqueada en esa franja: "' + sedeBlock.motivo + '"');
    }

    const now = dbNowUtc();
    const id = cryptoUuid();
    const booking = dbInsert('agendamientos', {
      id: id,
      user_id: userId,
      entrenador_id: trainerId,
      sede_id: sedeId,
      plan_usuario_id: planUsuarioId,
      grupo_id: '',
      tipo: tipo,
      fecha_inicio_utc: fechaInicio,
      duracion_min: duracionMin,
      capacidad_max: cap,
      estado: 'confirmado',
      color: '',
      visibilidad_nombres: trainerProfile
        ? trainerProfile.visibilidad_default === 'nombres_visibles'
        : false,
      motivo_cancelacion: '',
      cancelado_por: '',
      cancelado_at_utc: '',
      dentro_margen: '',
      requiere_autorizacion: false,
      autorizado_por: ctx.userId,
      autorizado_at_utc: now,
      notas_entrenador: notas,
      notas_usuario: '',
      created_at: now,
      updated_at: now,
      created_by: ctx.userId,
    });

    alerts_create_({
      userId: userId,
      tipo: 'sesion_confirmada',
      severidad: 'info',
      titulo: 'Nueva sesion agendada',
      descripcion: 'Tu profesional agendo una sesion para el ' + new Date(fechaInicio).toLocaleDateString('es-CO',
        { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Bogota' }),
      accionUrl: '/calendario',
      entidadRef: id,
    });

    auditOk(ctx.userId, 'trainer_create_booking', 'agendamiento', id,
      '', JSON.stringify({ estado: booking.estado, userId: userId }), ctx.reqMeta);

    return { booking: booking };
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

  // Política aplicable: la de menor ventana_horas que el cliente NO cumple
  // (escalonamiento). Si las cumple todas, policy=null y no hay mensaje.
  const horasParaInicio = (new Date(booking.fecha_inicio_utc).getTime() - Date.now()) / 3600000;
  const policy = bookings_getApplicablePolicy_(booking, horasParaInicio);
  const ventanaHoras = policy ? Number(policy.ventana_horas) : null;
  const dentroMargen = !policy;  // sin política aplicable = cumplió todos los márgenes

  if (booking.user_id === ctx.userId
      && policy
      && (policy.bloquear_fuera_margen === true || policy.bloquear_fuera_margen === 'TRUE')) {
    throw _bookingErr_('CANCEL_BLOCKED',
      bookings_getCancellationMessage_(policy)
        || 'Ya no es posible cancelar por la cercania de la sesion.');
  }

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
    mensaje: bookings_getCancellationMessage_(policy),
    politicaAplicada: policy ? {
      nombre: policy.nombre,
      ventanaHoras: ventanaHoras,
      bloquearFueraMargen: policy.bloquear_fuera_margen === true || policy.bloquear_fuera_margen === 'TRUE',
    } : null,
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
  if (trainerProfile && trainerProfile.cupos_max_simultaneos) {
    return Math.max(1, Number(trainerProfile.cupos_max_simultaneos));
  }
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

function bookings_getCapStrict_(planCatalogo, _tipo) {
  if (planCatalogo && planCatalogo.cupos_estricto !== '') {
    return planCatalogo.cupos_estricto === true || planCatalogo.cupos_estricto === 'TRUE';
  }
  return true;
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

function bookingsListMyCancellationPolicies(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo profesionales y admin');
  }
  const trainerId = ctx.userId;
  const policies = dbListAll('politicas_cancelacion', function (p) {
    return p.aplica_a === 'trainer' && p.entidad_id === trainerId && p.estado !== 'archived';
  });
  policies.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  return policies;
}

function bookingsSaveMyCancellationPolicy(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo profesionales y admin');
  }
  const trainerId = ctx.userId;
  const id = payload.id ? vUuid(payload.id, 'id') : '';
  const ventanaHoras = vNumber(payload.ventanaHoras || payload.ventana_horas || 12,
    'ventanaHoras', { min: 0, max: 168, int: true });
  const mensaje = vString(vRequired(payload.mensaje, 'mensaje'), 'mensaje', { min: 5, max: 500 });

  // Validar duplicado de ventana_horas para el mismo trainer
  const dup = dbListAll('politicas_cancelacion', function (p) {
    if (p.aplica_a !== 'trainer' || p.entidad_id !== trainerId) return false;
    if (p.estado === 'archived') return false;
    if (id && p.id === id) return false;
    return Number(p.ventana_horas) === ventanaHoras;
  });
  if (dup.length > 0) {
    throw _bookingErr_('POLICY_DUPLICATE',
      'Ya tienes una política con ' + ventanaHoras + ' horas. Usa otra cantidad.');
  }

  const now = dbNowUtc();
  const patch = {
    nombre: vString(payload.nombre || ('Politica ' + ventanaHoras + 'h'),
      'nombre', { min: 2, max: 80 }),
    ventana_horas: ventanaHoras,
    dentro_margen: 'sin_penalizacion',
    fuera_margen: payload.bloquearFueraMargen ? 'bloquea_cancelacion' : 'descuenta_sesion',
    bloquear_fuera_margen: !!payload.bloquearFueraMargen,
    mensaje: mensaje,
    aplica_a: 'trainer',
    entidad_id: trainerId,
    estado: payload.estado === 'inactive' ? 'inactive' : 'active',
    updated_at: now,
  };

  let policy;
  if (id) {
    const current = dbFindById('politicas_cancelacion', id);
    if (!current || current.aplica_a !== 'trainer' || current.entidad_id !== trainerId) {
      throw _bookingErr_('NOT_FOUND', 'Politica no encontrada');
    }
    policy = dbUpdateById('politicas_cancelacion', id, patch);
  } else {
    policy = dbInsert('politicas_cancelacion', Object.assign({
      id: cryptoUuid(),
      created_at: now,
      created_by: trainerId,
    }, patch));
  }

  auditOk(ctx.userId, 'save_cancellation_policy', 'politica_cancelacion', policy.id,
    '', JSON.stringify({ estado: policy.estado, ventanaHoras: ventanaHoras }), ctx.reqMeta);
  return { policy: policy };
}

function bookingsDeleteMyCancellationPolicy(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _bookingErr_('FORBIDDEN', 'Solo profesionales y admin');
  }
  const id = vUuid(vRequired(payload.id, 'id'), 'id');
  const current = dbFindById('politicas_cancelacion', id);
  if (!current) throw _bookingErr_('NOT_FOUND', 'Politica no encontrada');
  if (current.aplica_a !== 'trainer' || current.entidad_id !== ctx.userId) {
    throw _bookingErr_('FORBIDDEN', 'No es tu politica');
  }
  dbUpdateById('politicas_cancelacion', id, {
    estado: 'archived',
    updated_at: dbNowUtc(),
  });
  auditOk(ctx.userId, 'delete_cancellation_policy', 'politica_cancelacion', id,
    '', '', ctx.reqMeta);
  return { ok: true };
}

/**
 * Devuelve la política aplicable: la de menor ventana_horas que el cliente
 * NO cumple. Permite escalonamiento (ej. 12h aviso suave, 2h bloqueo).
 * Si el cliente cumple todas las ventanas, retorna null (sin mensaje).
 *
 * Prioridad de fuente: trainer > sede > global. Dentro de cada fuente, se
 * sortea ASC por ventana_horas y se retorna la primera donde
 * horasParaInicio < ventana_horas.
 */
function bookings_getApplicablePolicy_(booking, horasParaInicio) {
  function pickFromList(list) {
    if (!list || list.length === 0) return null;
    const sorted = list.slice().sort(function (a, b) {
      return Number(a.ventana_horas) - Number(b.ventana_horas);
    });
    for (let i = 0; i < sorted.length; i++) {
      if (Number(horasParaInicio) < Number(sorted[i].ventana_horas)) {
        return sorted[i];
      }
    }
    return null;
  }

  if (booking.entrenador_id) {
    const trainerPolicies = dbListAll('politicas_cancelacion', function (p) {
      return p.aplica_a === 'trainer'
        && p.entidad_id === booking.entrenador_id
        && p.estado === 'active';
    });
    const picked = pickFromList(trainerPolicies);
    if (picked) return picked;
    if (trainerPolicies.length > 0) {
      // Hay políticas pero el cliente cumple todas — sin mensaje específico.
      return null;
    }

    // Fallback a política heredada del perfil (modelo antiguo)
    const tp = dbFindById('entrenadores_perfil', booking.entrenador_id);
    if (tp && tp.politica_cancelacion_id) {
      const p = dbFindById('politicas_cancelacion', tp.politica_cancelacion_id);
      if (p && p.estado === 'active'
          && Number(horasParaInicio) < Number(p.ventana_horas)) {
        return p;
      }
    }
  }
  if (booking.sede_id) {
    const sedePolicies = dbListAll('politicas_cancelacion', function (p) {
      return p.aplica_a === 'sede' && p.entidad_id === booking.sede_id && p.estado === 'active';
    });
    const picked = pickFromList(sedePolicies);
    if (picked) return picked;
    if (sedePolicies.length > 0) return null;
  }
  const globalPolicies = dbListAll('politicas_cancelacion', function (p) {
    return p.aplica_a === 'global' && p.estado === 'active';
  });
  return pickFromList(globalPolicies);
}

function bookings_getCancellationMessage_(policy) {
  if (!policy) return '';
  // Modelo nuevo: campo único `mensaje`. Fallback a campos antiguos para
  // políticas creadas antes de la simplificación.
  return policy.mensaje
    || policy.mensaje_fuera_margen
    || policy.mensaje_dentro_margen
    || policy.mensaje_cumplimiento
    || '';
}

function _bookingErr_(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}
