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

  // #10 granularidad: trainer solo puede agregar a grupos a clientes que
  // gestiona directamente (assigned o professional). Sede compartida es solo lectura.
  if (ctx.role === 'trainer') {
    const accessMap = trainer_getAccessibleClientMap_(ctx.userId);
    const access = accessMap[userId];
    if (!access || !trainer_canManageClient_(access.kind)) {
      throw _err('FORBIDDEN',
        'Solo puedes agregar al grupo a afiliados asignados directamente o por relación profesional.');
    }
  }

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
