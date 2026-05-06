# Al Fallo · Modelo de datos

> Esquema de hojas del Google Sheet `Alfallo`. Cada hoja es una "tabla". El bootstrap inicial las crea todas vacías; las fase-2 quedan creadas pero sin uso hasta su iteración.

---

## 1. Principios de diseño

1. **Una hoja = una tabla**. Nada de mezclar entidades.
2. **IDs UUID v4** generados en backend. La columna `A` siempre es `id`. No usar el número de fila como identificador.
3. **Todas las fechas en UTC ISO 8601** (`2026-05-15T14:30:00Z`). El frontend convierte a `America/Bogota` para render.
4. **`snake_case`** para todos los nombres de columnas (más legible en hoja, consistente con SQL futuro).
5. **Soft delete**: nadie borra filas, todo tiene columna `estado`. Auditoría completa.
6. **Timestamps en cada tabla**: `created_at`, `updated_at`, opcional `created_by`.
7. **Foreign keys son strings UUID**. No hay constraints reales en Sheets — la integridad la valida Apps Script antes de escribir.
8. **JSON en celdas** solo cuando la estructura es accesoria al render principal (preferencias, datos de ejercicios). Nunca para datos sobre los que se filtre/busque.
9. **Hojas grandes** (`agendamientos`, `auditoria`) tienen su pareja `archivo_*` para rotación.

---

## 2. Convenciones de nombres y tipos

| Tipo lógico | Cómo se guarda | Ejemplo |
|---|---|---|
| ID | UUID v4 string | `9f3c1b2e-...` |
| Email | string lowercase | `ana@correo.co` |
| Teléfono | string sin formato | `3001234567` |
| Fecha-hora | ISO UTC | `2026-05-15T14:30:00Z` |
| Booleano | `TRUE`/`FALSE` | celda boolean nativa de Sheets |
| Enum | string en MAYÚSCULAS o snake | `confirmado` |
| Decimal (COP) | número | `120000` |
| Lista corta | CSV string | `pesas,cardio,funcional` |
| JSON | string serializado | `{"horario":"AM"}` |
| Foreign key | UUID del padre | `user_id`, `sede_id`, `entrenador_id` |

---

## 3. Mapa de relaciones (ERD textual)

```
usuarios ─┬─< usuarios_pwd (1:1)
          ├─< entrenadores_perfil (1:1, solo si rol=trainer)
          ├─< sesiones (1:N)
          ├─< tokens_temporales (1:N)
          ├─< planes_usuario (1:N)
          ├─< agendamientos (como cliente, 1:N)
          ├─< agendamientos (como entrenador, 1:N)
          ├─< asistencia (1:N)
          ├─< rutinas_asignadas (1:N)
          ├─< grupos_miembros (1:N)
          ├─< sedes_usuarios (M:N → sedes)
          ├─< mensajes (1:N envió, 1:N recibió)
          ├─< alertas (1:N)
          ├─< encuestas_respuestas (1:N)            ← fase 2
          ├─< calificaciones (1:N envió/recibió)    ← fase 2
          └─< logros_usuario (1:N)                  ← fase 2

sedes ────┬─< sedes_entrenadores (M:N → entrenadores)
          ├─< sedes_usuarios (M:N → usuarios)
          ├─< sedes_bloqueos (1:N)
          ├─< grupos (1:N)
          └─< agendamientos (1:N)

planes_catalogo ──< planes_usuario (1:N) ──< agendamientos (1:N)

grupos ───┬─< grupos_miembros (1:N → usuarios)
          ├─< rutinas_asignadas (1:N)
          └─< agendamientos (1:N, semi/grupales)

rutinas ──< rutinas_asignadas (1:N)

agendamientos ──< asistencia (1:1)
                ──< calificaciones (1:N)             ← fase 2

politicas_cancelacion (referenciada por entrenador, sede o global)

config — key/value global
auditoria — log de toda escritura
```

---

## 4. Lista completa de hojas

