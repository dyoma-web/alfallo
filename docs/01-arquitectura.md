# Al Fallo · Arquitectura técnica

> Documento vivo. Decisiones de arquitectura del MVP. Cualquier cambio mayor debe registrarse aquí.

---

## 1. Stack final

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **React 18 + Vite + TypeScript** | SPA estática, build a `/dist` |
| Estilos | **Tailwind CSS** + tema dark de la marca | Tokens de [brand.jsx](../Support_files/Design/project/brand.jsx) portados a `tailwind.config.ts` |
| Routing | **React Router 6** | Hash router (compatible con GitHub Pages sin servidor) |
| Estado global | **Zustand** | Más liviano que Redux, sin boilerplate |
| Formularios | **React Hook Form + Zod** | Validación tipada de extremo a extremo |
| Calendario | **FullCalendar 6** | Vista día / semana / mes |
| Gráficas | **Recharts** | KPIs y reportes simples |
| Hosting frontend | **GitHub Pages** | URL: `https://dyoma-web.github.io/alfallo/` |
| API | **Google Apps Script** Web App | `doGet`/`doPost` con router interno |
| Datastore | **Google Sheets** | Hoja `Alfallo` (ID `1kVdr...QAs`) |
| Auth | Token de sesión + hash SHA-256 con salt | Limitación de Apps Script (no hay bcrypt nativo) |
| Logs | Hoja `auditoria` separada + `Logger` de Apps Script | Rotación manual cada 90 días |
| CI/CD | **GitHub Actions** | Build de Vite → deploy a `gh-pages` |
| Backups | Apps Script Time-driven trigger | Duplica el Sheet a Drive cada noche, retención 30 días |

---

## 2. Topología y flujo de petición

```
┌──────────────────────┐
│   Navegador del      │
│   usuario / admin /  │
│   entrenador         │
└──────────┬───────────┘
           │  HTTPS (GitHub Pages)
           ▼
┌──────────────────────┐
│  Frontend estático   │
│  React build         │
│  dyoma-web.github.io │
│  /alfallo/           │
└──────────┬───────────┘
           │  HTTPS, fetch() POST/GET
           │  body: { action, payload, token }
           ▼
┌──────────────────────┐
│  Apps Script Web App │
│  doGet / doPost      │
│  router interno      │
└──────────┬───────────┘
           │  SpreadsheetApp API
           ▼
┌──────────────────────┐
│  Google Sheet        │
│  "Alfallo"           │
│  ~20 hojas/tablas    │
└──────────────────────┘
```

**Una sola URL de API** (la Web App de Apps Script). El router interno decide qué función ejecutar según `payload.action`.

---

## 3. Estrategia de autenticación

### 3.1. Registro y activación
- El Admin crea cuentas (Usuarios, Entrenadores) → email automático con link de activación que contiene un `activation_token` de un solo uso (TTL 24 h).
- El usuario establece contraseña por primera vez al activar.
- Las contraseñas **nunca** se guardan en texto plano.

### 3.2. Hash de contraseñas
- Algoritmo: **SHA-256 con salt aleatorio de 16 bytes** + `pepper` global guardado en Script Properties.
- Formato almacenado: `salt:hash` en hex.
- ⚠️ **Limitación conocida**: Apps Script no soporta bcrypt/argon2. SHA-256+salt+pepper es lo más fuerte posible aquí. Esta es una de las razones por las que migrar a Postgres+bcrypt es obligatorio antes de producción real.

### 3.3. Login
1. Frontend envía `{ email, password }` por POST.
2. Backend valida contra hoja `usuarios_pwd` (separada de `usuarios` para reducir exposición).
3. Si OK: genera `session_token` (UUID v4) con TTL 8 h, lo guarda en hoja `sesiones` con `{ token, user_id, role, created_at, expires_at, last_seen }`.
4. Devuelve `{ token, user, role }` al frontend.

### 3.4. Persistencia de sesión en frontend
- `localStorage` con clave `alfallo.session` = `{ token, user, role, expiresAt }`.
- ⚠️ `localStorage` es vulnerable a XSS — mitigamos con CSP estricta en el HTML y sanitización de inputs.
- Cookie HttpOnly **no es viable** aquí porque el frontend (GitHub Pages) y la API (Apps Script) están en dominios distintos y Apps Script no permite setear cookies del frontend.

