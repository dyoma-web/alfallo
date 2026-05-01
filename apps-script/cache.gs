/**
 * cache.gs — Wrappers de CacheService de Apps Script.
 *
 * Reduce lecturas a Sheets para datos que cambian poco (catálogos, perfil
 * del usuario logueado, configuración).
 *
 * Limitación: max 100KB por entrada, max 10MB total por proyecto.
 * TTL máximo: 6 horas (21600 segundos).
 */

const CACHE_TTL = {
  short:  60,        // 1 min — perfil del usuario logueado
  medium: 300,       // 5 min — catálogos (sedes, planes)
  long:   1800,      // 30 min — config del sistema
  hour:   3600,      // 1 hora — datos rara vez cambian
};

/**
 * Lee del cache. Si miss, ejecuta loader, guarda y devuelve.
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {function(): any} loader
 */
function cacheGetOrLoad(key, ttlSeconds, loader) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit !== null) {
    try { return JSON.parse(hit); } catch (e) { /* invalid cache, regenera */ }
  }
  const value = loader();
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length < 100000) {
      cache.put(key, serialized, ttlSeconds);
    }
  } catch (e) {
    // No serializable → no se cachea, pero se devuelve
  }
  return value;
}

function cacheGet(key) {
  const hit = CacheService.getScriptCache().get(key);
  if (hit === null) return null;
  try { return JSON.parse(hit); } catch (e) { return null; }
}

function cachePut(key, value, ttlSeconds) {
  try {
    const s = JSON.stringify(value);
    if (s.length < 100000) {
      CacheService.getScriptCache().put(key, s, ttlSeconds || CACHE_TTL.medium);
    }
  } catch (e) { /* no serializable */ }
}

function cacheDelete(key) {
  CacheService.getScriptCache().remove(key);
}

function cacheDeleteMany(keys) {
  CacheService.getScriptCache().removeAll(keys);
}

/**
 * Invalidación por prefijo lógico. Apps Script no soporta wildcards en cache,
 * así que mantenemos una "lista de keys conocidas" que se borra explícitamente.
 * Útil para invalidar todo el catálogo cuando cambia una sede, por ejemplo.
 */
function cacheInvalidateNamespace(namespace) {
  // Llave conocidas registradas por el caller (patrón opcional).
  const indexKey = '__index__:' + namespace;
  const idx = cacheGet(indexKey);
  if (Array.isArray(idx)) {
    cacheDeleteMany(idx);
    cacheDelete(indexKey);
  }
}