| # | Hoja | Bloque funcional | Estado | Iteración |
|---|---|---|---|---|
| 1 | `usuarios` | Identidad | MVP | 3 |
| 2 | `usuarios_pwd` | Identidad | MVP | 3 |
| 3 | `entrenadores_perfil` | Identidad | MVP | 3 |
| 4 | `sesiones` | Auth | MVP | 3 |
| 5 | `tokens_temporales` | Auth | MVP | 3 |
| 6 | `sedes` | Operación | MVP | 7 |
| 7 | `sedes_entrenadores` | Operación | MVP | 7 |
| 8 | `sedes_usuarios` | Operación | MVP | 7 |
| 9 | `sedes_bloqueos` | Operación | MVP | 7 |
| 10 | `planes_catalogo` | Comercial | MVP | 7 |
| 11 | `planes_usuario` | Comercial | MVP | 7 |
| 12 | `politicas_cancelacion` | Comercial | MVP | 7 |
| 13 | `agendamientos` | Core | MVP | 5 |
| 14 | `archivo_agendamientos` | Core | MVP (vacía) | 5 |
| 15 | `asistencia` | Core | MVP | 6 |
| 16 | `rutinas` | Entrenamiento | MVP | 6 |
| 17 | `rutinas_asignadas` | Entrenamiento | MVP | 6 |
| 18 | `grupos` | Entrenamiento | MVP | 6 |
| 19 | `grupos_miembros` | Entrenamiento | MVP | 6 |
| 20 | `mensajes` | Comunicación | MVP | 6 |
| 21 | `alertas` | Comunicación | MVP | 5 |
| 22 | `solicitudes` | Operación | MVP | 5 |
| 23 | `auditoria` | Sistema | MVP | 3 |
| 24 | `config` | Sistema | MVP | 3 |
| 25 | `indices` | Sistema (helper) | MVP | 3 |
| 26 | `encuestas` | Feedback | Fase 2 | — |
| 27 | `encuestas_respuestas` | Feedback | Fase 2 | — |
| 28 | `calificaciones` | Feedback | Fase 2 | — |
| 29 | `logros_catalogo` | Gamificación | Fase 2 | — |
| 30 | `logros_usuario` | Gamificación | Fase 2 | — |
| 31 | `puntos_usuario` | Gamificación | Fase 2 | — |
| 32 | `directorio_gimnasios` | Directorio | Fase 2 | — |
| 33 | `solicitudes_marca` | Directorio | Fase 2 | — |

**33 hojas en total.** El bootstrap (Iteración 3) las crea todas con sus headers y notas; las marcadas Fase 2 quedan vacías y sin lógica asociada.

---

## 5. Especificación de cada tabla — MVP

### 5.1. `usuarios`
**Propósito**: identidad central. Cliente, entrenador, admin y super_admin viven aquí.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `email` | string | ✅ | Único. Lowercase. |
| `rol` | enum | ✅ | `super_admin` / `admin` / `trainer` / `client` |
| `nombres` | string | ✅ | |
| `apellidos` | string | ✅ | |
| `nick` | string | | Apodo público. Único. |
| `cedula` | string | | Encriptada en fase 2; en MVP texto plano (dato sensible — restringir lectura). |
| `celular` | string | | |
| `foto_url` | string | | URL a foto en Drive (placeholder en MVP). |
| `estado` | enum | ✅ | `pending` / `active` / `suspended` / `archived` |
| `preferencias_notif` | JSON | | `{"in_app":true,"email":true,"alertas":["plan_vencer","sesion_24h"]}` |
| `privacidad_fotos` | enum | | `solo_yo` / `mi_entrenador` / `mi_grupo` / `publico` |
| `entrenador_asignado_id` | FK→usuarios | | Solo si `rol=client`. |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |
| `last_login_at` | datetime UTC | | |
| `created_by` | FK→usuarios | | Quién creó la cuenta. |

