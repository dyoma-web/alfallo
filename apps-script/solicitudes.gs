/**
 * solicitudes.gs — Solicitudes de creación de gimnasios y sedes.
 *
 * Iteración 10. Los entrenadores piden, el admin aprueba o rechaza.
 * Cuando se aprueba `crear_gimnasio` se crea la entidad en `gimnasios`.
 * Cuando se aprueba `crear_sede` se crea la entidad en `sedes`.
 */

// Tipos válidos para solicitudes (Iter 10)
const SOLICITUD_TYPES_NEW = ['crear_gimnasio', 'crear_sede', 'cambio_plan'];

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
  } else if (tipo === 'cambio_plan') {
    vUuid(vRequired(datos.planId, 'datos.planId'), 'datos.planId');
    vString(vRequired(datos.motivo, 'datos.motivo'), 'datos.motivo', { min: 5, max: 1000 });
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  dbInsert('solicitudes', {
    id: id,
    tipo: tipo,
    user_id: ctx.userId,
    target_id: tipo === 'crear_sede'
      ? String(datos.gimnasioId)
      : (tipo === 'cambio_plan' ? String(datos.planId) : ''),
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
    } else if (sol.tipo === 'cambio_plan') {
      createdEntity = { reviewed: true };
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
