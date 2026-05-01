# Apps Script — backend de Al Fallo

Backend en Google Apps Script. Estos archivos viven en el editor de Apps Script
(no se buildean ni empaquetan); este folder es el **espejo versionado** del
código que corre en la Web App.

URL del Web App: https://script.google.com/macros/s/AKfycbz18v0WdiEyvIED4yCXpOQ-nqv35GoC7mt4aX22D7mGM1ipFNFeb_iND3Xd6WBl9Wxs/exec

Sheet asociado: https://docs.google.com/spreadsheets/d/1kVdrzGDzeGvdknpSqoz1AcOQgfAwIeaGbhPssAG7QAs/edit

---

## Archivos

| Archivo | Rol |
|---|---|
| `appsscript.json` | Manifest (timezone, runtime V8, web app config) |
| `Code.gs` | Entry point: `doGet`, `doPost`, router de acciones |
| `schema.gs` | Definición de las 33 hojas (single source of truth) |
| `db.gs` | CRUD sobre Sheets (insert, find, update, listas) + índices |
| `crypto.gs` | Hash de passwords (SHA-256+salt+pepper), UUIDs, tokens |
| `cache.gs` | Wrappers de CacheService con TTL |
| `validate.gs` | Validación de payloads server-side |
| `audit.gs` | Logger de auditoría a hoja `auditoria` |
| `auth.gs` | Login, logout, validación de sesión, activación de cuenta |
| `bootstrap.gs` | Crea las 33 hojas, seed admin, genera PEPPER. Idempotente. |

---

## Setup inicial — primera vez

Sigue estos pasos UNA SOLA VEZ. La primera ejecución de `bootstrap()` crea todo
y genera el PEPPER. Después solo se ejecuta de nuevo si quieres "reparar"
hojas faltantes.

### Paso 1 — Abrir el editor del Apps Script
1. Ve a https://script.google.com → busca el proyecto del Web App de Al Fallo,
   o si arrancas desde el Sheet: ábrelo y ve a **Extensiones → Apps Script**.
2. En el panel izquierdo verás los archivos actuales (probablemente solo `Code.gs`
   con un `function myFunction() {}` vacío).

### Paso 2 — Pegar los archivos

Para cada archivo de esta carpeta:

1. **Crear nuevo archivo en el editor** — clic en el **`+`** junto a "Files" → **Script**.
   - Nómbralo igual que en este folder, **sin la extensión** `.gs`.
   - Ejemplo: archivo local `auth.gs` → nombre en editor `auth`.
2. **Borra el contenido vacío** que el editor crea por defecto.
3. **Pega el contenido completo** del archivo local.
4. **Guarda** (Ctrl+S o el botón 💾).

Repite para los 9 archivos `.gs`. Para `appsscript.json`:
1. Activa **"Mostrar archivo de manifest"** en **⚙ Project Settings** → ✅ "Mostrar el archivo del manifiesto en el editor".
2. Reemplaza el contenido del archivo `appsscript.json` que aparece en el editor por el de este folder.

> 📌 **Orden recomendado de pegado**: `appsscript.json`, `schema`, `db`, `crypto`, `cache`, `validate`, `audit`, `auth`, `Code`, `bootstrap`. Las dependencias entre archivos son globales (todas las funciones quedan disponibles globalmente), pero pegarlos en este orden facilita identificar errores de typo.

### Paso 3 — Configurar Script Properties

1. En el editor → **⚙ Project Settings** (engranaje en barra lateral).
2. Scroll hasta **Script Properties** → clic en **Edit script properties**.
3. Verifica que NO existe `PEPPER`. Si existe (de pruebas anteriores) y quieres regenerar todo desde cero, **bórralo** ahora — pero ojo: cualquier hash existente queda inválido.
4. Verifica que `SHEET_ID` no exista o que coincida con `1kVdrzGDzeGvdknpSqoz1AcOQgfAwIeaGbhPssAG7QAs`.
5. Guarda y vuelve al editor.

### Paso 4 — Ejecutar `bootstrap()` por primera vez

1. En el editor, asegúrate de estar viendo `bootstrap.gs`.
2. En la barra superior, en el dropdown que dice "Selecciona una función", elige **`bootstrap`**.
3. Clic en **Run** (▷).
4. **Autorización**: la primera vez Google te pedirá permisos. Autoriza con tu cuenta `david.yomayusa@innovahub.org`.
   - Si aparece "Esta app no ha sido verificada", dale a **Avanzado → Ir a (proyecto) (no seguro)**. Es seguro: es tu propio script.
5. Espera 5–15 segundos. Cuando termine sin errores, abre **Ejecutar → Ver registros** (o `View → Logs`).