**Reglas**:
- `email` y `nick` únicos a nivel de toda la tabla.
- `entrenador_asignado_id` solo válido si el target tiene `rol=trainer`.
- Suspendido = no puede loguearse pero su histórico se conserva.

---

### 5.2. `usuarios_pwd`
**Propósito**: hashes separados de la identidad para reducir exposición.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `user_id` | FK→usuarios | ✅ | PK |
| `salt` | string hex | ✅ | 16 bytes random |
| `hash` | string hex | ✅ | SHA-256(salt + pepper + password) |
| `algoritmo` | enum | ✅ | `sha256-v1` (para futuras migraciones) |
| `updated_at` | datetime UTC | ✅ | |
| `forzar_cambio` | boolean | | TRUE en activación inicial. |

---

### 5.3. `entrenadores_perfil`
**Propósito**: extensión profesional de un `usuarios` con `rol=trainer`.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `user_id` | FK→usuarios | ✅ | PK |
| `perfil_profesional` | text | | Bio pública. |
| `habilidades` | CSV | | `pesas,cardio,funcional` |
| `tipos_entrenamiento` | CSV | | `personalizado,semipersonalizado,grupal` |
| `certificaciones` | text | | Texto libre o lista. |
| `restricciones` | text | | Lo que no entrena. |
| `redes_sociales` | JSON | | `{"ig":"@andrea","wa":"+57..."}` |
| `franja_trabajo` | JSON | | `{"lun":["06:00-12:00"],"mar":[...]}` UTC. |
| `politica_cancelacion_id` | FK→politicas_cancelacion | | Su política propia. |
| `visibilidad_default` | enum | ✅ | `nombres_visibles` / `solo_franjas` |
| `cupos_estrictos` | boolean | ✅ | Para semipersonalizados. |
| `meta_economica_mensual` | número | | COP |
| `meta_usuarios_activos` | número | | |
| `calificacion_promedio` | decimal | | Calculada (fase 2). |
| `total_calificaciones` | número | | |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |

---

### 5.4. `sesiones`
**Propósito**: tokens activos. Se valida en cada request.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `token` | UUID | ✅ | PK. Bearer token. |
| `user_id` | FK→usuarios | ✅ | |
| `rol` | enum | ✅ | Cacheado para evitar lookup en cada request. |
| `created_at` | datetime UTC | ✅ | |
| `expires_at` | datetime UTC | ✅ | created + 8h. |
| `last_seen_at` | datetime UTC | ✅ | Se renueva en cada request. |
| `user_agent` | string | | Para auditoría. |
| `ip` | string | | Lo que Apps Script pueda capturar (limitado). |
| `revoked` | boolean | ✅ | TRUE en logout. |

**Limpieza**: trigger horario marca `revoked=TRUE` los expirados; trigger nocturno borra los `revoked` con más de 7 días.

---

### 5.5. `tokens_temporales`
**Propósito**: activación de cuenta y reset de contraseña.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `token` | UUID | ✅ | PK |
| `tipo` | enum | ✅ | `activation` / `password_reset` |
| `user_id` | FK→usuarios | ✅ | |
| `created_at` | datetime UTC | ✅ | |
| `expires_at` | datetime UTC | ✅ | |
| `used_at` | datetime UTC | | NULL hasta que se use. |

**Reglas**: un token solo se puede usar una vez. Si `used_at != NULL`, rechazar.

---

### 5.6. `sedes`
**Propósito**: ubicaciones físicas donde se entrena. Solo Admin las crea.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `nombre` | string | ✅ | "Sede Norte" |
| `codigo_interno` | string | | "NOR-01" |
| `direccion` | string | | |
| `ciudad` | string | | "Bogotá" |
| `barrio` | string | | |
| `telefono` | string | | |
| `responsable` | string | | Nombre del responsable de sede. |
| `horarios` | JSON | | `{"lun":"05:00-22:00",...}` |
| `capacidad` | número | | Personas simultáneas máx. |
| `observaciones` | text | | |
| `servicios` | CSV | | `pesas,cardio,piscina,sauna` |
| `reglas` | text | | Reglas operativas. |
| `estado` | enum | ✅ | `active` / `suspended` / `archived` |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |

