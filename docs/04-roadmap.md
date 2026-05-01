# Al Fallo · Roadmap de desarrollo

> Plan de 8 iteraciones acotadas. Cada una entrega algo verificable y termina con un OK explícito antes de pasar a la siguiente. Estimaciones en complejidad relativa (S/M/L), no en horas.

---

## Visión general

| # | Iteración | Foco | Complejidad | Push a `main` |
|---|---|---|---|---|
| 1 | Documentación | Decisiones técnicas y legales | M | No |
| 2 | Estructura del repo | Vite + TS + Tailwind + tema | S | ✅ Primer push |
| 3 | Backend base | Apps Script: router, auth, audit, bootstrap | L | ✅ |
| 4 | Auth completa | Login, activación, recuperación, sesión | M | ✅ |
| 5 | Núcleo Usuario | Dashboard, Agendar, Calendario, Alertas | L | ✅ |
| 6 | Núcleo Entrenador | Dashboard, Rutinas, Grupos, Asistencia, Mensajes | L | ✅ |
| 7 | Núcleo Admin | Dashboard, Sedes, Usuarios, Entrenadores, Planes, Políticas | L | ✅ |
| 8 | Cierre | Backups, polish, deploy, checklist legal | M | ✅ + GH Pages activado |

**Total**: 8 iteraciones. Las 7 con código entregan algo navegable al final.

---

## Iteración 1 — Documentación
**Estado**: 🟡 En curso (este documento es el último).

**Entregables**:
- ✅ `docs/01-arquitectura.md`
- ✅ `docs/02-modelo-datos.md`
- ✅ `docs/03-disclaimer-legal.md`
- ⏳ `docs/04-roadmap.md` (este)

**Criterios de aceptación**:
- Los 4 documentos revisados y aprobados.
- Cliente entiende stack, modelo, marco legal y plan.

**Push a repo**: aún no. Los 4 docs se pushean junto con la Iteración 2.

---

## Iteración 2 — Estructura del repo y tema visual

**Objetivo**: dejar el repo listo para empezar a codear features. Frontend arranca en blanco pero ya tiene la marca aplicada.

**Entregables**:

1. **Inicialización del repo**
   - `git init` local, primer commit con los 4 docs.
   - `.gitignore` (node_modules, dist, .env, .clasp.json, .DS_Store).
   - `README.md` raíz: descripción corta + link a docs.
   - `LICENSE` [REVISAR — proponer MIT o propietaria].

2. **Setup Vite + TS + Tailwind**
   - `npm create vite@latest . -- --template react-ts`.
   - `package.json` con scripts: `dev`, `build`, `preview`, `lint`.
   - Tailwind config con tokens portados de [brand.jsx](../Support_files/Design/project/brand.jsx).
   - `vite.config.ts` con `base: '/alfallo/'` para GitHub Pages.

3. **Estructura de carpetas** (la de [01-arquitectura.md §8](01-arquitectura.md))
   - Carpetas vacías con `.gitkeep` donde aún no hay archivos.

4. **Componentes base portados de `brand.jsx` a TSX**
   - `<Btn>`, `<Card>`, `<Icon>`, `<StatusBadge>`, `<Logo>`, `<Repmark>`.
   - Una página `App.tsx` que muestra una galería de los componentes (verificación visual).

5. **GitHub Actions workflow inicial**
   - `.github/workflows/deploy.yml`: build + deploy a `gh-pages` (sin activar GH Pages todavía — eso es Iter 8).

6. **Primer push a `main`**
   - Genero la rama `main`, hago el push inicial.

**Criterios de aceptación**:
- `npm install && npm run dev` arranca sin errores.
- La página de galería muestra todos los componentes con la marca.
- El push aparece en `https://github.com/dyoma-web/alfallo`.
- No hay tipos `any` ni errores de TS.

**Dependencias**: Iteración 1 cerrada. Auth GitHub funcionando ✅.

**Riesgos**:
- Tailwind config a veces tiene conflictos con custom colors → mitigado revisando que los tokens del tema generen clases utility válidas.

**Complejidad**: S (un día de trabajo concentrado).

---

## Iteración 3 — Backend base (Apps Script)

**Objetivo**: API funcional, Sheet inicializado, primer endpoint respondiendo.

**Entregables**:

