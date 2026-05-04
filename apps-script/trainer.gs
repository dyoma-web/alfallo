/**
 * trainer.gs — Endpoints específicos del entrenador.
 *
 * Iteración 6 · Núcleo Entrenador.
 * Permisos validados en cada función: solo el trainer mismo (o admin)
 * puede acceder a SUS usuarios y sus datos.
 */

// ──────────────────────────────────────────────────────────────────────────
// Dashboard del entrenador — agregado de su día
// ──────────────────────────────────────────────────────────────────────────

function trainerGetDashboard(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;

  const nowDate = new Date();
  const startOfToday = trainer_startOfDayUtc_(nowDate);
  const endOfToday = trainer_endOfDayUtc_(nowDate);
  const sevenDaysFromNow = new Date(nowDate.getTime() + 7 * 86400000);
  const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 86400000);

  // Sesiones de hoy
  const sesionesHoy = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    return t >= startOfToday.getTime() && t < endOfToday.getTime()
      && ['solicitado', 'confirmado', 'pactado', 'completado', 'no-asistido'].indexOf(String(b.estado)) !== -1;
  });
  sesionesHoy.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Solicitudes pendientes (cualquier fecha futura)
  const solicitudesPendientes = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (!b.fecha_inicio_utc) return false;
    if (new Date(b.fecha_inicio_utc) < nowDate) return false;
    return b.estado === 'solicitado' || b.estado === 'requiere_autorizacion';
  });
  solicitudesPendientes.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });

  // Sesiones completadas en últimos 7 días
  const completadasSemana = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (b.estado !== 'completado') return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc);
    return t >= sevenDaysAgo && t <= nowDate;
  });

  // Planes próximos a vencer (≤7 días)
  const planesPorVencer = dbListAll('planes_usuario', function (p) {
    if (p.estado !== 'active') return false;
    if (p.entrenador_id !== trainerId) return false;
    if (!p.fecha_vencimiento_utc) return false;
    const fv = new Date(p.fecha_vencimiento_utc);
    return fv <= sevenDaysFromNow && fv >= nowDate;
  });

  // Usuarios activos asignados a este trainer
  const myUsers = dbListAll('usuarios', function (u) {
    return u.entrenador_asignado_id === trainerId && u.estado === 'active';
  });

  // Enriquecer sesiones con datos del cliente
  const enrichedHoy = sesionesHoy.map(function (b) {
    const u = dbFindById('usuarios', b.user_id);
    return {
      id: b.id,
      fechaInicioUtc: b.fecha_inicio_utc,
      duracionMin: Number(b.duracion_min) || 60,
      tipo: b.tipo,
      estado: b.estado,
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });
  const enrichedPendientes = solicitudesPendientes.slice(0, 10).map(function (b) {
    const u = dbFindById('usuarios', b.user_id);
    return {
      id: b.id,
      fechaInicioUtc: b.fecha_inicio_utc,
      duracionMin: Number(b.duracion_min) || 60,
      estado: b.estado,
      requiereAutorizacion: b.requiere_autorizacion === true || b.requiere_autorizacion === 'TRUE',
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });
  const enrichedPlanesVence = planesPorVencer.slice(0, 10).map(function (p) {
    const u = dbFindById('usuarios', p.user_id);
    const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - nowDate) / 86400000);
    return {
      id: p.id,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      diasRestantes: dias,
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      cliente: u ? { id: u.id, nombres: u.nombres, apellidos: u.apellidos, nick: u.nick } : null,
    };
  });

  return {
    hoyKpi: {
      sesionesHoy: sesionesHoy.length,
      solicitudesPendientes: solicitudesPendientes.length,
      completadasSemana: completadasSemana.length,
      usuariosActivos: myUsers.length,
    },
    sesionesHoy: enrichedHoy,
    solicitudesPendientes: enrichedPendientes,
    planesPorVencer: enrichedPlanesVence,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// listMyUsers — lista de usuarios asignados al trainer
// ──────────────────────────────────────────────────────────────────────────

function trainerListMyUsers(_payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;

  const users = dbListAll('usuarios', function (u) {
    return u.entrenador_asignado_id === trainerId && u.rol === 'client';
  });

  return users.map(function (u) {
    // Plan activo
    const planes = dbListAll('planes_usuario', function (p) {
      return p.user_id === u.id && p.estado === 'active';
    });
    let planActivo = null;
    if (planes.length > 0) {
      planes.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      const p = planes[0];
      const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
      const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - new Date()) / 86400000);
      planActivo = {
        nombre: cat ? cat.nombre : 'Plan',
        sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
        sesionesTotales: Number(p.sesiones_totales),
        fechaVencimientoUtc: p.fecha_vencimiento_utc,
        diasRestantes: dias,
        estadoVisual: dias < 0 ? 'plan-vencido' : dias <= 7 ? 'plan-vence' : 'plan-activo',
      };
    }

    // Próxima sesión
    const futuras = dbListAll('agendamientos', function (b) {
      if (b.user_id !== u.id) return false;
      if (b.entrenador_id !== trainerId) return false;
      if (!b.fecha_inicio_utc) return false;
      if (new Date(b.fecha_inicio_utc) < new Date()) return false;
      return ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'].indexOf(String(b.estado)) !== -1;
    });
    futuras.sort(function (a, b) {
      return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
    });

    return {
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      nick: u.nick,
      foto_url: u.foto_url,
      estado: u.estado,
      planActivo: planActivo,
      proximaSesionUtc: futuras.length > 0 ? futuras[0].fecha_inicio_utc : null,
      proximaSesionEstado: futuras.length > 0 ? futuras[0].estado : null,
    };
  }).sort(function (a, b) {
    // Orden: con próxima sesión asc, luego por nombre
    if (a.proximaSesionUtc && b.proximaSesionUtc) {
      return new Date(a.proximaSesionUtc) - new Date(b.proximaSesionUtc);
    }
    if (a.proximaSesionUtc) return -1;
    if (b.proximaSesionUtc) return 1;
    return String(a.nombres).localeCompare(b.nombres);
  });
}