---

### 5.7. `sedes_entrenadores`
**Propósito**: tabla pivot M:N. Un entrenador puede trabajar en varias sedes.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `sede_id` | FK | ✅ | |
| `entrenador_id` | FK→usuarios | ✅ | |
| `desde` | datetime UTC | ✅ | |
| `hasta` | datetime UTC | | NULL = activo. |
| `estado` | enum | ✅ | `active` / `inactive` |

---

### 5.8. `sedes_usuarios`
**Propósito**: pivot M:N usuario-sede.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `sede_id` | FK | ✅ | |
| `user_id` | FK→usuarios | ✅ | |
| `principal` | boolean | ✅ | Una sola sede `principal=TRUE` por usuario. |
| `created_at` | datetime UTC | ✅ | |

---

### 5.8b. `usuarios_profesionales`
**Proposito**: pivot M:N afiliado-profesional para permitir varios profesionales por usuario.

| Columna | Tipo | Req | Descripcion |
|---|---|---|---|
| `id` | UUID | si | PK |
| `user_id` | FK usuarios | si | Afiliado. |
| `profesional_id` | FK usuarios | si | Profesional asignado. |
| `area_profesional` | enum/string | | Area amplia: medica, entrenamiento, etc. |
| `categoria_profesional` | enum/string | | Nutricion, fisioterapia, entrenamiento personalizado, clases grupales, etc. |
| `tipo_relacion` | string | | Titular, apoyo, seguimiento, evaluacion, etc. |
| `principal` | boolean | | Principal dentro de esa categoria. |
| `estado` | enum | si | `active` / `inactive` / `archived` |
| `created_at` | datetime UTC | si | |
| `updated_at` | datetime UTC | | |
| `created_by` | FK usuarios | | |

---

### 5.9. `sedes_bloqueos`
**Propósito**: días en que la sede está cerrada (festivos, mantenimiento).

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `sede_id` | FK | ✅ | NULL si es bloqueo global. |
| `desde_utc` | datetime UTC | ✅ | |
| `hasta_utc` | datetime UTC | ✅ | |
| `motivo` | string | ✅ | "Festivo", "Mantenimiento" |
| `creado_por` | FK→usuarios | ✅ | |
| `created_at` | datetime UTC | ✅ | |

---

### 5.10. `planes_catalogo`
**Propósito**: catálogo de planes ofrecidos. Por entrenador o globales.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `nombre` | string | ✅ | "10 sesiones personalizadas" |
| `descripcion` | text | | |
| `tipo` | enum | ✅ | `personalizado` / `semipersonalizado` / `grupal` |
| `num_sesiones` | número | ✅ | |
| `precio` | número | ✅ | Valor en `moneda`. |
| `moneda` | string | ✅ | `COP` por defecto. ISO 4217. |
| `vigencia_dias` | número | ✅ | Días desde fecha de compra. |
| `entrenador_id` | FK→usuarios | | NULL = plan de la plataforma. |
| `sede_id` | FK→sedes | | NULL = cualquier sede. |
| `estado` | enum | ✅ | `active` / `archived` |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |
| `created_by` | FK→usuarios | ✅ | |

---

### 5.11. `planes_usuario`
**Propósito**: instancia de un plan asignado a un usuario.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `user_id` | FK→usuarios | ✅ | Cliente. |
| `plan_catalogo_id` | FK→planes_catalogo | ✅ | |
| `entrenador_id` | FK→usuarios | ✅ | Entrenador titular. |
| `sede_id` | FK→sedes | | |
| `fecha_compra_utc` | datetime UTC | ✅ | |
| `fecha_vencimiento_utc` | datetime UTC | ✅ | Calculada. Editable por Admin. |
| `sesiones_totales` | número | ✅ | Snapshot del catálogo. |
| `sesiones_consumidas` | número | ✅ | Default 0, sube con asistencia confirmada. |
| `precio_pagado` | número | ✅ | |
| `moneda` | string | ✅ | |
| `estado` | enum | ✅ | `active` / `expired` / `cancelled` / `transferred` |
| `transferido_a` | FK→usuarios | | Si fue transferido a otro entrenador (solo Admin). |
| `transferido_at` | datetime UTC | | |
| `transferido_por` | FK→usuarios | ✅ | |
| `notas` | text | | |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |

