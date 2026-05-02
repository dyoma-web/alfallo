# Apps Script — backend de Al Fallo

Backend en Google Apps Script. Estos archivos son el **espejo versionado** del
código que corre en la Web App.

- **URL del Web App**: https://script.google.com/macros/s/AKfycbz18v0WdiEyvIED4yCXpOQ-nqv35GoC7mt4aX22D7mGM1ipFNFeb_iND3Xd6WBl9Wxs/exec
- **Sheet "Alfallo"**: https://docs.google.com/spreadsheets/d/1kVdrzGDzeGvdknpSqoz1AcOQgfAwIeaGbhPssAG7QAs/edit

---

## 🚀 Setup rápido (modo recomendado)

**Solo 2 archivos para pegar.** Todo el backend va concatenado en uno solo.

### Paso 1 — Abre el editor de Apps Script
Dos formas equivalentes:
- Desde el Sheet "Alfallo" → **Extensiones → Apps Script**, o
- Desde el Web App URL si ya tienes el proyecto creado

### Paso 2 — Pega `Code.gs`

Abre [`apps-script/bundle/Code.gs`](bundle/Code.gs) en GitHub:
1. Clic en **"Raw"** arriba a la derecha del archivo.
2. **Ctrl+A → Ctrl+C** para copiar todo.
3. En el editor de Apps Script:
   - Si hay un archivo `Code.gs` con `function myFunction() {}`, ábrelo.
   - **Ctrl+A → Delete** para borrar el contenido.
   - **Ctrl+V** para pegar el bundle.
   - **Ctrl+S** para guardar.

### Paso 3 — Pega `appsscript.json`

1. En el editor de Apps Script: **⚙ Project Settings** (engranaje en barra lateral).
2. Marca el checkbox **"Show 'appsscript.json' manifest file in editor"** (Mostrar archivo de manifiesto).
3. Vuelve al editor de código (icono de `< >` en la barra). Ahora aparece `appsscript.json` en la lista de archivos.
4. Abre [`apps-script/bundle/appsscript.json`](bundle/appsscript.json) en GitHub → **Raw** → copia todo.
5. En el editor: abre `appsscript.json`, **Ctrl+A → Delete → Ctrl+V → Ctrl+S**.

### Paso 4 — Ejecuta `bootstrap()`

1. Vuelve a `Code.gs`.
2. En la barra superior, en el dropdown que dice "Selecciona una función", elige **`bootstrap`**.
3. Clic en **▷ Run**.
4. **Autorización**: la primera vez Google pide permisos. Autoriza con tu cuenta `david.yomayusa@innovahub.org`.
   - Si aparece "Esta app no ha sido verificada" → **Avanzado → Ir a (proyecto) (no seguro)**. Es seguro: es tu propio script.
5. Espera 5–15 segundos. Cuando termine, abre **View → Execution log**.

### Paso 5 — Anota PEPPER y link de activación

En los logs verás dos bloques con `━━━━━━━━━`:

```
🔐 PEPPER GENERADO — guarda este valor en lugar seguro:
   abc123...   (64 caracteres hex)
```
> ⚠️ **Anótalo en tu gestor de contraseñas inmediatamente.** Si se pierde, todos los hashes de password quedan inválidos.

```
🔑 TOKEN DE ACTIVACIÓN para david.yomayusa@innovahub.org
   Enlace de activación (válido 24h):
   https://dyoma-web.github.io/alfallo/#/activate?token=...
```
> Guárdalo. Lo usaremos en la Iteración 4.

### Paso 6 — Re-deploy del Web App

Cualquier cambio en el código no se refleja hasta que se despliega:

1. **Deploy → Manage deployments**.
2. En el deployment activo, clic en el lápiz **✏️ Edit**.
3. **Version**: selecciona **New version** del dropdown.
4. (Opcional) Descripción: `Iteración 3 — backend base`.
5. Clic en **Deploy**.

> 🔒 **No uses "New deployment"** porque genera una URL distinta y rompe el frontend. Usa siempre "Edit → New version" para mantener la URL actual.

