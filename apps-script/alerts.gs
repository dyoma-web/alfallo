/**
 * alerts.gs — Endpoints de alertas + generadores time-driven.
 */

// ──────────────────────────────────────────────────────────────────────────
// Listar alertas del usuario logueado
// ──────────────────────────────────────────────────────────────────────────

function alertsListMine(payload, ctx) {
  const onlyUnread = payload && payload.onlyUnread === true;
  const limit = payload && payload.limit ? vNumber(payload.limit, 'limit', { min: 1, max: 200, int: true }) : 50;

  const list = dbListAll('alertas', function (a) {
    if (a.user_id !== ctx.userId) return false;
    if (onlyUnread && (a.leida === true || a.leida === 'TRUE')) return false;
    if (a.expires_at_utc && new Date(a.expires_at_utc) < new Date()) return false;
    return true;
  });
  list.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return {
    items: list.slice(0, limit),
    totalUnread: list.filter(function (a) {
      return a.leida !== true && a.leida !== 'TRUE';
    }).length,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Marcar como leída
// ──────────────────────────────────────────────────────────────────────────

function alertsMarkRead(payload, ctx) {
  const alertId = vUuid(vRequired(payload.alertId, 'alertId'), 'alertId');
  const alert = dbFindById('alertas', alertId);
  if (!alert) throw _err('NOT_FOUND', 'Alerta no encontrada');
  if (alert.user_id !== ctx.userId) throw _err('FORBIDDEN', 'No es tu alerta');

  if (alert.leida !== true && alert.leida !== 'TRUE') {
    dbUpdateById('alertas', alertId, {
      leida: true,
      leida_at_utc: dbNowUtc(),
    });
  }
  return { ok: true };
}

function alertsMarkAllRead(_payload, ctx) {
  const list = dbListAll('alertas', function (a) {
    return a.user_id === ctx.userId && a.leida !== true && a.leida !== 'TRUE';
  });
  const now = dbNowUtc();
  for (let i = 0; i < list.length; i++) {
    dbUpdateById('alertas', list[i].id, { leida: true, leida_at_utc: now });
  }
  return { count: list.length };
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: crea una alerta (uso interno desde otros módulos)
// ──────────────────────────────────────────────────────────────────────────

function alerts_create_(opts) {
  return dbInsert('alertas', {
    id: cryptoUuid(),
    user_id: opts.userId,
    tipo: opts.tipo,
    severidad: opts.severidad || 'info',
    titulo: opts.titulo,
    descripcion: opts.descripcion || '',
    accion_url: opts.accionUrl || '',
    entidad_ref: opts.entidadRef || '',
    leida: false,
    leida_at_utc: '',
    created_at: dbNowUtc(),
    expires_at_utc: opts.expiresAtUtc || '',
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Triggers time-driven (configurar manualmente desde el editor)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Genera alertas de planes próximos a vencer (≤7 días).
 * Configurar trigger horario.
 */
function alertsGeneratePlanWarnings() {
  const now = new Date();
  const planes = dbListAll('planes_usuario', function (p) {
    return p.estado === 'active' && p.fecha_vencimiento_utc;
  });

  let created = 0;
  for (let i = 0; i < planes.length; i++) {
    const p = planes[i];
    const dias = Math.ceil((new Date(p.fecha_vencimiento_utc) - now) / 86_400_000);

    if (dias <= 0) {
      // Plan vencido — alerta una sola vez (la primera vez que se detecta)
      const ya = dbListAll('alertas', function (a) {
        return a.user_id === p.user_id && a.tipo === 'plan_vencido' && a.entidad_ref === p.id;
      });
      if (ya.length === 0) {
        alerts_create_({
          userId: p.user_id,
          tipo: 'plan_vencido',
          severidad: 'error',
          titulo: 'Tu plan ha vencido',
          descripcion: 'Tu plan venció el ' + new Date(p.fecha_vencimiento_utc).toLocaleDateString('es-CO'),
          accionUrl: '/mi-plan',
          entidadRef: p.id,
        });
        created++;
      }
    } else if (dias <= 7) {
      // Plan próximo a vencer
      const ya = dbListAll('alertas', function (a) {
        return a.user_id === p.user_id && a.tipo === 'plan_por_vencer' && a.entidad_ref === p.id
          && a.leida !== true && a.leida !== 'TRUE';
      });
      if (ya.length === 0) {
        alerts_create_({
          userId: p.user_id,
          tipo: 'plan_por_vencer',
          severidad: 'warn',
          titulo: 'Tu plan vence pronto',
          descripcion: 'En ' + dias + ' día' + (dias === 1 ? '' : 's') + '. Considera renovar.',
          accionUrl: '/mi-plan',
          entidadRef: p.id,
        });
        created++;
      }
    }
  }
  Logger.log('Alertas de planes generadas: ' + created);
  return created;
}

/**
 * Genera alertas de sesiones próximas (próximas 24h).
 * Configurar trigger horario.
 */
function alertsGenerateSessionReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3_600_000);
  const sesiones = dbListAll('agendamientos', function (b) {
    if (!b.fecha_inicio_utc) return false;
    if (b.estado !== 'confirmado' && b.estado !== 'pactado') return false;
    const t = new Date(b.fecha_inicio_utc);
    return t > now && t <= in24h;
  });

  let created = 0;
  for (let i = 0; i < sesiones.length; i++) {
    const s = sesiones[i];
    const ya = dbListAll('alertas', function (a) {
      return a.user_id === s.user_id && a.tipo === 'sesion_24h' && a.entidad_ref === s.id;
    });
    if (ya.length > 0) continue;

    const fecha = new Date(s.fecha_inicio_utc);
    const horaTexto = fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
    });
    alerts_create_({
      userId: s.user_id,
      tipo: 'sesion_24h',
      severidad: 'info',
      titulo: 'Sesión próxima',
      descripcion: 'Tienes una sesión a las ' + horaTexto + '. ¡A entrenar!',
      accionUrl: '/calendario',
      entidadRef: s.id,
    });
    created++;
  }
  Logger.log('Recordatorios de sesión generados: ' + created);
  return created;
}