---

### 5.12. `politicas_cancelacion`
**Propósito**: reglas de cancelación. Pueden ser de Admin (global), de un entrenador, o de una sede.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `nombre` | string | ✅ | "Estricta 24h" |
| `ventana_horas` | número | ✅ | Horas mínimas antes de la sesión. |
| `dentro_margen` | enum | ✅ | `sin_penalizacion` / `descuenta_sesion` |
| `fuera_margen` | enum | ✅ | `descuenta_sesion` / `no_permite` |
| `aplica_a` | enum | ✅ | `global` / `entrenador` / `sede` |
| `entidad_id` | string | | UUID del entrenador o sede si aplica. |
| `estado` | enum | ✅ | `active` / `archived` |
| `created_at` | datetime UTC | ✅ | |
| `created_by` | FK→usuarios | ✅ | |

---

### 5.13. `agendamientos` ⭐
**Propósito**: tabla central. Una fila por cada intento de agendamiento.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK. Generado al entrar a "Agendar". |
| `user_id` | FK→usuarios | ✅ | Cliente. |
| `entrenador_id` | FK→usuarios | ✅ | |
| `sede_id` | FK→sedes | | |
| `plan_usuario_id` | FK→planes_usuario | | NULL si es solicitud sin plan activo. |
| `grupo_id` | FK→grupos | | Solo para semi/grupal. |
| `tipo` | enum | ✅ | `personalizado` / `semipersonalizado` / `grupal` |
| `fecha_inicio_utc` | datetime UTC | | NULL en estado `borrador`. |
| `duracion_min` | número | | Default 60. |
| `capacidad_max` | número | | Solo en semi/grupal. |
| `estado` | enum | ✅ | Ver lista abajo. |
| `color` | string | | Hex (lo asigna entrenador). |
| `visibilidad_nombres` | boolean | ✅ | Snapshot del setting del entrenador al momento de creación. |
| `motivo_cancelacion` | string | | |
| `cancelado_por` | FK→usuarios | | |
| `cancelado_at_utc` | datetime UTC | | |
| `dentro_margen` | boolean | | Calculado al cancelar. |
| `requiere_autorizacion` | boolean | | TRUE si plan vencido al agendar. |
| `autorizado_por` | FK→usuarios | | |
| `autorizado_at_utc` | datetime UTC | | |
| `notas_entrenador` | text | | |
| `notas_usuario` | text | | |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |
| `created_by` | FK→usuarios | ✅ | |

**Estados** (enum):
| Estado | Significado |
|---|---|
| `borrador` | Creado al entrar a la sección. Sin datos completos. |
| `solicitado` | Usuario completó el formulario. Espera confirmación del entrenador. |
| `confirmado` | Entrenador aceptó. |
| `pactado` | Confirmado y dentro de la ventana de inicio (próximas 24h). |
| `completado` | Sucedió. Asistencia registrada. |
| `cancelado` | Cancelado por usuario o entrenador. |
| `no-asistido` | No se presentó. |
| `expirado` | `borrador` con más de 10 min sin completar. |
| `rechazado` | Entrenador rechazó la solicitud. |
| `requiere_autorizacion` | Usuario agendó con plan vencido. |

**Reglas de integridad** (validadas en Apps Script):
- No puede haber dos `confirmado`/`pactado` con mismo `entrenador_id` + `fecha_inicio_utc` (excepto semi/grupal hasta `capacidad_max`).
- Si `tipo=personalizado`, `capacidad_max` debe ser 1 o NULL.
- Cambios de estado solo siguen el grafo válido (no se puede pasar de `cancelado` a `confirmado`).

