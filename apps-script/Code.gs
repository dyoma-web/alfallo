/**
 * Code.gs — Entry point del Web App. Router de doGet / doPost.
 *
 * Convención de request (todo en body, ver docs/01-arquitectura.md §6):
 *   {
 *     "action":  "loginUser" | "ping" | ...,
 *     "payload": {...},
 *     "token":   "session-token-aqui"   // solo para acciones autenticadas
 *   }
 *
 * Convención de response:
 *   éxito → { "result": <obj> }
 *   error → { "error": { "code": "STR", "message": "..." } }
 */

// Acciones que NO requieren autenticación (whitelist explícita).
const PUBLIC_ACTIONS = [
  'ping',
  'loginUser',
  'activateAccount',
  'requestPasswordReset',
  'resetPassword',
];

// ──────────────────────────────────────────────────────────────────────────
// HTTP entry points
// ──────────────────────────────────────────────────────────────────────────

function doGet(e) {
  // GET solo expone ping para testing rápido en el navegador.
  return _respondJson({ result: _handleAction('ping', {}, null, _reqMeta(e)) });
}

function doPost(e) {
  let body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (parseErr) {
    return _respondJson({ error: { code: 'BAD_JSON', message: 'Body inválido (JSON malformado)' } });
  }

  const action  = body.action || '';
  const payload = body.payload || {};
  const token   = body.token || null;
  const reqMeta = _reqMeta(e);

  try {
    const result = _handleAction(action, payload, token, reqMeta);
    return _respondJson({ result: result });
  } catch (err) {
    Logger.log('[' + action + '] ' + err.name + ': ' + err.message + '\n' + (err.stack || ''));
    return _respondJson({
      error: {
        code: err.code || (err.name === 'ValidationError' ? 'VALIDATION' : 'INTERNAL'),
        message: err.message || 'Error interno',
        field: err.field,
      },
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────────────────────────────────

function _handleAction(action, rawPayload, token, reqMeta) {
  if (!action) throw _err('MISSING_ACTION', 'Falta la acción');

  const isPublic = PUBLIC_ACTIONS.indexOf(action) !== -1;
  let ctx = { reqMeta: reqMeta };

  if (!isPublic) {
    const session = authValidateSession(token);
    ctx.userId = session.userId;
    ctx.role = session.role;
    ctx.user = session.user;
    ctx.token = session.sessionToken;
  }

  // Validar payload
  const payload = validatePayload(action, rawPayload);

  // Despachar
  switch (action) {

    // ── Sistema ──────────────────────────────────────────────────────────
    case 'ping':
      return { pong: true, time: dbNowUtc(), version: '0.1.0' };

    // ── Auth (Iter 3) ────────────────────────────────────────────────────
    case 'loginUser':
      return authLogin(payload, reqMeta);

    case 'logoutUser':
      return authLogout(payload, ctx);

    case 'activateAccount':
      return authActivateAccount(payload, reqMeta);

    case 'requestPasswordReset':
      return authRequestPasswordReset(payload, reqMeta);

    case 'resetPassword':
      return authResetPassword(payload, reqMeta);

    // ── Dashboard / perfil (Iter 5) ──────────────────────────────────────
    case 'getUserDashboard':
      return dashboardGetUser(payload, ctx);

    case 'getMyPlan':
      return dashboardGetMyPlan(payload, ctx);

    case 'getProfile':
      return dashboardGetProfile(payload, ctx);

    case 'updateProfile':
      return dashboardUpdateProfile(payload, ctx);

    // ── Bookings (Iter 5) ────────────────────────────────────────────────
    case 'createDraftBooking':
      return bookingsCreateDraft(payload, ctx);

    case 'submitBooking':
      return bookingsSubmit(payload, ctx);

    case 'cancelBooking':
      return bookingsCancel(payload, ctx);

    case 'listMyBookings':
      return bookingsListMine(payload, ctx);

    // ── Bookings — acciones del entrenador (Iter 6) ──────────────────────
    case 'confirmBooking':
      return bookingsConfirm(payload, ctx);

    case 'rejectBooking':
      return bookingsReject(payload, ctx);

    case 'registerAttendance':
      return bookingsRegisterAttendance(payload, ctx);

    // ── Trainer (Iter 6) ─────────────────────────────────────────────────
    case 'getTrainerDashboard':
      return trainerGetDashboard(payload, ctx);

    case 'listMyUsers':
      return trainerListMyUsers(payload, ctx);

    case 'listMyWorkLocations':
      return trainerListMyWorkLocations(payload, ctx);

    case 'getUserOperationalProfile':
      return trainerGetUserProfile(payload, ctx);

    // ── Trainer · Metas con tiers (Iter 14) ──────────────────────────────
    case 'getTrainerMetas':
      return trainerGetMetas(payload, ctx);

    case 'listMyMetas':
      return metasListMine(payload, ctx);

    case 'createMyMeta':
      return metasCreate(payload, ctx);

    case 'updateMyMeta':
      return metasUpdate(payload, ctx);

    case 'deleteMyMeta':
      return metasDelete(payload, ctx);

    // ── Admin (Iter 7) ──────────────────────────────────────────────────
    case 'getAdminDashboard':
      return adminGetDashboard(payload, ctx);

    case 'adminListUsers':
      return adminListUsers(payload, ctx);

    case 'adminCreateUser':
      return adminCreateUser(payload, ctx);

    case 'adminUpdateUser':
      return adminUpdateUser(payload, ctx);

    case 'adminSuspendUser':
      return adminSuspendUser(payload, ctx);

    case 'adminReactivateUser':
      return adminReactivateUser(payload, ctx);

    case 'adminResendActivation':
      return adminResendActivation(payload, ctx);

    case 'adminUpsertTrainerProfile':
      return adminUpsertTrainerProfile(payload, ctx);

    case 'adminGetTrainerProfile':
      return adminGetTrainerProfile(payload, ctx);

    case 'adminListSedes':
      return adminListSedes(payload, ctx);

    case 'adminCreateSede':
      return adminCreateSede(payload, ctx);

    case 'adminUpdateSede':
      return adminUpdateSede(payload, ctx);

    case 'adminAssignTrainerToSede':
      return adminAssignTrainerToSede(payload, ctx);

    case 'adminUnassignTrainerFromSede':
      return adminUnassignTrainerFromSede(payload, ctx);

    case 'adminListPlanesCatalogo':
      return adminListPlanesCatalogo(payload, ctx);

    case 'adminCreatePlanCatalogo':
      return adminCreatePlanCatalogo(payload, ctx);

    case 'adminUpdatePlanCatalogo':
      return adminUpdatePlanCatalogo(payload, ctx);

    case 'adminAssignPlanToUser':
      return adminAssignPlanToUser(payload, ctx);

    case 'adminListTrainers':
      return adminListTrainers(payload, ctx);

    case 'adminListAuditLog':
      return adminListAuditLog(payload, ctx);

    // ── Gimnasios (Iter 10) ──────────────────────────────────────────────
    case 'listGimnasiosPublic':
      return gimnasiosListPublic(payload, ctx);

    case 'adminListGimnasios':
      return adminListGimnasios(payload, ctx);

    case 'adminCreateGimnasio':
      return adminCreateGimnasio(payload, ctx);

    case 'adminUpdateGimnasio':
      return adminUpdateGimnasio(payload, ctx);

    // ── Solicitudes (Iter 10) ────────────────────────────────────────────
    case 'createSolicitud':
      return solicitudesCreate(payload, ctx);

    case 'listSolicitudes':
      return solicitudesList(payload, ctx);

    case 'resolveSolicitud':
      return solicitudesResolve(payload, ctx);

    // ── No-disponibilidad (Iter 12) ──────────────────────────────────────
    case 'createUnavailability':
      return availabilityCreate(payload, ctx);

    case 'updateUnavailability':
      return availabilityUpdate(payload, ctx);

    case 'deleteUnavailability':
      return availabilityDelete(payload, ctx);

    case 'listUnavailability':
      return availabilityList(payload, ctx);

    case 'expandUnavailability':
      return availabilityExpanded(payload, ctx);

    case 'createSedeBlock':
      return sedeBlocksCreate(payload, ctx);

    case 'updateSedeBlock':
      return sedeBlocksUpdate(payload, ctx);

    case 'deleteSedeBlock':
      return sedeBlocksDelete(payload, ctx);

    case 'expandSedeBlocks':
      return sedeBlocksExpanded(payload, ctx);

    // ── Grupos (Iter 13) ─────────────────────────────────────────────────
    case 'createGrupo':
      return gruposCreate(payload, ctx);

    case 'updateGrupo':
      return gruposUpdate(payload, ctx);

    case 'listGrupos':
      return gruposList(payload, ctx);

    case 'listGrupoMembers':
      return gruposListMembers(payload, ctx);

    case 'addGrupoMember':
      return gruposAddMember(payload, ctx);

    case 'removeGrupoMember':
      return gruposRemoveMember(payload, ctx);

    // ── Options (Iter 5) ─────────────────────────────────────────────────
    case 'getBookingOptions':
      return optionsGetBookingOptions(payload, ctx);

    case 'getTrainerBusySlots':
      return optionsGetTrainerBusySlots(payload, ctx);

    case 'getSlotCapacity':
      return bookingsGetSlotCapacity(payload, ctx);

    // ── Alertas (Iter 5) ─────────────────────────────────────────────────
    case 'listAlerts':
      return alertsListMine(payload, ctx);

    case 'markAlertRead':
      return alertsMarkRead(payload, ctx);

    case 'markAllAlertsRead':
      return alertsMarkAllRead(payload, ctx);

    // ── Default ──────────────────────────────────────────────────────────
    default:
      throw _err('UNKNOWN_ACTION', 'Acción desconocida: ' + action);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function _respondJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _err(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

/**
 * Extrae metadata útil del evento. Apps Script da acceso muy limitado a
 * headers — no hay IP real ni user-agent. Lo que se pueda capturar.
 */
function _reqMeta(e) {
  const meta = { ip: '', user_agent: '' };
  if (!e) return meta;
  // Apps Script no expone headers HTTP. Solo parámetros de query.
  if (e.parameter && e.parameter.ua) meta.user_agent = String(e.parameter.ua).slice(0, 200);
  return meta;
}