// ──────────────────────────────────────────────────────────────────────────
// getUserOperationalProfile — vista del entrenador sobre uno de sus clientes
// ──────────────────────────────────────────────────────────────────────────

function trainerGetUserProfile(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const userId = vUuid(vRequired(payload.userId, 'userId'), 'userId');

  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  // Si es trainer, solo puede ver sus usuarios asignados
  if (ctx.role === 'trainer' && user.entrenador_asignado_id !== ctx.userId) {
    throw _err('FORBIDDEN', 'No es tu usuario');
  }

  // Planes
  const planes = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId;
  });
  planes.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const planesShape = planes.map(function (p) {
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    return {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaCompraUtc: p.fecha_compra_utc,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      estado: p.estado,
    };
  });

  // Asistencia reciente (últimas 10)
  const asistencias = dbListAll('asistencia', function (a) {
    return a.user_id === userId;
  });
  asistencias.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const asistenciasShape = asistencias.slice(0, 10).map(function (a) {
    return {
      id: a.id,
      agendamientoId: a.agendamiento_id,
      presente: a.presente === true || a.presente === 'TRUE',
      peso: a.peso,
      observaciones: a.observaciones,
      createdAt: a.created_at,
    };
  });

  // Bookings: próximos y recientes
  const allBookings = dbListAll('agendamientos', function (b) {
    return b.user_id === userId && b.fecha_inicio_utc;
  });
  const now = new Date();
  const proximos = allBookings.filter(function (b) {
    return new Date(b.fecha_inicio_utc) >= now
      && ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'].indexOf(String(b.estado)) !== -1;
  }).sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  }).slice(0, 5);
  const recientes = allBookings.filter(function (b) {
    return new Date(b.fecha_inicio_utc) < now;
  }).sort(function (a, b) {
    return new Date(b.fecha_inicio_utc) - new Date(a.fecha_inicio_utc);
  }).slice(0, 10);

  return {
    user: {
      id: user.id,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      nick: user.nick,
      celular: user.celular,
      foto_url: user.foto_url,
      estado: user.estado,
      privacidad_fotos: user.privacidad_fotos,
    },
    planes: planesShape,
    asistencias: asistenciasShape,
    proximos: proximos,
    recientes: recientes,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// trainerGetMetas — meta económica + tier (Iter 14)
// Periodo default: mes en curso. payload.period = 'YYYY-MM' opcional.
//
// Tiers (umbrales fijos sobre meta económica):
//   base   ≥ 70%   meta   ≥ 100%   elite  ≥ 130%
// Por debajo de 70% → 'pendiente'. Sin meta configurada → 'sin_meta'.
// ──────────────────────────────────────────────────────────────────────────

const TRAINER_METAS_TIERS = {
  base: 0.7,
  meta: 1.0,
  elite: 1.3,
};

function trainerGetMetas(payload, ctx) {
  if (ctx.role !== 'trainer' && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
    throw _err('FORBIDDEN', 'Solo entrenadores y admin');
  }
  const trainerId = ctx.userId;

  const now = new Date();
  const periodInput = payload && payload.period ? String(payload.period) : '';
  const re = /^(\d{4})-(\d{2})$/;
  const match = re.exec(periodInput);
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const monthIdx = match ? Number(match[2]) - 1 : now.getUTCMonth();
  if (monthIdx < 0 || monthIdx > 11) {
    throw _err('VALIDATION', 'period inválido — formato YYYY-MM');
  }
  const periodStart = new Date(Date.UTC(year, monthIdx, 1));
  const periodEnd = new Date(Date.UTC(year, monthIdx + 1, 1));
  const periodLabel = String(year) + '-' + String(monthIdx + 1).padStart(2, '0');

  const perfil = dbFindBy('entrenadores_perfil', 'user_id', trainerId);
  const metaEconomica = perfil ? Number(perfil.meta_economica_mensual) || 0 : 0;
  const metaUsuarios = perfil ? Number(perfil.meta_usuarios_activos) || 0 : 0;

  const planesPeriodo = dbListAll('planes_usuario', function (p) {
    if (p.entrenador_id !== trainerId) return false;
    if (!p.fecha_compra_utc) return false;
    const fc = new Date(p.fecha_compra_utc);
    return fc >= periodStart && fc < periodEnd;
  });
  const acumuladoEconomico = planesPeriodo.reduce(function (sum, p) {
    return sum + (Number(p.precio_pagado) || 0);
  }, 0);

  const usuariosActivos = dbListAll('usuarios', function (u) {
    return u.entrenador_asignado_id === trainerId
      && u.rol === 'client'
      && u.estado === 'active';
  }).length;

  let tier = 'sin_meta';
  let progresoEconomico = 0;
  if (metaEconomica > 0) {
    progresoEconomico = acumuladoEconomico / metaEconomica;
    if (progresoEconomico >= TRAINER_METAS_TIERS.elite) tier = 'elite';
    else if (progresoEconomico >= TRAINER_METAS_TIERS.meta) tier = 'meta';
    else if (progresoEconomico >= TRAINER_METAS_TIERS.base) tier = 'base';
    else tier = 'pendiente';
  }

  return {
    period: periodLabel,
    metaEconomica: metaEconomica,
    acumuladoEconomico: acumuladoEconomico,
    progresoEconomico: progresoEconomico,
    metaUsuarios: metaUsuarios,
    usuariosActivos: usuariosActivos,
    tier: tier,
    tierThresholds: TRAINER_METAS_TIERS,
    planesContados: planesPeriodo.length,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function trainer_startOfDayUtc_(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function trainer_endOfDayUtc_(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