---

### 5.14. `archivo_agendamientos`
Misma estructura que `agendamientos`. Trigger nocturno mueve registros con estado final y `updated_at` mayor a 90 días.

---

### 5.15. `asistencia`
**Propósito**: registro de asistencia + indicadores opcionales.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `agendamiento_id` | FK | ✅ | 1:1 con un `agendamiento` en estado `completado`/`no-asistido`. |
| `user_id` | FK→usuarios | ✅ | |
| `entrenador_id` | FK→usuarios | ✅ | |
| `presente` | boolean | ✅ | |
| `llegada_utc` | datetime UTC | | |
| `salida_utc` | datetime UTC | | |
| `peso` | decimal | | kg |
| `frec_card_max` | número | | bpm |
| `frec_card_prom` | número | | bpm |
| `saturacion` | número | | % |
| `presion_sis` | número | | mmHg |
| `presion_dia` | número | | mmHg |
| `dolor` | número | | 1-10 |
| `energia` | número | | 1-10 |
| `observaciones` | text | | |
| `created_at` | datetime UTC | ✅ | |
| `created_by` | FK→usuarios | ✅ | El entrenador que registra. |

---

### 5.16. `rutinas`
**Propósito**: plantillas de rutinas creadas por entrenadores.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `nombre` | string | ✅ | |
| `descripcion` | text | | |
| `creada_por` | FK→usuarios | ✅ | Entrenador. |
| `nivel` | enum | | `principiante` / `intermedio` / `avanzado` |
| `grupos_musculares` | CSV | | `tren_superior,core` |
| `duracion_estimada_min` | número | | |
| `ejercicios` | JSON | ✅ | `[{nombre,series,reps,peso,descanso,notas},...]` |
| `publica` | boolean | ✅ | TRUE = compartible entre entrenadores. |
| `estado` | enum | ✅ | `active` / `archived` |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |

---

### 5.17. `rutinas_asignadas`
**Propósito**: instancia de rutina asignada a usuario o grupo.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `rutina_id` | FK | ✅ | |
| `user_id` | FK→usuarios | | NULL si es para grupo. |
| `grupo_id` | FK→grupos | | NULL si es para usuario. |
| `entrenador_id` | FK→usuarios | ✅ | |
| `fecha_inicio_utc` | datetime UTC | ✅ | |
| `fecha_fin_utc` | datetime UTC | | |
| `estado` | enum | ✅ | `active` / `completed` / `archived` |
| `notas` | text | | |
| `created_at` | datetime UTC | ✅ | |

**Regla**: exactamente uno de `user_id` / `grupo_id` debe estar lleno.

---

### 5.18. `grupos`
**Propósito**: agrupaciones para entrenamientos semipersonalizados o grupales.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `nombre` | string | ✅ | |
| `descripcion` | text | | |
| `entrenador_id` | FK→usuarios | ✅ | |
| `sede_id` | FK→sedes | | |
| `tipo` | enum | ✅ | `semipersonalizado` / `grupal` |
| `capacidad_max` | número | ✅ | |
| `color` | string | | Para calendario. |
| `estado` | enum | ✅ | `active` / `archived` |
| `created_at` | datetime UTC | ✅ | |
| `updated_at` | datetime UTC | ✅ | |

---

### 5.19. `grupos_miembros`
| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `grupo_id` | FK | ✅ | |
| `user_id` | FK→usuarios | ✅ | |
| `fecha_ingreso_utc` | datetime UTC | ✅ | |
| `fecha_salida_utc` | datetime UTC | | |
| `estado` | enum | ✅ | `active` / `inactive` |

---

### 5.20. `mensajes`
**Propósito**: mensajería interna directa o masiva.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `de_user_id` | FK→usuarios | ✅ | |
| `para_user_id` | FK→usuarios | | NULL si es masivo. |
| `para_grupo_id` | FK→grupos | | |
| `para_rol` | enum | | `all` / `clients` / `trainers` (solo admin) |
| `asunto` | string | | |
| `contenido` | text | ✅ | |
| `created_at` | datetime UTC | ✅ | |

