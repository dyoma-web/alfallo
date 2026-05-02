/**
 * dashboard.gs — Endpoints de lectura para los dashboards.
 *
 * Por ahora cubre dashboard del cliente (Iter 5). Trainer y Admin en Iter 6/7.
 */

// ──────────────────────────────────────────────────────────────────────────
// Dashboard del usuario (cliente)
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetUser(_payload, ctx) {
  const userId = ctx.userId;
  const nowDate = new Date();

  // 1. Próximo entrenamiento (futuro, no cancelado)
  const futurosEstados = ['solicitado', 'confirmado', 'pactado', 'requiere_autorizacion'];
  const futuros = dbListAll('agendamientos', function (b) {
    return b.user_id === userId
      && futurosEstados.indexOf(String(b.estado)) !== -1
      && b.fecha_inicio_utc
      && new Date(b.fecha_inicio_utc) > nowDate;
  });
  futuros.sort(function (a, b) {
    return new Date(a.fecha_inicio_utc) - new Date(b.fecha_inicio_utc);
  });
  const next = futuros[0] || null;

  let proximoEntrenamiento = null;
  if (next) {
    const t = next.entrenador_id ? dbFindById('usuarios', next.entrenador_id) : null;
    const s = next.sede_id ? dbFindById('sedes', next.sede_id) : null;
    proximoEntrenamiento = {
      id: next.id,
      fechaInicioUtc: next.fecha_inicio_utc,
      duracionMin: Number(next.duracion_min) || 60,
      tipo: next.tipo,
      estado: next.estado,
      entrenador: t ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick } : null,
      sede: s ? { id: s.id, nombre: s.nombre, ciudad: s.ciudad } : null,
    };
  }

  // 2. Plan activo
  const planesActivos = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId && p.estado === 'active';
  });
  let planActivo = null;
  if (planesActivos.length > 0) {
    planesActivos.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    const p = planesActivos[0];
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    const restantes = Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas));
    const diasRestantes = Math.ceil(
      (new Date(p.fecha_vencimiento_utc).getTime() - nowDate.getTime()) / 86400000
    );
    let estadoVisual = 'plan-activo';
    if (diasRestantes < 0) estadoVisual = 'plan-vencido';
    else if (diasRestantes <= 7) estadoVisual = 'plan-vence';
    planActivo = {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesRestantes: restantes,
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      diasRestantes: diasRestantes,
      estadoVisual: estadoVisual,
    };
  }

  // 3. Racha de asistencia (sesiones completadas consecutivas, hacia atrás)
  const completadas = dbListAll('agendamientos', function (b) {
    return b.user_id === userId && b.estado === 'completado';
  });
  completadas.sort(function (a, b) {
    return new Date(b.fecha_inicio_utc) - new Date(a.fecha_inicio_utc);
  });
  let racha = 0;
  for (let i = 0; i < completadas.length; i++) {
    const asist = dbFindBy('asistencia', 'agendamiento_id', completadas[i].id);
    if (asist && (asist.presente === true || asist.presente === 'TRUE')) {
      racha++;
    } else if (asist && asist.presente === false) {
      break;
    } else {
      // Sin registro de asistencia — asumimos completada cuenta para racha
      racha++;
    }
  }

  // 4. Alertas no leídas (top 5)
  const alertas = dbListAll('alertas', function (a) {
    return a.user_id === userId && a.leida !== true && a.leida !== 'TRUE';
  });
  alertas.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return {
    proximoEntrenamiento: proximoEntrenamiento,
    planActivo: planActivo,
    racha: racha,
    sesionesCompletadas: completadas.length,
    alertasNoLeidas: alertas.length,
    alertas: alertas.slice(0, 5),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Mi plan (detalle + historial)
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetMyPlan(_payload, ctx) {
  const userId = ctx.userId;
  const planes = dbListAll('planes_usuario', function (p) {
    return p.user_id === userId;
  });
  planes.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const enriquecidos = planes.map(function (p) {
    const cat = dbFindById('planes_catalogo', p.plan_catalogo_id);
    const t = p.entrenador_id ? dbFindById('usuarios', p.entrenador_id) : null;
    return {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      descripcion: cat ? cat.descripcion : '',
      sesionesTotales: Number(p.sesiones_totales),
      sesionesConsumidas: Number(p.sesiones_consumidas),
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaCompraUtc: p.fecha_compra_utc,
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
      precio: Number(p.precio_pagado),
      moneda: p.moneda,
      estado: p.estado,
      entrenador: t ? { id: t.id, nombres: t.nombres, apellidos: t.apellidos, nick: t.nick } : null,
      notas: p.notas,
    };
  });

  return {
    activo: enriquecidos.find(function (p) { return p.estado === 'active'; }) || null,
    historial: enriquecidos,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Perfil — el usuario logueado consulta o actualiza sus datos
// ──────────────────────────────────────────────────────────────────────────

function dashboardGetProfile(_payload, ctx) {
  const user = dbFindById('usuarios', ctx.userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');
  return auth_publicUserShape_(user);
}

function dashboardUpdateProfile(payload, ctx) {
  const allowed = ['nombres', 'apellidos', 'nick', 'celular',
                   'preferencias_notif', 'privacidad_fotos'];
  const patch = {};
  for (let i = 0; i < allowed.length; i++) {
    const k = allowed[i];
    if (k in payload) {
      if (k === 'preferencias_notif' && typeof payload[k] === 'object') {
        patch[k] = payload[k];
      } else if (k === 'nick') {
        patch[k] = vString(payload[k], 'nick', { min: 2, max: 30 });
      } else if (k === 'nombres' || k === 'apellidos') {
        patch[k] = vString(payload[k], k, { min: 1, max: 80 });
      } else if (k === 'celular') {
        patch[k] = vString(payload[k], 'celular', { max: 20 });
      } else if (k === 'privacidad_fotos') {
        patch[k] = vEnum(payload[k], 'privacidad_fotos',
          ['solo_yo', 'mi_entrenador', 'mi_grupo', 'publico']);
      }
    }
  }
  patch.updated_at = dbNowUtc();
  const before = dbFindById('usuarios', ctx.userId);
  const updated = dbUpdateById('usuarios', ctx.userId, patch);

  auditOk(ctx.userId, 'update_profile', 'usuario', ctx.userId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);

  return auth_publicUserShape_(updated);
}