### 3.5. Cada request autenticado
- Header `Authorization: Bearer {token}` (o en el body, ya que Apps Script tiene limitaciones de headers — ver §6).
- Backend valida el token: existe, no expiró, último `last_seen` < 8 h.
- Renueva `last_seen` en cada request.

### 3.6. Logout
- Frontend borra `localStorage`.
- Backend marca el token como `revoked` en hoja `sesiones`.

### 3.7. Recuperación de contraseña
- Usuario solicita por email → backend genera `reset_token` (TTL 1 h) → email con link.
- Link lleva al frontend con `?reset_token=...` → permite establecer nueva contraseña.

---

## 4. Patrón booking-ID con LockService

Resuelve el problema de doble agendamiento concurrente y el rastro de borradores.

### 4.1. Tabla única `agendamientos`
Sin tabla auxiliar transaccional. Todo vive en una sola tabla con columna `estado`:

```
borrador → solicitado → confirmado → pactado → completado
                                  ↘ cancelado
                                  ↘ no-asistido
                                  ↘ rechazado
borrador → expirado (después de 10 min sin completar)
```

### 4.2. Flujo

**Paso 1 — usuario entra a "Agendar"**
- Frontend llama `action: "createDraftBooking"` automáticamente al montar la pantalla.
- Backend genera `booking_id` (UUID), inserta fila con `estado='borrador'`, `created_at=now`, `created_by=user_id`. Devuelve el ID al frontend.

**Paso 2 — usuario completa formulario y envía**
- Frontend llama `action: "submitBooking"` con `{ booking_id, fecha, hora, entrenador_id, sede_id, ... }`.
- Backend usa `LockService.getScriptLock()` con timeout 10 s para evitar race conditions.
- Dentro del lock:
  1. Verifica que el cupo no esté tomado (busca otros `confirmado`/`pactado` en mismo entrenador + fecha + hora).
  2. Si OK: actualiza la fila del booking_id a `estado='solicitado'` con todos los campos.
  3. Si conflicto: devuelve error `CUPO_TOMADO`.
- Libera el lock.

**Paso 3 — entrenador confirma o rechaza**
- Cambia `estado` a `confirmado` o `rechazado`.

**Paso 4 — limpieza de borradores**
- Trigger time-driven cada hora marca `estado='expirado'` los borradores con `created_at` mayor a 10 minutos.

**Paso 5 — archivado**
- Trigger nocturno mueve registros con `estado` final (completado, cancelado, expirado, rechazado, no-asistido) y `updated_at` mayor a 90 días a hoja `archivo_agendamientos`.

### 4.3. Por qué este patrón
- **Atomicidad sin transacciones nativas**: LockService es la única forma de evitar race conditions en Sheets.
- **Una sola fuente de verdad**: una tabla única evita inconsistencias entre transaccional y consolidada.
- **Auditoría completa**: nada se borra, todo queda con su estado final.
- **Rendimiento**: `archivo_agendamientos` mantiene la tabla principal liviana.

---

## 5. Manejo de zona horaria

**Decisión**: almacenar todo en **UTC**, renderizar en zona del usuario.

### 5.1. En Sheets
- Toda columna fecha/hora se guarda como ISO 8601 UTC: `2026-05-15T14:30:00Z`.
- Apps Script: `new Date().toISOString()`.

### 5.2. En frontend
- `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })` para render.
- Helper `formatLocal(utcIso)` y `toUtc(localDate)` en `src/lib/datetime.ts`.

### 5.3. En formularios
- Date pickers trabajan en hora local del usuario, convertimos a UTC antes de enviar al backend.

### 5.4. Por qué desde el día 1
- Migrar miles de registros con conversión de zona horaria es costoso y propenso a errores.
- Cuesta 1 línea de código hoy. Cuesta horas de migración mañana.

---

## 6. CORS y comunicación frontend ↔ Apps Script

### 6.1. Limitación de Apps Script
Las Web Apps de Apps Script **no aceptan headers personalizados arbitrarios** en preflight CORS. Solo `Content-Type` con valores limitados.

