/**
 * gimnasios.gs — Endpoints de gimnasios (Bodytech, SmartFit, etc).
 *
 * Iteración 10. Solo Admin crea/edita. Trainers ven la lista pública para
 * asignar sedes. Si su gimnasio no está, hacen una solicitud (solicitudes.gs).
 */

// ──────────────────────────────────────────────────────────────────────────
// Lista pública — accesible para cualquier usuario autenticado
// ──────────────────────────────────────────────────────────────────────────

function gimnasiosListPublic(_payload, _ctx) {
  const all = dbListAll('gimnasios', function (g) {
    return g.estado === 'active';
  });
  all.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });
  return all.map(function (g) {
    return {
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion,
      logo_url: g.logo_url,
      pais: g.pais,
      verificado: g.verificado === true || g.verificado === 'TRUE',
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Admin — CRUD
// ──────────────────────────────────────────────────────────────────────────

function adminListGimnasios(_payload, ctx) {
  admin_requireAdmin_(ctx);
  const all = dbListAll('gimnasios', function () { return true; });
  all.sort(function (a, b) {
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  // Enriquecer con conteo de sedes
  return all.map(function (g) {
    const sedesCount = dbListAll('sedes', function (s) {
      return s.gimnasio_id === g.id && s.estado === 'active';
    }).length;
    return Object.assign({}, g, { sedesCount: sedesCount });
  });
}

function adminCreateGimnasio(payload, ctx) {
  admin_requireAdmin_(ctx);
  const nombre = vString(vRequired(payload.nombre, 'nombre'), 'nombre', { min: 2, max: 120 });

  // Validar unicidad por nombre (case-insensitive)
  const existing = dbListAll('gimnasios', function (g) {
    return String(g.nombre || '').toLowerCase() === nombre.toLowerCase();
  });
  if (existing.length > 0) {
    throw _err('GIMNASIO_EXISTS', 'Ya existe un gimnasio con ese nombre');
  }

  const id = cryptoUuid();
  const now = dbNowUtc();
  const gym = {
    id: id,
    nombre: nombre,
    descripcion: payload.descripcion || '',
    logo_url: payload.logoUrl || '',
    pais: payload.pais || 'Colombia',
    verificado: payload.verificado === true,
    estado: 'active',
    created_at: now,
    updated_at: now,
    created_by: ctx.userId,
  };
  dbInsert('gimnasios', gym);

  auditOk(ctx.userId, 'create_gimnasio', 'gimnasio', id, '', JSON.stringify(gym), ctx.reqMeta);
  return { gimnasio: gym };
}

function adminUpdateGimnasio(payload, ctx) {
  admin_requireAdmin_(ctx);
  const gymId = vUuid(vRequired(payload.gimnasioId, 'gimnasioId'), 'gimnasioId');
  const before = dbFindById('gimnasios', gymId);
  if (!before) throw _err('NOT_FOUND', 'Gimnasio no encontrado');

  const patch = {};
  if ('nombre' in payload) patch.nombre = payload.nombre;
  if ('descripcion' in payload) patch.descripcion = payload.descripcion;
  if ('logoUrl' in payload) patch.logo_url = payload.logoUrl;
  if ('pais' in payload) patch.pais = payload.pais;
  if ('verificado' in payload) patch.verificado = payload.verificado === true;
  if ('estado' in payload) patch.estado = payload.estado;
  patch.updated_at = dbNowUtc();

  const updated = dbUpdateById('gimnasios', gymId, patch);
  auditOk(ctx.userId, 'update_gimnasio', 'gimnasio', gymId,
    JSON.stringify(before), JSON.stringify(updated), ctx.reqMeta);
  return { gimnasio: updated };
}
