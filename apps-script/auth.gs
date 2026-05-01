/**
 * auth.gs — Login, logout, validación de sesiones, activación de cuenta.
 *
 * Documento de respaldo: docs/01-arquitectura.md §3
 *
 * Patrón de respuesta:
 *   - éxito:  retorna el objeto resultado
 *   - error:  lanza Error con .code (mapeado por el router a HTTP 4xx/5xx)
 */

// Errores tipados — el router los convierte en respuestas.
function AuthError(code, message) {
  const e = new Error(message || code);
  e.name = 'AuthError';
  e.code = code;
  return e;
}

// ──────────────────────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {{email: string, password: string}} payload — ya validado por validatePayload
 * @param {Object} reqMeta — { ip, user_agent }
 * @return {{token: string, user: Object, role: string, expiresAt: string}}
 */
function authLogin(payload, reqMeta) {
  const userId = dbIndexLookup('email', payload.email);
  if (!userId) {
    auditDenied('', 'login', 'email_not_found:' + payload.email, reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  const user = dbFindById('usuarios', userId);
  if (!user) {
    auditDenied('', 'login', 'user_id_orphan:' + userId, reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  if (user.estado === 'pending') {
    auditDenied(userId, 'login', 'account_pending', reqMeta);
    throw AuthError('ACCOUNT_PENDING', 'Tu cuenta aún no ha sido activada. Revisa tu correo.');
  }
  if (user.estado === 'suspended') {
    auditDenied(userId, 'login', 'account_suspended', reqMeta);
    throw AuthError('ACCOUNT_SUSPENDED', 'Tu cuenta está suspendida. Contacta al equipo.');
  }
  if (user.estado === 'archived') {
    auditDenied(userId, 'login', 'account_archived', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  const pwd = dbFindById('usuarios_pwd', userId);
  if (!pwd) {
    auditDenied(userId, 'login', 'no_password_set', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  if (!cryptoVerifyPassword(payload.password, pwd.salt, pwd.hash)) {
    auditDenied(userId, 'login', 'password_mismatch', reqMeta);
    throw AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  }

  // OK — crear sesión
  const ttlHours = auth_getSessionTtl_();
  const now = dbNowUtc();
  const expiresAt = dbAddHours(now, ttlHours);
  const token = cryptoRandomHex(32);

  dbInsert('sesiones', {
    token: token,
    user_id: user.id,
    rol: user.rol,
    created_at: now,
    expires_at: expiresAt,
    last_seen_at: now,
    user_agent: (reqMeta && reqMeta.user_agent) || '',
    ip: (reqMeta && reqMeta.ip) || '',
    revoked: false,
  });

  // Actualizar last_login_at del usuario
  dbUpdateById('usuarios', user.id, {
    last_login_at: now,
    updated_at: now,
  });

  auditOk(user.id, 'login', 'sesion', token, '', '', reqMeta);

  return {
    token: token,
    user: auth_publicUserShape_(user),
    role: user.rol,
    expiresAt: expiresAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Logout
// ──────────────────────────────────────────────────────────────────────────

function authLogout(_payload, ctx) {
  if (!ctx || !ctx.token) return { ok: true };
  try {
    dbUpdateById('sesiones', ctx.token, {
      revoked: true,
      last_seen_at: dbNowUtc(),
    });
  } catch (e) {
    // si la sesión no existe, no problema — idempotente
  }
  auditOk(ctx.userId || '', 'logout', 'sesion', ctx.token, '', '', ctx.reqMeta);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Validación de sesión — usado por el router para todas las acciones
// que requieren auth
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {string} token
 * @return {{userId, role, user, sessionToken}} — si válida
 * @throws AuthError(UNAUTHORIZED) — si inválida o expirada
 */
function authValidateSession(token) {
  if (!token || typeof token !== 'string') {
    throw AuthError('UNAUTHORIZED', 'Sesión no enviada');
  }
  const sess = dbFindById('sesiones', token);
  if (!sess) {
    throw AuthError('UNAUTHORIZED', 'Sesión inválida');
  }
  if (sess.revoked === true || sess.revoked === 'TRUE') {
    throw AuthError('UNAUTHORIZED', 'Sesión revocada');
  }
  const now = new Date();
  const exp = new Date(sess.expires_at);
  if (now > exp) {
    throw AuthError('SESSION_EXPIRED', 'Sesión expirada');
  }
  const user = dbFindById('usuarios', sess.user_id);
  if (!user || user.estado !== 'active') {
    throw AuthError('UNAUTHORIZED', 'Cuenta no activa');
  }

  // Renovar last_seen_at sin tocar expires_at (ventana fija)
  dbUpdateById('sesiones', token, { last_seen_at: dbNowUtc() });

  return {
    userId: sess.user_id,
    role: sess.rol,
    user: user,
    sessionToken: token,
  };
}

/**
 * Helper: garantiza que el usuario autenticado tiene uno de los roles dados.
 */
function authRequireRole(ctx, allowedRoles) {
  if (!ctx || !ctx.role) throw AuthError('UNAUTHORIZED', 'Sesión requerida');
  if (allowedRoles.indexOf(ctx.role) === -1) {
    throw AuthError('FORBIDDEN', 'No tienes permiso para esta acción');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Activación de cuenta — el usuario semilla y los creados por Admin pasan por aquí
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {{token: string, password: string}} payload
 */
function authActivateAccount(payload, reqMeta) {
  const tokenRow = dbFindById('tokens_temporales', payload.token);
  if (!tokenRow) {
    throw AuthError('INVALID_TOKEN', 'Token de activación inválido');
  }
  if (tokenRow.tipo !== 'activation') {
    throw AuthError('INVALID_TOKEN', 'Token no es de activación');
  }
  if (tokenRow.used_at) {
    throw AuthError('TOKEN_USED', 'Este enlace ya fue usado');
  }
  const now = new Date();
  if (now > new Date(tokenRow.expires_at)) {
    throw AuthError('TOKEN_EXPIRED', 'El enlace de activación expiró');
  }

  const user = dbFindById('usuarios', tokenRow.user_id);
  if (!user) {
    throw AuthError('INVALID_TOKEN', 'Usuario no encontrado');
  }

  // Setear password
  const { salt, hash, algoritmo } = cryptoHashPassword(payload.password);
  const existingPwd = dbFindById('usuarios_pwd', user.id);
  const nowIso = dbNowUtc();
  if (existingPwd) {
    dbUpdateById('usuarios_pwd', user.id, {
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  } else {
    dbInsert('usuarios_pwd', {
      user_id: user.id,
      salt: salt, hash: hash, algoritmo: algoritmo,
      updated_at: nowIso, forzar_cambio: false,
    });
  }

  // Activar cuenta
  dbUpdateById('usuarios', user.id, {
    estado: 'active',
    updated_at: nowIso,
  });

  // Marcar token como usado
  dbUpdateById('tokens_temporales', payload.token, { used_at: nowIso });

  auditOk(user.id, 'activate_account', 'usuario', user.id, '', '', reqMeta);

  return { ok: true, email: user.email };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function auth_getSessionTtl_() {
  const cfg = dbFindById('config', 'app.session_ttl_hours');
  return cfg ? Number(cfg.value) : 8;
}

/**
 * Forma pública del usuario — sin datos sensibles (cedula, etc).
 * Usado en respuestas al frontend.
 */
function auth_publicUserShape_(user) {
  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombres: user.nombres,
    apellidos: user.apellidos,
    nick: user.nick,
    foto_url: user.foto_url,
    estado: user.estado,
    privacidad_fotos: user.privacidad_fotos,
    preferencias_notif: user.preferencias_notif,
    entrenador_asignado_id: user.entrenador_asignado_id,
  };
}