### 6.2. Solución
- **Todo se envía en el body**, incluido el token de sesión.
- `Content-Type: text/plain;charset=utf-8` (Apps Script lo acepta sin preflight).
- El body es un JSON serializado: `{ action, payload, token }`.

### 6.3. Wrapper de fetch en frontend
```ts
// src/lib/api.ts
async function api(action: string, payload: any) {
  const token = useSession.getState().token;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload, token }),
  });
  const data = await res.json();
  if (data.error) throw new ApiError(data.error);
  return data.result;
}
```

### 6.4. En Apps Script
```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { action, payload, token } = body;
  return route(action, payload, token);
}
```

---

## 7. Caching y manejo de cuotas

### 7.1. Cuotas relevantes (cuenta gratuita)
| Recurso | Límite | Mitigación |
|---|---|---|
| Apps Script ejecuciones | 6 min máx por ejecución | Mantener handlers cortos |
| Apps Script tiempo total | 90 min/día | Cachear lecturas |
| Sheets API reads | ~20.000/día/proyecto | Batch reads, cache |
| Email (MailApp) | 100/día | Solo emails críticos |
| URLFetch | 20.000/día | No relevante (no hacemos calls externos) |

### 7.2. Estrategia
- **CacheService de Apps Script** para: catálogos (sedes, planes), perfil de usuario logueado, configuración del sistema. TTL 5–15 min.
- **Batch reads**: cuando un dashboard necesita 5 datasets, leer todo en una sola llamada `getValues()` por hoja, no fila por fila.
- **Batch writes**: nunca `setValue()` celda a celda, siempre `setValues()` por bloques.
- **Lecturas indexadas**: mantener una hoja `indices` con `{ entidad, id, fila }` para evitar `find()` lineales en hojas grandes.

---

## 8. Estructura de carpetas del repo

