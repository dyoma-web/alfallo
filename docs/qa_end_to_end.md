# QA end-to-end · Al Fallo MVP

Guion ejecutable para validar el ciclo completo admin → profesional → afiliado contra Sheets/Apps Script real, antes de pensar en migración a producción.

---

## Pre-requisito · Bundle de Apps Script

Antes de empezar, asegúrate de que el bundle pegado en Apps Script está al día.

1. Local: `npm run gs:bundle` ya generado.
2. Apps Script: pegar `apps-script/bundle/Code.gs` en el editor.
3. Apps Script: ejecutar `bootstrap()` desde el dropdown de funciones para crear/migrar columnas faltantes.
4. Apps Script: ejecutar `diagnose()` y verificar que todas las hojas están presentes.

Si el último cambio toca columnas, **siempre** corre `bootstrap()` después de pegar el bundle.

---

## Cuentas para el QA

Usa cuentas reales en `usuarios` (creadas vía admin):
- **Admin** (super_admin existente).
- **Profesional A** (rol trainer).
- **Profesional B** (rol trainer, distinto de A).
- **Cliente X** (rol client).

Si no existen, créalos desde `/usuarios` como admin y activa via correo.

---

## 1. Admin · Estructura básica

### 1.1 Gimnasios

- [ ] Login como admin.
- [ ] Ir a `/gimnasios`. Crear "GymTest" (verificado=false).
- [ ] Verificar que aparece en lista con sedesCount=0.

### 1.2 Sedes con categoría

- [ ] Ir a `/sedes`. Crear sede "Sede Norte" vinculada a GymTest, categoría **Básica**, sin mensaje diferencial.
- [ ] Crear sede "Sede Élite" vinculada a GymTest, categoría **Élite**, mensaje diferencial: *"Esta sede tiene un costo adicional del 20% para planes de sede básica."*
- [ ] Verificar que ambas se ven en lista con su badge de categoría correcto.
- [ ] Editar Sede Norte y agregar un mensaje diferencial — guardar — verificar que persiste.

### 1.3 Bloqueo de sede

- [ ] Ir a `/calendario` (admin). Crear bloqueo en Sede Norte para mañana 10:00–12:00 con motivo "Mantenimiento".
- [ ] Verificar que aparece como evento de fondo en el calendario admin.
- [ ] Editar el bloqueo (cambiar motivo). Confirmar persistencia.

### 1.4 Profesional A — perfil completo

- [ ] Ir a `/usuarios`, abrir Profesional A → Perfil profesional.
- [ ] Categoría: **Entrenador**, Tipo: "Coach de fuerza".
- [ ] Editor de franja: lunes y miércoles 06:00–11:00 y 15:00–19:00.
- [ ] Cupos: personalizado=1, semipersonalizado=4, grupal=10.
- [ ] Visibilidad por defecto: solo franjas.
- [ ] Guardar.

### 1.5 Asignación profesional ↔ sedes

- [ ] En `/sedes`, abrir Sede Norte → Asignar Profesional A.
- [ ] Verificar trainersCount = 1.

### 1.6 Cliente X — sedes

- [ ] Abrir Cliente X → Sedes. Asignar Sede Norte como **base**.
- [ ] Verificar que aparece en row con badge "Base".

### 1.7 Cliente X — multi-profesional (NUEVO)

- [ ] Abrir Cliente X → Profesionales (botón nuevo).
- [ ] Agregar Profesional A: área Entrenamiento, categoría Entrenador personalizado, tipo "titular", **principal=sí**.
- [ ] Agregar Profesional B: área Médica, categoría Nutricionista, tipo "apoyo".
- [ ] Guardar. Verificar que ambos aparecen en la lista con sus campos correctos.
- [ ] Reabrir y confirmar que persistió.

### 1.8 Plan global

- [ ] Ir a `/planes`. Crear plan global:
  - Nombre: "10 sesiones básico"
  - Tipo: personalizado, 10 sesiones, COP 600.000, vigencia 60 días.
  - Área: entrenamiento, Categoría profesional: entrenador personalizado.
  - Categoría sede: **Básica**.
  - Gimnasio: GymTest.
- [ ] Asignar plan a Cliente X via "Asignar plan" desde el plan o desde Cliente X.

---

## 2. Profesional A · Operación

### 2.1 Login y dashboard

- [ ] Logout. Login como Profesional A.
- [ ] Verificar `/dashboard` muestra:
  - KPIs (sesiones hoy, solicitudes pendientes, completadas semana, usuarios activos).
  - Tarjeta de metas (vacía si no hay configuradas).
  - Próximas sesiones (debería estar vacío).
- [ ] Ir a `/perfil`.
- [ ] Crear meta económica del mes en curso: "Cuota Sede Norte" = 4.000.000 COP, tipo económica.
- [ ] Crear meta usuarios: "Activos" = 8.
- [ ] Verificar que se guardan y aparecen en la lista.

### 2.2 Mis usuarios

- [ ] Ir a `/usuarios`. Verificar que aparece Cliente X.
- [ ] Verificar que el badge muestra el tipo de acceso (asignado/profesional/sede compartida).
- [ ] Abrir perfil operativo de Cliente X. Verificar que se ven planes, asistencia (vacía), próximos.

### 2.3 Política de cancelación personalizada

- [ ] En `/calendario` profesional, abrir el modal de Políticas (botón en el header).
- [ ] Crear política: ventana 12h, bloquear fuera de margen=true, mensajes personalizados (cumplimiento y bloqueo).
- [ ] Guardar.

### 2.4 Agendar sesión para Cliente X