1. **`apps-script/Code.gs`** — router central
   - `doGet(e)` y `doPost(e)`.
   - Despacho por `payload.action`.
   - Manejo uniforme de errores → `{ error: { code, message } }`.
   - Wrapper `withAuth(action, fn)` que valida el token.
   - Wrapper `withLock(fn)` para operaciones críticas.

2. **`apps-script/lib/db.gs`** — helpers de Sheet
   - `getSheet(name)`, `findRow(sheet, col, value)`, `insertRow(sheet, obj)`, `updateRow(sheet, id, patch)`, `listAll(sheet, filter)`, `batchInsert(sheet, rows)`.
   - Mapeo objeto ↔ fila usando los headers como esquema.

3. **`apps-script/lib/crypto.gs`**
   - `hashPassword(password, salt, pepper)` con SHA-256.
   - `generateSalt()`, `generateUuid()`, `generateToken()`.

4. **`apps-script/lib/cache.gs`**
   - Wrapper de `CacheService` con TTL por tipo de dato.

5. **`apps-script/lib/validate.gs`**
   - Validación de payloads server-side (espejos de los Zod schemas del frontend).

6. **`apps-script/auth.gs`**
   - `loginUser`, `logoutUser`, `validateSession`, `refreshSession`.
   - Hash + check de contraseña.

7. **`apps-script/audit.gs`**
   - `logAction(userId, action, entity, entityId, before, after, result)`.
   - Llamado desde todos los handlers que escriben.

8. **`apps-script/bootstrap.gs`** ⭐
   - Ejecutable manualmente desde el editor de Apps Script.
   - Crea las 33 hojas con sus headers exactos.
   - Aplica formato (header bold, freeze first row, validations).
   - Genera el `PEPPER` aleatorio si no existe en Script Properties.
   - Crea super_admin semilla con email del cliente.
   - Inserta `config` keys iniciales.
   - Inserta política de cancelación global default.

9. **`apps-script/appsscript.json`** — manifest con scopes necesarios.

10. **Trigger time-driven** para limpieza de sesiones expiradas y borradores expirados (configurado en el editor, documentado en `docs/05-operaciones.md` que crearé en Iter 8).

**Criterios de aceptación**:
- Ejecutar `bootstrap()` desde el editor crea las 33 hojas correctamente.
- Endpoint `action: "ping"` devuelve `{ pong: true, time: <utc> }`.
- Endpoint `action: "loginUser"` con credenciales válidas devuelve un token; con inválidas devuelve `{ error: { code: "INVALID_CREDENTIALS" } }`.
- Cada llamada queda registrada en `auditoria`.

**Dependencias**: Iter 2 cerrada (no estricta — se puede paralelizar).

**Riesgos**:
- **Bootstrap ejecutado dos veces** podría duplicar datos → mitigación: `bootstrap()` es idempotente (verifica existencia antes de crear).
- **PEPPER perdido** si se borran Script Properties → mitigación: documentación clara de que es irrecuperable + recordatorio al cliente de anotarlo en su gestor de contraseñas.

**Complejidad**: L (la pieza más densa del MVP).

---

## Iteración 4 — Auth completa (frontend + flujos)

**Objetivo**: usuario puede registrarse (lo crea Admin), activar cuenta, iniciar sesión, recuperar contraseña, cerrar sesión.

**Entregables**:

1. **Frontend — `src/lib/api.ts`**
   - Wrapper `api(action, payload)` que serializa el body con token.
   - Manejo de errores tipados.
   - Reintentos automáticos en errores transitorios (1 reintento, backoff 500ms).

2. **Store de sesión — `src/lib/store/session.ts`**
   - Zustand store con `{ token, user, role, expiresAt }`.
   - Persistencia en `localStorage` con clave `alfallo.session`.
   - Auto-logout cuando `expiresAt` pasa.

3. **Pantallas**
   - `LoginPage` — email + password.
   - `ActivateAccountPage` — recibe `?token=` y permite establecer password inicial.
   - `ForgotPasswordPage` — solicitar reset.
   - `ResetPasswordPage` — recibe `?token=` y permite establecer password nueva.
   - `LogoutPage` — limpia store + redirect.

4. **Endpoints adicionales en Apps Script**
   - `requestPasswordReset` — genera token, envía email vía `MailApp`.
   - `resetPassword` — valida token y actualiza hash.
   - `activateAccount` — valida token y permite establecer password.