```
alfallo/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI: build + deploy a gh-pages
├── apps-script/
│   ├── Code.gs                     # router doGet/doPost
│   ├── auth.gs                     # login, signup, sessions, hash
│   ├── bookings.gs                 # agendamientos + LockService
│   ├── users.gs                    # CRUD usuarios
│   ├── trainers.gs                 # CRUD entrenadores
│   ├── sedes.gs                    # CRUD sedes
│   ├── plans.gs                    # planes y asignaciones
│   ├── routines.gs                 # rutinas
│   ├── attendance.gs               # asistencia + indicadores
│   ├── messaging.gs                # mensajes, alertas
│   ├── reports.gs                  # consultas para dashboards
│   ├── audit.gs                    # logger
│   ├── backup.gs                   # trigger nocturno
│   ├── lib/
│   │   ├── db.gs                   # helpers Sheet (read/write/find)
│   │   ├── crypto.gs               # hash, salt, tokens
│   │   ├── cache.gs                # wrappers de CacheService
│   │   └── validate.gs             # validaciones server-side
│   └── appsscript.json             # manifest
├── docs/
│   ├── 01-arquitectura.md          # este archivo
│   ├── 02-modelo-datos.md
│   ├── 03-disclaimer-legal.md
│   └── 04-roadmap.md
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── components/                 # primitivos: Btn, Card, Icon, StatusBadge...
│   ├── features/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── calendar/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── trainers/
│   │   ├── sedes/
│   │   ├── plans/
│   │   └── routines/
│   ├── layouts/
│   │   ├── AppShellMobile.tsx      # bottom nav
│   │   └── AppShellDesktop.tsx     # sidebar
│   ├── lib/
│   │   ├── api.ts                  # wrapper fetch a Apps Script
│   │   ├── datetime.ts             # helpers UTC ↔ Bogota
│   │   ├── store/                  # Zustand stores
│   │   └── schemas/                # esquemas Zod
│   ├── pages/                      # vistas top-level
│   ├── routes.tsx
│   ├── theme.ts                    # tokens portados de brand.jsx
│   ├── App.tsx
│   └── main.tsx
├── Support_files/                  # ya existe — briefs y design system
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 9. Convenciones

- **Naming archivos**: `PascalCase.tsx` para componentes React, `camelCase.ts` para utils, `kebab-case.md` para docs.
- **Naming de acciones API**: `verbEntity` en camelCase: `loginUser`, `createBooking`, `listSedes`.
- **Naming de columnas en Sheets**: `snake_case` (más legible en hojas).
- **IDs**: UUID v4 generados en backend. Nunca autoincrement de fila.
- **Idioma del código**: nombres en inglés (variables, funciones). UI y mensajes al usuario, en español.
- **Idioma de docs y commits**: español.

---

## 10. Variables y secretos

### 10.1. Frontend
- **Cero secretos** en frontend. Todo lo que vaya al build es público.
- Solo dos constantes en `src/lib/config.ts`:
  - `API_URL` — URL pública del Web App de Apps Script.
  - `APP_VERSION` — del `package.json`.

### 10.2. Apps Script (Script Properties)
- `PEPPER` — string aleatorio largo, fijo para hash de passwords. Configurar **una sola vez** y nunca cambiar (rompería todos los logins).
- `BACKUP_FOLDER_ID` — carpeta de Drive donde se guardan los backups.
- `ADMIN_EMAILS` — lista de correos con rol Admin (bootstrap inicial).
- `SHEET_ID` — `1kVdrzGDzeGvdknpSqoz1AcOQgfAwIeaGbhPssAG7QAs`.

Estas se configuran desde el editor de Apps Script: **Project Settings → Script Properties**.

---

## 11. Despliegue

### 11.1. Frontend (GitHub Actions)
Workflow `.github/workflows/deploy.yml`:
1. Trigger: push a `main`.
2. Setup Node 20.
3. `npm ci && npm run build`.
4. Deploy `dist/` a branch `gh-pages` con `peaceiris/actions-gh-pages`.

GitHub Pages → Settings → Pages → Source: `gh-pages` branch.

### 11.2. Backend (Apps Script)
- No tiene CI. Cambios se pegan manualmente al editor o se sincronizan con `clasp` (Google CLI para Apps Script).
- Después de cualquier cambio en Apps Script: **Deploy → Manage deployments → Edit → New version**. Si la URL no cambia, el frontend sigue funcionando.

---

## 12. Riesgos y plan de migración

### 12.1. Riesgos del MVP
| Riesgo | Mitigación inmediata | Plan B |
|---|---|---|
| Cuotas de Sheets/Apps Script saturadas | Cache + batch + LockService | Migrar a Supabase |
| Doble booking | LockService | — |
| XSS en localStorage | CSP estricta + sanitización | — |
| Sheets corrupto / borrado | Backups nocturnos | Restaurar de Drive |
| Pérdida del PEPPER | Anotarlo cifrado fuera de Apps Script | Reset masivo de passwords |
| Apps Script Web App URL cambia | No usar `New deployment`, solo `Edit` | Avisar al frontend en build time |

### 12.2. Cuándo migrar a infraestructura real
**Disparadores** (cualquiera de los siguientes):
- Más de 50 usuarios concurrentes activos.
- Errores de cuota en horas pico.
- Necesidad de pagos reales / facturación electrónica.
- Necesidad de notificaciones masivas (>100/día).
- Acuerdo comercial con un primer gimnasio que pague.

### 12.3. Hacia dónde migrar
- **Backend**: Node.js (Express o Hono) en Railway / Fly.io.
- **DB**: Postgres en Supabase o Neon.
- **Auth**: Supabase Auth o Clerk (incluye bcrypt, OAuth, MFA).
- **Storage de fotos**: Supabase Storage o Cloudflare R2.
- **Frontend**: el mismo, sin cambios — solo cambia `API_URL`.

La capa frontend es **portable** porque toda la lógica de API está abstraída en `src/lib/api.ts`. Migrar significa reescribir Apps Script en Node, no tocar React.

---

## 13. Checklist antes de empezar a codear

- [ ] Auth GitHub funcionando ✅
- [ ] Sheet "Alfallo" creado ✅
- [ ] Apps Script Web App deployado ✅
- [ ] Variable `PEPPER` generada y guardada en Script Properties (pendiente — se hace en Iteración 3)
- [ ] Hojas creadas en el Sheet (pendiente — se hace en Iteración 3 con script de bootstrap)
- [ ] GitHub Pages habilitado (pendiente — se hace después del primer push)

---

**Próximo documento**: [02-modelo-datos.md](02-modelo-datos.md) — esquema completo de las hojas y relaciones.