- [ ] En `/calendario`, abrir el modal "Agendar sesión".
- [ ] Seleccionar Cliente X, Profesional A, Sede Norte, fecha mañana 09:00, tipo personalizado.
- [ ] Verificar que el slot está dentro de la franja del trainer (mié 06:00–11:00 funciona, viernes no).
- [ ] Verificar que NO permite seleccionar el slot bloqueado por mantenimiento (10:00–12:00) si lo intentas.
- [ ] Confirmar. Verificar que la sesión queda en estado **confirmado** y aparece en el calendario.

---

## 3. Cliente X · Agendamiento end-to-end

### 3.1 Flujo agendar normal

- [ ] Logout. Login como Cliente X.
- [ ] Verificar `/dashboard` muestra plan activo y próxima sesión.
- [ ] Ir a `/agendar`.
- [ ] Seleccionar tipo personalizado, Profesional A, Sede Norte (su base), fecha futura dentro de franja.
- [ ] Confirmar slot disponible (sin warnings).
- [ ] Submit. Verificar que queda en estado **solicitado**.

### 3.2 Sede superior (NUEVO mensaje)

- [ ] Volver a `/agendar`. Cambiar la sede a **Sede Élite**.
- [ ] Verificar que aparece el WarningCard con el mensaje custom: *"Esta sede tiene un costo adicional del 20%..."*
- [ ] **No bloquea** — solo advierte. El submit debe estar habilitado.
- [ ] Submit. Verificar que queda en estado solicitado.

### 3.3 Bloqueo de sede

- [ ] En `/agendar`, intentar agendar en Sede Norte mañana 10:00 (en el bloqueo de mantenimiento).
- [ ] Verificar que el slot aparece deshabilitado en la grilla.
- [ ] Si intentas submit forzado: el backend debe rechazar con SEDE_BLOCKED.

### 3.4 Fuera de franja

- [ ] Intentar agendar en Sede Norte un viernes (fuera de la franja del trainer lunes/miércoles).
- [ ] Verificar que el slot aparece deshabilitado o muestra warning.
- [ ] Si fuerzas: backend rechaza con TRAINER_OUTSIDE_WORK_HOURS.

### 3.5 Cancelación con política personalizada

- [ ] Cliente X cancela una sesión que falta más de 12h: debe mostrar el mensaje de cumplimiento configurado por Profesional A.
- [ ] Cliente X intenta cancelar una sesión a < 12h: debe ver el mensaje de bloqueo y la cancelación falla.

---

## 4. Profesional A · Confirmación y registro

### 4.1 Aceptar solicitud

- [ ] Login como Profesional A.
- [ ] Ir a `/dashboard`. Aparece la solicitud pendiente del Cliente X.
- [ ] Confirmar la sesión. Pasa a confirmado o pactado (≤24h).
- [ ] Verificar alerta enviada a Cliente X.

### 4.2 Registro de asistencia

- [ ] Sobre una sesión confirmada cuya hora ya pasó: registrar asistencia presente=true con peso/observaciones.
- [ ] Verificar que la sesión pasa a **completado** y se descuenta una sesión del plan del cliente.
- [ ] Verificar racha del cliente sube.

---

## 5. Admin · Auditoría y revisión

- [ ] Login como admin. Ir a la pantalla de auditoría (si existe; sino, abrir hoja `auditoria` en Sheets).
- [ ] Verificar que las acciones críticas quedaron registradas: create_user, assign_trainer_to_sede, set_user_profesionales, create_sede_block, create_booking, confirm_booking, register_attendance, cancel_booking.

---

## 6. Solicitudes (gimnasios y planes)

### 6.1 Profesional sugiere plan global

- [ ] Login como Profesional A. Ir a `/planes`.
- [ ] Sobre un plan global, sugerir cambio (motivo "Subir precio +5%").
- [ ] Logout. Login admin → `/solicitudes`. Verificar que aparece tipo `cambio_plan`.
- [ ] Marcarla como aprobada o rechazada.
- [ ] Verificar alerta a Profesional A.

### 6.2 Profesional pide nueva sede

- [ ] Profesional A en `/solicitudes` crea solicitud `crear_sede` para GymTest con datos.
- [ ] Admin la aprueba.
- [ ] Verificar que se crea la sede en `/sedes` automáticamente.

---

## 7. Resumen — qué debe quedar verificado

Si todo lo anterior pasa sin fallar, el MVP está listo para el corte funcional:

- Auth completo (login, activación, password reset).
- CRUD admin completo (usuarios, sedes, gimnasios, planes, bloqueos).
- Multi-profesional por cliente operando.
- Multi-gym/sede operando con filtros y categorías.
- Booking respeta franja del trainer + bloqueos de sede + cupos.
- Política de cancelación personalizada operando con mensajes.
- Sede superior solo advierte (no bloquea) con mensaje custom.
- Auditoría completa.
- Solicitudes admin/profesional funcionando.

Después de este QA, los próximos pasos son **decisiones de producto** (granularidad de permisos cruzados, alertas avanzadas) o el **diseño de migración a Postgres**.

---

## Errores comunes a vigilar

- **Bundle desactualizado**: si algún endpoint nuevo falla con UNKNOWN_ACTION, no se pegó el bundle.
- **Columnas faltantes**: si un campo nuevo aparece undefined, falta correr `bootstrap()` después de pegar.
- **PEPPER perdido**: si los logins fallan masivamente, revisar Script Properties.
- **Date↔string en periodo**: si las metas no aparecen, revisar formato de columna `periodo` en hoja `metas_profesional` (debe ser texto `@`).
- **Permisos cruzados**: si Profesional B no ve a Cliente X, verificar que la asignación en `usuarios_profesionales` quedó con `estado='active'`.
