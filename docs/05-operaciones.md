# Al Fallo · Operaciones

> Manual de operación para el equipo de administración. Cubre setup,
> backups, recuperación y troubleshooting de las cosas que pueden romperse.

---

## 1. Setup inicial (una sola vez)

Sigue este orden la **primera vez** que prepares el sistema:

### 1.1. Bootstrap del Sheet
1. Apps Script editor → función `bootstrap` → ▷ Run
2. Anota el **PEPPER** generado en un gestor de contraseñas seguro
3. Anota el **link de activación** del super admin

### 1.2. Datos de prueba (opcional, solo dev/staging)
1. Apps Script editor → función `seedDevData` → ▷ Run
2. Anota el link de activación del cliente test

### 1.3. Autorizar envío de emails
1. Apps Script editor → función `authorizeMailScope` → ▷ Run
2. Acepta el permiso de Google
3. Verifica que llegue el email de prueba

### 1.4. Configurar trigger de backup diario
1. Apps Script editor → función `setupBackupTrigger` → ▷ Run
2. Verifica en **Apps Script editor → ⏲ Triggers** que aparezca:
   - Function: `dailyBackup`
   - Event source: Time-driven
   - Frequency: Day timer, Hour 2-3 AM, America/Bogota

### 1.5. (Opcional) Carpeta de Drive específica para backups
Por defecto los backups van a la raíz de tu Drive. Si quieres una carpeta dedicada:
1. Crea una carpeta en Drive (ej. "Al Fallo Backups")
2. Copia el ID de la carpeta de la URL: `https://drive.google.com/drive/folders/XXXXXX`
3. Apps Script editor → ⚙ Project Settings → Script Properties → **Add property**
4. Property: `BACKUP_FOLDER_ID`, Value: `XXXXXX` (el ID copiado)
5. Save

---

## 2. Backups

### 2.1. Cómo funcionan
- Cada noche, entre 02:00 y 03:00 hora Bogotá, `dailyBackup()` corre automáticamente
- Crea una copia exacta del Sheet `Alfallo` con nombre `Alfallo_backup_YYYY-MM-DD_HH-MM`
- La copia incluye **todas las hojas y todos los datos**
- Los backups con más de 30 días se mueven a la papelera de Drive
- Los backups en papelera se borran definitivamente a los 30 días adicionales según política de Google

### 2.2. Verificar que están corriendo
Apps Script editor → función `listBackups` → ▷ Run → mira los logs.

Deberías ver algo como:
```
=== BACKUPS DISPONIBLES (5) ===
  Alfallo_backup_2026-05-08_02-15 · 1247 KB · 2026-05-08T07:15:23.000Z
  Alfallo_backup_2026-05-07_02-15 · 1235 KB · 2026-05-07T07:15:18.000Z
  ...
```

### 2.3. Restaurar de un backup
**Cuando se necesita** (raro, pero importante):
- El Sheet activo se corrompió, alguien borró datos críticos por error,
  o fallaron escrituras y el estado quedó inconsistente.

**Cómo se hace** (paso a paso):
1. Ve a Drive y abre el backup más reciente que NO tenga el problema
2. Verifica visualmente que tiene los datos esperados
3. Decide la estrategia:
   - **A. Reemplazo total**: reemplazar el Sheet activo por el backup
   - **B. Recuperación parcial**: copiar solo las hojas afectadas

**Estrategia A (reemplazo total)**:
1. Renombra el Sheet activo `Alfallo` a `Alfallo_corrompido_YYYY-MM-DD`
2. Renombra el backup elegido a `Alfallo`
3. Apps Script editor → ⚙ Project Settings → Script Properties:
   - Edita `SHEET_ID` con el ID del nuevo sheet (el que era backup)
4. Re-deploy del Web App (Deploy → Manage → Edit → New version)
5. Ejecuta `diagnose()` para verificar que las 33 hojas están bien

**Estrategia B (recuperación parcial)**:
1. Abre el backup
2. Selecciona la pestaña que quieres recuperar → clic derecho → **Copy to → Existing spreadsheet**
3. Elige el Sheet activo
4. Renombra la pestaña copiada (vendrá con sufijo `Copy of`)
5. En el Sheet activo: borra la pestaña corrompida
6. Renombra la copiada al nombre original (ej. `agendamientos`)

⚠️ **Importante**: Apps Script Web App sigue funcionando normalmente durante la
restauración SI no cambias el `SHEET_ID`. Si lo cambias (Estrategia A), hay
una ventana de inconsistencia hasta que redeployes.

### 2.4. Backup manual fuera del trigger
Apps Script editor → función `dailyBackup` → ▷ Run → ahora.

Útil antes de hacer cambios riesgosos (migrar datos, agregar columnas masivas).

---

## 3. PEPPER — la pieza más sensible

### 3.1. Qué es
Un string aleatorio de 64 caracteres hex que se mezcla con cada password
antes de hashearla con SHA-256. Vive en **Script Properties** del Apps
Script con la key `PEPPER`.