### Paso 5 — Copiar el PEPPER y el link de activación

En los logs verás dos bloques importantes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 PEPPER GENERADO — guarda este valor en lugar seguro:
   abc123...   (64 caracteres hex)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Anota el PEPPER en tu gestor de contraseñas inmediatamente.** Si se pierde,
todos los hashes de password quedan inválidos.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 TOKEN DE ACTIVACIÓN para david.yomayusa@innovahub.org
   Enlace de activación (válido 24h):
   https://dyoma-web.github.io/alfallo/#/activate?token=...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Guarda este link también — lo usaremos para activar tu cuenta cuando el frontend
de auth esté listo (Iteración 4).

### Paso 6 — Re-deployar el Web App

Cualquier cambio en el código no se refleja hasta que se despliega:

1. **Deploy → Manage deployments**.
2. En el deployment activo, clic en el lápiz (✏️ Edit).
3. **Version**: selecciona **New version** del dropdown.
4. (Opcional) Descripción: "Iteración 3 — backend base".
5. Clic en **Deploy**.

> 🔒 **No uses "New deployment"** porque eso genera una URL distinta y rompe el frontend. Usa siempre "Edit → New version" para mantener la URL actual.

### Paso 7 — Verificar

Abre en el navegador:
```
https://script.google.com/macros/s/AKfycbz18v0WdiEyvIED4yCXpOQ-nqv35GoC7mt4aX22D7mGM1ipFNFeb_iND3Xd6WBl9Wxs/exec
```

Deberías ver algo como:
```json
{"result":{"pong":true,"time":"2026-05-01T12:34:56Z","version":"0.1.0"}}
```

Si ves esto → backend funcionando ✅.

Si ves un error o página de Google → revisa logs y revisa que el deployment esté
en la versión correcta.

---

## Diagnóstico

Si quieres saber el estado del Sheet sin modificar nada, ejecuta `diagnose()` en
el editor (mismo procedimiento: dropdown → Run). Te dice qué hojas faltan y
cuáles tienen datos.

---

## Re-bootstrap (idempotencia)

`bootstrap()` se puede ejecutar cuantas veces quieras:
- No duplica hojas.
- No duplica config keys.
- No duplica al super admin.
- No regenera PEPPER si ya existe.
- Solo crea token de activación si el admin no tiene password seteado.

Útil cuando:
- Borras una hoja por accidente y quieres recrearla.
- Quieres re-emitir un link de activación (borra primero el password del admin en `usuarios_pwd`).

---

## Endpoints disponibles (Iteración 3)

Todos vía POST con `Content-Type: text/plain;charset=utf-8` y body:

```json
{ "action": "...", "payload": {...}, "token": "..." }
```

| Acción | Auth | Payload | Devuelve |
|---|---|---|---|
| `ping` | público | `{}` | `{ pong, time, version }` |
| `loginUser` | público | `{ email, password }` | `{ token, user, role, expiresAt }` |
| `logoutUser` | requiere | `{}` | `{ ok: true }` |
| `activateAccount` | público (token) | `{ token, password }` | `{ ok, email }` |

Errores:
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }
```

Códigos: `MISSING_ACTION`, `UNKNOWN_ACTION`, `BAD_JSON`, `VALIDATION`,
`INVALID_CREDENTIALS`, `ACCOUNT_PENDING`, `ACCOUNT_SUSPENDED`, `UNAUTHORIZED`,
`SESSION_EXPIRED`, `FORBIDDEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `TOKEN_USED`,
`NOT_IMPLEMENTED`, `INTERNAL`.

---

## Troubleshooting

**"Authorization required"** al ejecutar `bootstrap` por primera vez
→ Es esperado. Autoriza con tu cuenta de Google. Si aparece "no verificada", da
clic en Avanzado → Ir al proyecto.

**"Hoja no encontrada"** al hacer login
→ Ejecuta `diagnose()` y luego `bootstrap()` de nuevo si faltan hojas.

**"PEPPER no está configurado"**
→ Ejecuta `bootstrap()`. Si ya se ejecutó pero el error persiste, revisa
Script Properties (paso 3 arriba) y verifica que `PEPPER` esté ahí.

**El frontend recibe CORS error**
→ Apps Script Web App debe estar deployado con `access: ANYONE_ANONYMOUS` y
`executeAs: USER_DEPLOYING`. Verifica en Deploy → Manage deployments → Edit.

**Cuotas excedidas** ("Service invoked too many times")
→ Apps Script tiene cuotas diarias (~90 min de ejecución total). Espera 24h o
reduce frecuencia de polling del frontend.
