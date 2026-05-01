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

    // ── Auth (Iter 4) — stubs ────────────────────────────────────────────
    case 'requestPasswordReset':
      throw _err('NOT_IMPLEMENTED', 'requestPasswordReset llega en Iteración 4');

    case 'resetPassword':
      throw _err('NOT_IMPLEMENTED', 'resetPassword llega en Iteración 4');

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
