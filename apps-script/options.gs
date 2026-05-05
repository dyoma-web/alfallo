/**
 * options.gs — Endpoints que devuelven listas de opciones para formularios
 * (catálogos para el flujo de agendar).
 */

// ──────────────────────────────────────────────────────────────────────────
// getBookingOptions — retorna trainers + sedes + plan activo del usuario
// ──────────────────────────────────────────────────────────────────────────

function optionsGetBookingOptions(_payload, ctx) {
  const userId = ctx.userId;
  const user = dbFindById('usuarios', userId);
  if (!user) throw _err('NOT_FOUND', 'Usuario no encontrado');

  function sedeOption_(s, relation) {
    return {
      id: s.id,
      nombre: s.nombre,
      codigo: s.codigo_interno,
      ciudad: s.ciudad,
      direccion: s.direccion,
      category: s.categoria_sede || '',
      categoryRank: Number(s.categoria_rank) || 0,
      isBase: relation ? (relation.principal === true || relation.principal === 'TRUE') : false,
    };
  }

  // 1. Entrenadores disponibles para el usuario
  // MVP: el entrenador asignado (si existe) + (futuro) cualquier otro activo
  const trainers = [];
  if (user.entrenador_asignado_id) {
    const t = dbFindById('usuarios', user.entrenador_asignado_id);
    if (t && t.rol === 'trainer' && t.estado === 'active') {
      const profile = dbFindById('entrenadores_perfil', t.id);
      trainers.push({
        id: t.id,
        nombres: t.nombres,
        apellidos: t.apellidos,
        nick: t.nick,
        foto_url: t.foto_url,
        perfilProfesional: profile ? profile.perfil_profesional : '',
        habilidades: profile ? String(profile.habilidades || '').split(',').filter(Boolean) : [],
        tiposEntrenamiento: profile ? String(profile.tipos_entrenamiento || '').split(',').filter(Boolean) : [],
        visibilidadDefault: profile ? profile.visibilidad_default : 'solo_franjas',
        cuposEstrictos: profile ? Boolean(profile.cupos_estrictos) : true,
      });
    }
  }

  // 2. Sedes disponibles
  // MVP: las sedes asignadas al usuario; si no tiene, todas las activas
  let sedes = [];
  const userSedes = dbListAll('sedes_usuarios', function (su) {
    return su.user_id === userId;
  });
  if (userSedes.length > 0) {
    for (let i = 0; i < userSedes.length; i++) {
      const s = dbFindById('sedes', userSedes[i].sede_id);
      if (s && s.estado === 'active') {
        sedes.push(sedeOption_(s, userSedes[i]));
      }
    }
  } else {
    sedes = dbListAll('sedes', function (s) { return s.estado === 'active'; })
      .map(function (s) {
        return sedeOption_(s, null);
      });
  }

  // 3. Plan activo del usuario
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
    planActivo = {
      id: p.id,
      nombre: cat ? cat.nombre : 'Plan',
      tipo: cat ? cat.tipo : '',
      sesionesRestantes: Math.max(0, Number(p.sesiones_totales) - Number(p.sesiones_consumidas)),
      fechaVencimientoUtc: p.fecha_vencimiento_utc,
    };
  }

  return {
    trainers: trainers,
    sedes: sedes,
    planActivo: planActivo,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// getTrainerBusySlots — para el date picker, mostrar conflictos del trainer
// ──────────────────────────────────────────────────────────────────────────

function optionsGetTrainerBusySlots(payload, _ctx) {
  const trainerId = vUuid(vRequired(payload.trainerId, 'trainerId'), 'trainerId');
  const fromUtc = vIsoDate(vRequired(payload.fromUtc, 'fromUtc'), 'fromUtc');
  const toUtc = vIsoDate(vRequired(payload.toUtc, 'toUtc'), 'toUtc');

  const fromTs = new Date(fromUtc).getTime();
  const toTs = new Date(toUtc).getTime();
  const activeStates = ['solicitado', 'confirmado', 'pactado'];

  const busy = dbListAll('agendamientos', function (b) {
    if (b.entrenador_id !== trainerId) return false;
    if (activeStates.indexOf(String(b.estado)) === -1) return false;
    if (!b.fecha_inicio_utc) return false;
    const t = new Date(b.fecha_inicio_utc).getTime();
    return t >= fromTs && t <= toTs;
  });

  return {
    busy: busy.map(function (b) {
      return {
        fechaInicioUtc: b.fecha_inicio_utc,
        duracionMin: Number(b.duracion_min) || 60,
        tipo: b.tipo,
      };
    }),
  };
}