**Reglas**: exactamente uno de `para_user_id` / `para_grupo_id` / `para_rol` debe estar lleno.

Estado de lectura se modela en hoja aparte `mensajes_lecturas` (creada en Iteración 6).

---

### 5.21. `alertas`
**Propósito**: notificaciones generadas por el sistema o por entrenadores.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `user_id` | FK→usuarios | ✅ | Destinatario. |
| `tipo` | enum | ✅ | Ver lista abajo. |
| `severidad` | enum | ✅ | `info` / `warn` / `error` |
| `titulo` | string | ✅ | |
| `descripcion` | text | | |
| `accion_url` | string | | Hash route. |
| `entidad_ref` | string | | UUID al que apunta (booking, plan, etc.) |
| `leida` | boolean | ✅ | Default FALSE. |
| `leida_at_utc` | datetime UTC | | |
| `created_at` | datetime UTC | ✅ | |
| `expires_at_utc` | datetime UTC | | |

**Tipos de alerta**:
- `plan_por_vencer`, `plan_vencido`
- `sesion_proxima`, `sesion_24h`, `sesion_confirmada`, `sesion_cancelada`, `sesion_rechazada`
- `solicitud_pendiente` (al entrenador)
- `requiere_autorizacion` (al entrenador)
- `baja_asistencia` (al entrenador)
- `mensaje_nuevo`
- `cuenta_activacion`, `password_reset`
- `sistema_anuncio`

---

### 5.22. `solicitudes`
**Propósito**: peticiones que requieren aprobación humana (otros tipos de aprobaciones).

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `tipo` | enum | ✅ | `cambio_entrenador` / `transferencia_plan` / `agendamiento_fuera_plan` / `correccion_asistencia` |
| `user_id` | FK→usuarios | ✅ | Quien solicita. |
| `target_id` | string | | UUID de la entidad afectada. |
| `datos` | JSON | | Detalle libre. |
| `estado` | enum | ✅ | `pending` / `approved` / `rejected` |
| `resuelta_por` | FK→usuarios | | |
| `resuelta_at_utc` | datetime UTC | | |
| `motivo_resolucion` | text | | |
| `created_at` | datetime UTC | ✅ | |

---

### 5.23. `auditoria`
**Propósito**: log inmutable de toda escritura.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `id` | UUID | ✅ | PK |
| `created_at_utc` | datetime UTC | ✅ | |
| `user_id` | FK→usuarios | | NULL en eventos del sistema. |
| `accion` | string | ✅ | `create` / `update` / `delete` / `login` / `logout` / `failed_login` |
| `entidad` | string | ✅ | `usuario` / `agendamiento` / etc. |
| `entidad_id` | string | | |
| `datos_antes` | JSON | | Solo para updates. |
| `datos_despues` | JSON | | |
| `ip` | string | | |
| `user_agent` | string | | |
| `resultado` | enum | ✅ | `ok` / `error` / `denied` |
| `error_msg` | string | | |

**Rotación**: trigger mensual mueve a `archivo_auditoria` (creada implícitamente) los registros con más de 12 meses.

---

### 5.24. `config`
**Propósito**: configuración global mutable. Editable solo por super_admin.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `key` | string | ✅ | PK. `dot.notation`. |
| `value` | string | ✅ | Serializado (JSON si es complejo). |
| `tipo` | enum | ✅ | `string` / `number` / `boolean` / `json` |
| `descripcion` | string | | |
| `updated_at_utc` | datetime UTC | ✅ | |
| `updated_by` | FK→usuarios | ✅ | |