5. **Plantillas de email** (en `apps-script/email-templates.gs`)
   - Activación de cuenta.
   - Reset de contraseña.

6. **Routing protegido**
   - `<RequireAuth>` HOC que redirige a `/login` si no hay sesión.
   - `<RequireRole roles={['admin']}>` para gates por rol.

7. **Consentimiento legal**
   - Checkbox obligatorio en activación con links a `/politica-datos` y `/terminos` (rutas existen aunque las páginas son placeholders todavía).

**Criterios de aceptación**:
- Admin crea un usuario en el Sheet manualmente (con `pending`) → recibe email → activa → puede loguearse.
- "Olvidé mi contraseña" envía email → link funciona → password se actualiza → login exitoso con la nueva.
- Logout limpia `localStorage` y bloquea acceso a rutas protegidas.
- Sesión expira a las 8 horas y desloguea automáticamente.

**Dependencias**: Iter 3 cerrada.

**Riesgos**:
- **Cuota de MailApp 100/día** — si fallan envíos, capturarlo y mostrar al usuario mensaje claro.
- **Email a spam** — usar texto plano + HTML mínimo, sender autorizado.

**Complejidad**: M.

---

## Iteración 5 — Núcleo Usuario

**Objetivo**: un cliente puede ver su dashboard, ver/agendar sesiones, gestionar su calendario, ver alertas.

**Entregables**:

1. **Layout móvil + desktop**
   - `AppShellMobile` con bottom nav (Inicio, Agendar, Calendario, Alertas, Perfil).
   - `AppShellDesktop` con sidebar.
   - Detección por breakpoint (`< 768px` = móvil).

2. **Pantallas Usuario**
   - `UserDashboard` — próximo entrenamiento, estado del plan, sesiones restantes, racha de asistencia, alertas, logros recientes.
   - `BookingPage` (Agendar) — stepper: tipo → fecha/hora → entrenador → confirmar. Patrón booking-ID.
   - `UserCalendar` — vista mensual + semanal, click abre detalle.
   - `BookingDetail` — ver, cancelar (con check de margen), confirmar.
   - `MyPlan` — plan activo, sesiones restantes, fecha de vencimiento, historial.
   - `Alerts` — lista de alertas no leídas + leídas.
   - `UserProfile` — datos personales, preferencias, cambio de password.

3. **Endpoints Apps Script**
   - `getUserDashboard(userId)` — agrega data de varias hojas.
   - `createDraftBooking()` → devuelve `bookingId`.
   - `submitBooking(bookingId, payload)` → con `LockService`.
   - `cancelBooking(bookingId, motivo)`.
   - `getUserCalendar(userId, from, to)`.
   - `getMyPlan(userId)`.
   - `listAlerts(userId, leida?)`.
   - `markAlertRead(alertId)`.

4. **Triggers automáticos en Apps Script**
   - Time-driven cada hora: genera alertas `plan_por_vencer` para planes con `<7 días` para vencer.
   - Time-driven cada hora: genera alertas `sesion_proxima` para sesiones en próximas 2 horas.
   - Time-driven cada 10 min: marca borradores expirados.

**Criterios de aceptación**:
- Un cliente con plan activo puede agendar, ver el agendamiento en su calendario, y cancelarlo.
- Si intenta agendar en fecha posterior al vencimiento del plan, ve la advertencia y el booking queda con `requiere_autorizacion`.
- El dashboard muestra los datos correctos en menos de 3 segundos.
- Dos clientes intentando agendar el mismo cupo a la vez: solo uno gana (`LockService`).

**Dependencias**: Iter 4 cerrada.

**Riesgos**:
- **Latencia del dashboard** por múltiples lecturas → mitigación: caching agresivo + batch reads.
- **Conflictos de agendamiento** mal manejados → mitigación: tests manuales con 2 navegadores simultáneos.

**Complejidad**: L.

---

## Iteración 6 — Núcleo Entrenador

**Objetivo**: un entrenador puede gestionar su día, sus usuarios, sus rutinas y grupos.

**Entregables**:

1. **Pantallas Entrenador**
   - `TrainerDashboard` — sesiones de hoy, solicitudes pendientes, planes por vencer, baja asistencia, KPIs.
   - `TrainerCalendar` — día/semana/mes, con configuración de visibilidad.
   - `TrainerUsers` — lista de usuarios asignados con búsqueda y filtros.
   - `UserOperationalProfile` — desde el entrenador: ver datos operativos, plan, asistencia, indicadores, asignar rutina.
   - `RoutinesList` + `RoutineEditor` (constructor con ejercicios JSON estructurado).
   - `GroupsList` + `GroupEditor` (gestión de miembros).
   - `AssignRoutineModal`.
   - `RegisterAttendanceModal` (después de cada sesión completada).
   - `MessagesPage` (envío directo y masivo a sus usuarios/grupos).

2. **Endpoints Apps Script**
   - `getTrainerDashboard(trainerId)`.
   - `confirmBooking(bookingId)` / `rejectBooking(bookingId, motivo)`.
   - `listMyUsers(trainerId)`.
   - `getUserOperationalProfile(userId, asTrainerId)`.
   - `createRoutine`, `updateRoutine`, `archiveRoutine`.
   - `assignRoutine(routineId, userId|groupId, dates)`.
   - `createGroup`, `addGroupMember`, `removeGroupMember`.
   - `registerAttendance(bookingId, payload)` — actualiza `agendamiento.estado=completado` y crea `asistencia`.
   - `sendMessage(to, content)`.

3. **Triggers**
   - Generación de alertas `solicitud_pendiente` al entrenador cuando llega una nueva.
   - Generación de alertas `baja_asistencia` cuando un usuario falta a 2 sesiones consecutivas.

**Criterios de aceptación**:
- Entrenador puede confirmar/rechazar solicitudes y el cliente lo ve reflejado en tiempo cuasi-real.
- Asignación de rutinas a usuario y a grupo funciona.
- Al registrar asistencia con `presente=true`, las `sesiones_consumidas` del plan suben en 1.
- Mensajes masivos llegan a la lista de mensajes de cada destinatario.

**Dependencias**: Iter 5 cerrada.

**Riesgos**:
- **Editor de rutinas** complejo → mitigación: empezar con UI simple (tabla de ejercicios), refinar después.
- **Mensajes masivos** pueden generar muchas filas → mitigación: una sola fila + tabla `mensajes_lecturas` se llenará bajo demanda al leer.

**Complejidad**: L.

---

## Iteración 7 — Núcleo Admin

**Objetivo**: el Admin gestiona toda la operación: sedes, usuarios, entrenadores, planes, políticas.

**Entregables**:

1. **Pantallas Admin**
   - `AdminDashboard` — KPIs globales: usuarios/entrenadores/sedes activos, planes vendidos/vencidos, sesiones, ocupación, alertas críticas.
   - `UsersManagement` — CRUD usuarios + cambio de rol + suspender.
   - `TrainersManagement` — CRUD entrenadores + activación + asignación a sedes.
   - `SedesManagement` — CRUD sedes + bloqueos + asignación.
   - `PlansCatalogManagement` — CRUD planes del catálogo.
   - `UserPlansManagement` — asignar plan a usuario + transferencia.
   - `PoliciesManagement` — políticas de cancelación globales y por entrenador.
   - `GlobalCalendar` — calendario con filtros por sede / entrenador.
   - `Reports` — reportes básicos: ocupación, asistencia por sede, por entrenador.
   - `AuditLog` — visor de la hoja `auditoria` con filtros.
   - `Config` — edición de keys de la hoja `config`.

2. **Endpoints Apps Script** — CRUD para todas las entidades operativas, con validación de permisos `requireRole('admin')`.

3. **Lógica de transferencia de planes**
   - `transferPlan(planUsuarioId, nuevoEntrenadorId, motivo)` — solo admin.
   - Crea registro de auditoría detallado.

**Criterios de aceptación**:
- Admin puede crear sede → asignar entrenadores → asignar usuarios → todo el flujo funciona.
- Admin puede suspender un usuario y este no puede loguearse.
- Reportes muestran datos coherentes con los Sheets.
- Audit log permite ver qué admin hizo qué.

**Dependencias**: Iter 6 cerrada.

**Riesgos**:
- **Reportes lentos** con muchos filtros → mitigación: cache de 5 min + paginación.

**Complejidad**: L.

---

