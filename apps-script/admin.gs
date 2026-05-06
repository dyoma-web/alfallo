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

function admin_requirePlanCatalogAccess_(ctx) {
  if (ctx.role !== 'admin' && ctx.role !== 'super_admin' && ctx.role !== 'trainer') {
    throw _err('FORBIDDEN', 'Solo administracion y profesionales pueden ver planes');
  }
}

function admin_isAdminRole_(ctx) {
  return ctx.role === 'admin' || ctx.role === 'super_admin';
}

function adminListPlanesCatalogo(payload, ctx) {
  admin_requirePlanCatalogAccess_(ctx);
  const isAdmin = admin_isAdminRole_(ctx);
  const includeArchived = payload && payload.includeArchived === true;
  const planes = dbListAll('planes_catalogo', function () { return true; });
  let visible = planes.filter(function (p) {
    if (!includeArchived && p.estado === 'archived') return false;
    const alcance = p.alcance || (p.owner_id ? 'personalizado' : 'global');
    if (isAdmin) return true;
    return alcance === 'global' || p.owner_id === ctx.userId || p.created_by === ctx.userId;
  });
  visible.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  return visible.map(function (p) {
    const owner = p.owner_id ? dbFindById('usuarios', p.owner_id) : null;
    const s = p.sede_id ? dbFindById('sedes', p.sede_id) : null;
    const g = p.gimnasio_id ? dbFindById('gimnasios', p.gimnasio_id)
      : (s && s.gimnasio_id ? dbFindById('gimnasios', s.gimnasio_id) : null);
    return Object.assign({}, p, {
      alcance: p.alcance || (p.owner_id ? 'personalizado' : 'global'),
      owner: owner ? { id: owner.id, nombres: owner.nombres, apellidos: owner.apellidos } : null,
      entrenador: owner ? { id: owner.id, nombres: owner.nombres, apellidos: owner.apellidos } : null,
      sede: s ? { id: s.id, nombre: s.nombre } : null,
      gimnasio: g ? { id: g.id, nombre: g.nombre } : null,
    });
  });
}

function adminCreatePlanCatalogo(payload, ctx) {
  admin_requirePlanCatalogAccess_(ctx);
  const isAdmin = admin_isAdminRole_(ctx);

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
  const alcance = isAdmin
    ? vEnum(payload.alcance || 'global', 'alcance', ['global', 'personalizado'])
    : 'personalizado';
  const ownerId = alcance === 'personalizado' ? ctx.userId : '';
  const gimnasioId = payload.gimnasioId ? vUuid(payload.gimnasioId, 'gimnasioId') : '';
  const areaProfesional = payload.areaProfesional
    ? vEnum(payload.areaProfesional, 'areaProfesional', ['entrenamiento', 'medica', 'otra'])
    : 'entrenamiento';
  const categoriaProfesional = payload.categoriaProfesional
    ? vEnum(payload.categoriaProfesional, 'categoriaProfesional',
        ['entrenador_personalizado', 'profesor_grupal', 'nutricionista', 'fisio', 'evaluador', 'otro'])
    : (tipo === 'grupal' ? 'profesor_grupal' : 'entrenador_personalizado');

  const plan = {
    id: id,
    nombre: nombre,
    descripcion: payload.descripcion || '',
    tipo: tipo,
    num_sesiones: numSesiones,
    precio: precio,
    moneda: moneda,
    vigencia_dias: vigenciaDias,
    entrenador_id: '',
    sede_id: payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '',
    gimnasio_id: gimnasioId,
    alcance: alcance,
    owner_id: ownerId,
    owner_role: alcance === 'personalizado' ? ctx.role : 'admin',
    area_profesional: areaProfesional,
    categoria_profesional: categoriaProfesional,
    cupos_max_simultaneos: payload.cuposMaxSimultaneos != null
      ? Math.max(1, Number(payload.cuposMaxSimultaneos))
      : defaultMaxSimultaneos,
    cupos_estricto: payload.cuposEstricto != null
      ? Boolean(payload.cuposEstricto)
      : (tipo === 'personalizado'),
    precio_version: 1,
    price_update_mode: 'future_only',
    last_price_update_at: '',
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
  admin_requirePlanCatalogAccess_(ctx);
  const planId = vUuid(vRequired(payload.planId, 'planId'), 'planId');
  const before = dbFindById('planes_catalogo', planId);
  if (!before) throw _err('NOT_FOUND', 'Plan no encontrado');
  const isAdmin = admin_isAdminRole_(ctx);
  const ownerId = before.owner_id || '';
  if (!isAdmin && ownerId !== ctx.userId && before.created_by !== ctx.userId) {
    throw _err('FORBIDDEN', 'Solo puedes editar tus planes personalizados');
  }

  const patch = {};
  if ('nombre' in payload) patch.nombre = payload.nombre;
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('precio' in payload) patch.precio = Number(payload.precio);
  if ('numSesiones' in payload) patch.num_sesiones = Number(payload.numSesiones);
  if ('vigenciaDias' in payload) patch.vigencia_dias = Number(payload.vigenciaDias);
  if ('moneda' in payload) patch.moneda = payload.moneda;
  if ('estado' in payload) patch.estado = payload.estado;
  if ('sedeId' in payload) patch.sede_id = payload.sedeId ? vUuid(payload.sedeId, 'sedeId') : '';
  if ('gimnasioId' in payload) patch.gimnasio_id = payload.gimnasioId ? vUuid(payload.gimnasioId, 'gimnasioId') : '';
  if ('areaProfesional' in payload) {
    patch.area_profesional = vEnum(payload.areaProfesional || 'entrenamiento',
      'areaProfesional', ['entrenamiento', 'medica', 'otra']);
  }
  if ('categoriaProfesional' in payload) {
    patch.categoria_profesional = vEnum(payload.categoriaProfesional || 'otro',
      'categoriaProfesional',
      ['entrenador_personalizado', 'profesor_grupal', 'nutricionista', 'fisio', 'evaluador', 'otro']);
  }
  let priceUpdateMode = null;
  if ('priceUpdateMode' in payload) {
    priceUpdateMode = vEnum(payload.priceUpdateMode || 'future_only',
      'priceUpdateMode', ['future_only', 'global']);
    patch.price_update_mode = priceUpdateMode;
  }
  if ('cuposMaxSimultaneos' in payload) {
    patch.cupos_max_simultaneos = Math.max(1, Number(payload.cuposMaxSimultaneos));
  }
  if ('cuposEstricto' in payload) {
    patch.cupos_estricto = Boolean(payload.cuposEstricto);
  }
  if ('precio' in payload) {
    patch.precio_version = Number(before.precio_version || 1) + 1;
    patch.last_price_update_at = dbNowUtc();
  }
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('planes_catalogo', planId, patch);
  if ('precio' in payload && priceUpdateMode === 'global') {
    const activos = dbListAll('planes_usuario', function (p) {
      return p.plan_catalogo_id === planId && p.estado === 'active';
    });
    for (let i = 0; i < activos.length; i++) {
      dbUpdateById('planes_usuario', activos[i].id, {
        precio_pagado: Number(payload.precio),
        moneda: patch.moneda || before.moneda || 'COP',
        updated_at: dbNowUtc(),
      });
    }
  }
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