**Keys iniciales**:
- `app.name` = `Al Fallo`
- `app.timezone_default` = `America/Bogota`
- `app.currency_default` = `COP`
- `app.session_ttl_hours` = `8`
- `app.activation_token_ttl_hours` = `24`
- `app.reset_token_ttl_hours` = `1`
- `app.draft_booking_ttl_minutes` = `10`
- `app.archive_after_days` = `90`
- `app.disclaimer_url` = `/disclaimer`
- `notif.email_enabled` = `true`

---

### 5.25. `indices`
**Propósito**: hoja-helper para acelerar lookups por email/cedula/nick.

| Columna | Tipo | Req | Descripción |
|---|---|---|---|
| `entidad` | string | ✅ | `email` / `cedula` / `nick` |
| `valor` | string | ✅ | Lowercase. |
| `target_id` | string | ✅ | UUID al que apunta. |

Se mantiene desde el código (no es trigger). Cada `create`/`update` que toque emails actualiza esta hoja.

---

## 6. Hojas Fase 2 (creadas vacías en bootstrap)

Para no tener que migrar después, las creamos con headers desde el inicio:

### 6.1. `encuestas`, `encuestas_respuestas`
Encuestas de continuidad y satisfacción.

### 6.2. `calificaciones`
Estrellas y comentarios entre usuarios y entrenadores.

### 6.3. `logros_catalogo`, `logros_usuario`, `puntos_usuario`
Sistema de gamificación: rachas, medallas, puntos, retos.

### 6.4. `directorio_gimnasios`, `solicitudes_marca`
Directorio público multi-tenant. Permite a dueños de marca reclamar/restringir el uso de su nombre.

> Especificaremos columnas detalladas cuando lleguemos a la iteración correspondiente. Por ahora, headers básicos para que el bootstrap las cree.

---

## 7. Bootstrap del Sheet

En la **Iteración 3** se generará un script `bootstrap.gs` que, ejecutado una vez:

1. Verifica qué hojas faltan en el Sheet `Alfallo`.
2. Crea las que falten con sus headers exactos.
3. Aplica formato: header en negrita, fila congelada, validaciones de enum donde apliquen, formato de fecha en columnas datetime.
4. Crea un `super_admin` semilla con email `david.yomayusa@innovahub.org` (password se setea por activación).
5. Inserta los `config` keys iniciales.
6. Inserta una `politica_cancelacion` global default.
7. Genera el `PEPPER` aleatorio y lo guarda en Script Properties (si no existe).

---

## 8. Estimación de tamaño

Con un piloto de **30 entrenadores × 20 usuarios c/u = 600 usuarios**:
- `usuarios`: ~600 filas
- `agendamientos` activos: ~3 sesiones/usuario/semana × 600 × 4 semanas = **~7200 filas/mes**
- En 6 meses: ~43.000 filas → archivado mensual a `archivo_agendamientos`.
- `auditoria`: ~50 escrituras/usuario/día × 600 × 30 = **~900.000 filas/mes** ← este es el que duele.

Por eso `auditoria` tiene su propia rotación trimestral, no anual como las demás.

**Capacidad del Sheet**: 10 millones de celdas total (todas las hojas sumadas). Con 33 hojas y rotaciones, mantenernos por debajo del 30% del límite es viable durante 12 meses de piloto.

---

## 9. Lo que **no** se modela aquí

- **Pagos / facturación electrónica**: solo registro informativo (`precio_pagado` en `planes_usuario`). Sin integración con DIAN, sin facturas reales.
- **Storage de fotos**: en MVP usamos placeholders de iniciales. Cuando se implemente upload, las fotos van a Drive y se guarda solo la URL en `usuarios.foto_url`.
- **Multi-moneda**: el campo `moneda` existe pero el MVP solo opera en COP. Cambiar moneda es decisión del Admin y afecta solo a planes nuevos.
- **Multi-país**: aunque el modelo soporta varias zonas horarias (todo UTC), el MVP solo opera en Colombia.

---

**Próximo documento**: [03-disclaimer-legal.md](03-disclaimer-legal.md) — política de tratamiento de datos personales (Ley 1581/2012), términos de uso, disclaimer sobre marcas de gimnasios.