## Iteración 8 — Cierre: backups, polish, deploy, legal

**Objetivo**: dejar el MVP listo para piloto controlado.

**Entregables**:

1. **Backups automáticos**
   - `apps-script/backup.gs` — duplica el Sheet a Drive cada noche con nombre `Alfallo_backup_YYYY-MM-DD`.
   - Rotación: borra backups con más de 30 días.
   - Trigger time-driven configurado.

2. **Auditoría avanzada**
   - Visor mejorado en frontend con filtros por fecha, usuario, entidad.
   - Exportar audit log a CSV.
   - Trigger de rotación trimestral a `archivo_auditoria`.

3. **Documentación operativa**
   - `docs/05-operaciones.md` — cómo configurar triggers, restaurar backup, rotar PEPPER, troubleshooting de cuotas.
   - `docs/06-deploy.md` — cómo hacer un nuevo deployment de Apps Script y verificar que el frontend sigue conectado.

4. **Polish UI**
   - Estados vacíos en todas las listas.
   - Skeleton loaders.
   - Toasts para confirmaciones y errores.
   - Microcopy revisado (basado en `brand.jsx VoiceCard`).
   - Accesibilidad: focus visible, alt text, contraste verificado.

5. **Páginas legales públicas**
   - `/politica-datos`, `/terminos`, `/marcas`, `/equipo` — render del contenido de [03-disclaimer-legal.md](03-disclaimer-legal.md).
   - Footer global con links.
   - Banner de cookies/localStorage en primer ingreso.

6. **Activación de GitHub Pages**
   - Settings → Pages → Source: branch `gh-pages`.
   - Verificación de que `https://dyoma-web.github.io/alfallo/` carga.

7. **Checklist legal**
   - Recorrer §7 de [03-disclaimer-legal.md](03-disclaimer-legal.md).
   - Marcar lo completado.
   - Documentar lo pendiente para revisión legal.

8. **Carga inicial de datos del piloto**
   - Admin crea las primeras sedes, entrenadores y planes manualmente desde la UI.

**Criterios de aceptación**:
- Backup nocturno verificado: aparece en Drive el archivo del día siguiente.
- La URL pública funciona y carga sin errores.
- Footer muestra los 4 links legales.
- Flujo completo end-to-end funciona: cliente nuevo recibe invitación → activa → agenda → entrenador confirma → asiste → registra → cliente lo ve en su historial.

**Dependencias**: Iter 7 cerrada.

**Riesgos**:
- **Primera activación de GH Pages** puede tomar minutos → no es bloqueante, pero documentado.
- **Algún flujo no probado** → mitigación: lista de pruebas E2E manual antes de declarar el MVP listo.

**Complejidad**: M.

---

## Lo que **NO** está en MVP (Fase 2)

Documentado para no perderlo de vista:

- **Directorio público de gimnasios** con verificación de marca y reclamos.
- **Encuestas** de continuidad y satisfacción.
- **Calificaciones** entre usuarios y entrenadores.
- **Gamificación**: rachas, medallas, puntos, retos, ranking.
- **Galería de fotos de progreso** con upload real (no placeholders).
- **Notificaciones por canal extra**: WhatsApp, SMS, push.
- **Pasarela de pagos** y facturación electrónica.
- **App nativa móvil**.
- **Multi-idioma**.
- **Multi-país / multi-zona horaria operativa** (la estructura ya soporta UTC; falta UI de selección).
- **Especialistas aliados**: nutricionistas, fisioterapeutas.
- **Migración a Postgres + Node** (disparada por los criterios de [01-arquitectura.md §12.2](01-arquitectura.md)).

---

## Cadencia de revisión

Después de cada iteración:
1. Te aviso con resumen de lo entregado y dónde verificarlo (URL local con `npm run dev` o instrucciones de Apps Script).
2. Tú revisas y das OK explícito o me corriges puntos.
3. Solo con OK paso a la siguiente.

**Si en alguna iteración descubrimos que el alcance era irreal**, paramos y replanificamos antes de seguir. No vamos a forzar entregas.

---

## Cierre de Iteración 1

Con este documento completo, **Iteración 1 está terminada**.

Cerrá con OK → arranco Iteración 2: estructura del repo, Vite + TS + Tailwind con el tema de la marca portado, primer push a `main` con los 4 documentos.