### 3.2. Por qué importa
Si el PEPPER se pierde, **TODOS los hashes de password quedan inválidos**.
Nadie podría loguearse. La única recuperación sería forzar reset de password
para todos los usuarios uno por uno.

### 3.3. Reglas
- **Anótalo** en tu gestor de contraseñas la primera vez que se genera (durante `bootstrap()`)
- **Nunca lo borres** de Script Properties
- **Nunca lo cambies** una vez en producción (rompería todo)
- **Nunca lo expongas** en logs, código, ni mensajes — está cifrado de facto solo si nadie lo lee

### 3.4. Si lo perdiste pero todavía tienes acceso al Sheet
- Verifica si está en Script Properties: ⚙ Project Settings → Script Properties
- Si está, anótalo en tu gestor ahora mismo

### 3.5. Si lo perdiste irreversiblemente
- Generar uno nuevo y forzar reset masivo:
  1. Borra el PEPPER actual de Script Properties
  2. Ejecuta `bootstrap()` (genera uno nuevo)
  3. Para cada usuario activo, ejecuta `adminResendActivation` desde el dashboard admin
  4. Notifícales por email externo (gestor de email tradicional) que su password vieja ya no funciona

---

## 4. Troubleshooting

### 4.1. "Service invoked too many times" / cuotas excedidas
- Apps Script tiene cuota diaria de **6 horas de ejecución total** en cuenta gratuita
- Si la app empieza a fallar en horas pico, revisa **Apps Script editor → Executions** para ver patrones
- Mitigación inmediata: deshabilitar triggers no críticos por unas horas hasta que la cuota se resetee a medianoche PT

### 4.2. Email de password reset no llega
1. Verifica primero que `authorizeMailScope` se haya ejecutado con éxito (paso §1.3)
2. Cuota: `MailApp.getRemainingDailyQuota()` — 100/día gratis, 1500/día Workspace
3. Spam: muchas veces los emails de Google a Google se filtran como promociones
4. Si nada de lo anterior — revisa Apps Script Executions, busca el último doPost con `requestPasswordReset` y mira los logs

### 4.3. "Hoja no encontrada"
- Probablemente alguien borró una hoja del Sheet
- Solución: ejecuta `diagnose()` para ver qué falta, luego `bootstrap()` para recrearla
- Las nuevas filas vendrán vacías. Si tenían datos, restaura el backup más reciente

### 4.4. "PEPPER no está configurado"
- El usuario o un script borró la property por error
- ⚠️ **NO ejecutes `bootstrap()` para regenerarlo** — eso invalidaría todos los logins existentes
- Si tienes el valor original anotado, vuelve a ponerlo en Script Properties manualmente
- Si no lo tienes, sigue §3.5

### 4.5. Web App devuelve "No se pudo abrir el archivo"
- El deployment cambió de URL o expiró
- Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
- Si la URL cambia (debería NO cambiar), avisar al frontend (cambiar `apiUrl` en `src/lib/config.ts`)

### 4.6. Frontend dice "Sesión expirada" todo el tiempo
- TTL de sesión es 8 horas (configurable en hoja `config.app.session_ttl_hours`)
- Si pasa muy seguido, sube el TTL en la hoja
- Verifica que la hoja `sesiones` tenga las filas activas y sus `expires_at` no estén en el pasado

### 4.7. Doble-booking ocurrió a pesar de LockService
- LockService tiene timeout de 10s. Si dos requests llegaron en exactamente la misma ventana de microsegundos, el primero gana, el segundo recibe `SLOT_BUSY` y debe reintentar
- Si ves dos bookings confirmados para el mismo entrenador a la misma hora, es bug — revisa `bookings.gs` y el flujo de `submitBooking`

---

## 5. Checklist mensual del equipo de administración

- [ ] Verificar que los backups corrieron los últimos 30 días (`listBackups()`)
- [ ] Revisar `auditoria` por accesos sospechosos (`failed_login` masivos)
- [ ] Revisar usuarios pendientes con más de 24h sin activar (resend o eliminar)
- [ ] Revisar cuota de email (`MailApp.getRemainingDailyQuota()`) si hay nuevos usuarios
- [ ] Verificar que el deployment activo siga siendo el correcto

---

## 6. Cuándo migrar a infraestructura real

Disparadores documentados en [01-arquitectura.md §12.2](01-arquitectura.md). Cualquiera de estos:
- >50 usuarios concurrentes activos
- Errores frecuentes de cuota
- Necesidad de pagos / facturación electrónica
- Notificaciones masivas (>100 emails/día)
- Acuerdo comercial con un primer gimnasio que pague

Cuando llegue el momento, el frontend es portable porque toda la API
está abstraída en `src/lib/api.ts`. Solo se reescribe el backend a
Node.js + Postgres (Supabase / Neon / Railway).