### Paso 7 — Verifica

Abre en el navegador:
```
https://script.google.com/macros/s/AKfycbz18v0WdiEyvIED4yCXpOQ-nqv35GoC7mt4aX22D7mGM1ipFNFeb_iND3Xd6WBl9Wxs/exec
```

Debe responder algo como:
```json
{"result":{"pong":true,"time":"2026-05-01T...Z","version":"0.1.0"}}
```

Si lo ves → backend funcionando ✅. Si no, revisa logs y deployment.

---

## 🛠 Diagnóstico

Si quieres saber el estado del Sheet sin modificar nada, ejecuta `diagnose()`
en el editor (mismo procedimiento: dropdown → Run). Te dice qué hojas faltan y
cuántas filas tiene cada una.

---

## ♻️ Re-bootstrap (idempotencia)

`bootstrap()` se puede ejecutar cuantas veces quieras:
- No duplica hojas (solo crea las que faltan).
- No duplica config keys.
- No duplica al super admin.
- No regenera PEPPER si ya existe.
- Solo crea token de activación si el admin no tiene password seteado.

Útil cuando:
- Borras una hoja por accidente y quieres recrearla.
- Quieres re-emitir un link de activación (borra primero el password del admin en `usuarios_pwd`).

---

## 🔄 Actualizar el código en futuras iteraciones

Cuando agreguemos código nuevo en Iteración 4, 5, etc., el flujo será:

1. **Yo** edito archivos en `apps-script/*.gs`.
2. **Yo** ejecuto `npm run gs:bundle` localmente.
3. **Yo** committeo y pusheo. El bundle queda actualizado en GitHub.
4. **Tú** vas a [`apps-script/bundle/Code.gs`](bundle/Code.gs) → Raw → Ctrl+A Ctrl+C.
5. **Tú** pegas en el editor de Apps Script (Ctrl+A → Delete → Ctrl+V).
6. **Tú** haces Deploy → Manage deployments → Edit → New version.

Total: 3 pasos manuales (copiar, pegar, redeploy). El bundle ya estará al día en GitHub.

---

## 📂 Estructura del código

| Archivo (fuente) | Rol |
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
| `build.mjs` | Genera el bundle. Ejecutar con `npm run gs:bundle`. |

Los 9 archivos `.gs` se concatenan automáticamente en `bundle/Code.gs`.

---

## 📡 Endpoints disponibles (Iteración 3)

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

## 🔧 Troubleshooting

**"Authorization required"** al ejecutar `bootstrap` por primera vez
→ Es esperado. Autoriza con tu cuenta de Google. Si aparece "no verificada", da
clic en Avanzado → Ir al proyecto.

**"Hoja no encontrada"** al hacer login
→ Ejecuta `diagnose()` y luego `bootstrap()` de nuevo si faltan hojas.

**"PEPPER no está configurado"**
→ Ejecuta `bootstrap()`. Si ya se ejecutó pero el error persiste, revisa
**⚙ Project Settings → Script Properties** y verifica que `PEPPER` esté ahí.

**El frontend recibe CORS error**
→ Apps Script Web App debe estar deployado con `access: ANYONE_ANONYMOUS` y
`executeAs: USER_DEPLOYING`. Verifica en Deploy → Manage deployments → Edit.

**Cuotas excedidas** ("Service invoked too many times")
→ Apps Script tiene cuotas diarias (~90 min de ejecución total). Espera 24h o
reduce frecuencia de polling del frontend.

---

## ⚙️ Modo manual (alternativa, no recomendado)

Si por alguna razón el bundle no funciona, puedes pegar archivo por archivo:

1. Para cada `.gs` en este folder (excepto `build.mjs`): clic en **`+` → Script** en el editor, nombrarlo igual sin `.gs`, pegar contenido.
2. `appsscript.json`: igual que en el modo rápido (paso 3).
3. Ejecuta `bootstrap()`, anota PEPPER y token, redeploy.

10 paste operations en lugar de 2. Solo úsalo si el modo rápido falla por algún motivo raro.
