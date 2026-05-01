/**
 * validate.gs — Validaciones server-side de payloads.
 *
 * Espejo de los Zod schemas que tendrá el frontend. La validación es
 * defensiva: el frontend ya valida, pero confiar solo en cliente es
 * vulnerable. Aquí re-validamos todo lo que llega.
 *
 * Convención: las funciones devuelven el valor saneado, o lanzan
 *   ValidationError({ field, code, message }) que el router convierte
 *   en respuesta 400.
 */

function ValidationError(field, code, message) {
  const e = new Error(message || code);
  e.name = 'ValidationError';
  e.field = field;
  e.code = code;
  return e;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ISO_RE   = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// ──────────────────────────────────────────────────────────────────────────
// Validators atómicos
// ──────────────────────────────────────────────────────────────────────────

function vRequired(value, field) {
  if (value === null || value === undefined || value === '') {
    throw ValidationError(field, 'REQUIRED', field + ' es requerido');
  }
  return value;
}

function vString(value, field, opts) {
  if (typeof value !== 'string') {
    throw ValidationError(field, 'NOT_STRING', field + ' debe ser texto');
  }
  const trimmed = value.trim();
  const o = opts || {};
  if (o.min && trimmed.length < o.min) {
    throw ValidationError(field, 'TOO_SHORT', field + ' debe tener al menos ' + o.min + ' caracteres');
  }
  if (o.max && trimmed.length > o.max) {
    throw ValidationError(field, 'TOO_LONG', field + ' debe tener máximo ' + o.max + ' caracteres');
  }
  return trimmed;
}

function vEmail(value, field) {
  const s = vString(value, field || 'email').toLowerCase();
  if (!EMAIL_RE.test(s)) {
    throw ValidationError(field || 'email', 'INVALID_EMAIL', 'Formato de correo inválido');
  }
  return s;
}

function vUuid(value, field) {
  const s = vString(value, field);
  if (!UUID_RE.test(s)) {
    throw ValidationError(field, 'INVALID_UUID', field + ' debe ser un UUID válido');
  }
  return s;
}

function vIsoDate(value, field) {
  const s = vString(value, field);
  if (!ISO_RE.test(s)) {
    throw ValidationError(field, 'INVALID_DATE', field + ' debe ser una fecha ISO 8601 UTC');
  }
  return s;
}

function vEnum(value, field, allowed) {
  if (allowed.indexOf(value) === -1) {
    throw ValidationError(field, 'INVALID_ENUM',
      field + ' debe ser uno de: ' + allowed.join(', '));
  }
  return value;
}

function vBool(value, field) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  throw ValidationError(field, 'INVALID_BOOL', field + ' debe ser booleano');
}

function vNumber(value, field, opts) {
  const n = typeof value === 'number' ? value : Number(value);
  if (isNaN(n)) {
    throw ValidationError(field, 'INVALID_NUMBER', field + ' debe ser un número');
  }
  const o = opts || {};
  if (o.min !== undefined && n < o.min) {
    throw ValidationError(field, 'TOO_SMALL', field + ' debe ser >= ' + o.min);
  }
  if (o.max !== undefined && n > o.max) {
    throw ValidationError(field, 'TOO_LARGE', field + ' debe ser <= ' + o.max);
  }
  if (o.int && !Number.isInteger(n)) {
    throw ValidationError(field, 'NOT_INTEGER', field + ' debe ser entero');
  }
  return n;
}

function vPassword(value, field) {
  const s = vString(value, field || 'password', { min: 8, max: 200 });
  // Política mínima: ≥8 chars, al menos una letra y un número
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) {
    throw ValidationError(field || 'password', 'WEAK_PASSWORD',
      'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números');
  }
  return s;
}

// ──────────────────────────────────────────────────────────────────────────
// Validadores de payloads completos por acción
// (se llaman desde Code.gs antes de despachar al handler)
// ──────────────────────────────────────────────────────────────────────────

const PAYLOAD_VALIDATORS = {
  ping: function (p) { return p || {}; },

  loginUser: function (p) {
    return {
      email: vEmail(p.email),
      password: vRequired(p.password, 'password'),
    };
  },

  logoutUser: function (p) {
    return {};  // no payload necesario, usa el token del header
  },

  activateAccount: function (p) {
    return {
      token: vString(vRequired(p.token, 'token'), 'token', { min: 32 }),
      password: vPassword(p.password),
    };
  },

  requestPasswordReset: function (p) {
    return {
      email: vEmail(p.email),
    };
  },

  resetPassword: function (p) {
    return {
      token: vString(vRequired(p.token, 'token'), 'token', { min: 32 }),
      password: vPassword(p.password),
    };
  },
};

/**
 * Valida un payload según la acción. Si no hay validador para la acción,
 * devuelve el payload tal cual (los handlers individuales pueden re-validar).
 */
function validatePayload(action, payload) {
  const validator = PAYLOAD_VALIDATORS[action];
  if (!validator) return payload || {};
  return validator(payload || {});
}
