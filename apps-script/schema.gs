/**
 * schema.gs — Definición de las 33 hojas del Sheet "Alfallo".
 *
 * Single source of truth para:
 *  - bootstrap.gs (crea las hojas)
 *  - db.gs (mapea filas <-> objetos)
 *
 * Espejo en docs/02-modelo-datos.md. Si cambias una hoja allí, cambia aquí también.
 */

// ──────────────────────────────────────────────────────────────────────────
// SCHEMA — { sheetName: [headerCols...] }
// El orden importa: primero columnas de identidad/operación, luego auditoría.
// ──────────────────────────────────────────────────────────────────────────
const SCHEMA = {

  // ─── Identidad & Auth (MVP — Iter 3) ───────────────────────────────────
  usuarios: [
    'id', 'email', 'rol', 'nombres', 'apellidos', 'nick',
    'cedula', 'celular', 'foto_url', 'estado',
    'preferencias_notif', 'privacidad_fotos', 'entrenador_asignado_id',
    'created_at', 'updated_at', 'last_login_at', 'created_by'
  ],

  usuarios_pwd: [
    'user_id', 'salt', 'hash', 'algoritmo', 'updated_at', 'forzar_cambio'
  ],

  entrenadores_perfil: [
    'user_id', 'perfil_profesional', 'habilidades', 'tipos_entrenamiento',
    'certificaciones', 'restricciones', 'redes_sociales', 'franja_trabajo',
    'politica_cancelacion_id', 'visibilidad_default', 'cupos_estrictos',
    'cupos_personalizado', 'cupos_semipersonalizado', 'cupos_grupal',
    'meta_economica_mensual', 'meta_usuarios_activos',
    'calificacion_promedio', 'total_calificaciones',
    'created_at', 'updated_at'
  ],

  sesiones: [
    'token', 'user_id', 'rol', 'created_at', 'expires_at',
    'last_seen_at', 'user_agent', 'ip', 'revoked'
  ],

  tokens_temporales: [
    'token', 'tipo', 'user_id', 'created_at', 'expires_at', 'used_at'
  ],

  // ─── Operación: Sedes (MVP — Iter 7) ───────────────────────────────────
  sedes: [
    'id', 'nombre', 'codigo_interno', 'direccion', 'ciudad', 'barrio',
    'telefono', 'responsable', 'horarios', 'capacidad', 'observaciones',
    'servicios', 'reglas', 'estado', 'gimnasio_id',
    'created_at', 'updated_at'
  ],

  // Iter 10: gimnasios agrupan sedes (ej. Bodytech, SmartFit). Solo Admin
  // los crea. Los entrenadores piden creación vía solicitudes.
  gimnasios: [
    'id', 'nombre', 'descripcion', 'logo_url', 'pais',
    'verificado', 'estado',
    'created_at', 'updated_at', 'created_by'
  ],

  // Iter 12: franjas de no-disponibilidad. Trainers y admin las crean.
  // Bloquean agendamiento del trainer en esos horarios.
  // Recurrencia simple: none/daily/weekly con dias_semana (CSV de 0-6,
  // donde 0=domingo) y intervalo (cada N días/semanas).
  unavailability: [
    'id', 'entity_type', 'entity_id',
    'titulo', 'descripcion',
    'fecha_inicio_utc', 'fecha_fin_utc',
    'recurrence', 'dias_semana', 'intervalo', 'fecha_fin_recurrencia',
    'estado',
    'created_at', 'updated_at', 'created_by'
  ],

  sedes_entrenadores: [
    'id', 'sede_id', 'entrenador_id', 'desde', 'hasta', 'estado'
  ],

  sedes_usuarios: [
    'id', 'sede_id', 'user_id', 'principal', 'created_at'
  ],

  sedes_bloqueos: [
    'id', 'sede_id', 'desde_utc', 'hasta_utc', 'motivo',
    'creado_por', 'created_at'
  ],

  // ─── Comercial: Planes (MVP — Iter 7) ──────────────────────────────────
  planes_catalogo: [
    'id', 'nombre', 'descripcion', 'tipo', 'num_sesiones',
    'precio', 'moneda', 'vigencia_dias', 'entrenador_id', 'sede_id',
    'cupos_max_simultaneos', 'cupos_estricto',
    'estado', 'created_at', 'updated_at', 'created_by'
  ],

  planes_usuario: [
    'id', 'user_id', 'plan_catalogo_id', 'entrenador_id', 'sede_id',
    'fecha_compra_utc', 'fecha_vencimiento_utc',
    'sesiones_totales', 'sesiones_consumidas',
    'precio_pagado', 'moneda', 'estado',
    'transferido_a', 'transferido_at', 'transferido_por',
    'notas', 'created_at', 'updated_at'
  ],

  politicas_cancelacion: [
    'id', 'nombre', 'ventana_horas', 'dentro_margen', 'fuera_margen',
    'aplica_a', 'entidad_id', 'estado', 'created_at', 'created_by'
  ],

  // ─── Core: Agendamientos (MVP — Iter 5) ────────────────────────────────
  agendamientos: [
    'id', 'user_id', 'entrenador_id', 'sede_id', 'plan_usuario_id', 'grupo_id',
    'tipo', 'fecha_inicio_utc', 'duracion_min', 'capacidad_max',
    'estado', 'color', 'visibilidad_nombres',
    'motivo_cancelacion', 'cancelado_por', 'cancelado_at_utc', 'dentro_margen',
    'requiere_autorizacion', 'motivo_autorizacion',
    'autorizado_por', 'autorizado_at_utc',
    'notas_entrenador', 'notas_usuario',
    'created_at', 'updated_at', 'created_by'
  ],

  archivo_agendamientos: [
    'id', 'user_id', 'entrenador_id', 'sede_id', 'plan_usuario_id', 'grupo_id',
    'tipo', 'fecha_inicio_utc', 'duracion_min', 'capacidad_max',
    'estado', 'color', 'visibilidad_nombres',
    'motivo_cancelacion', 'cancelado_por', 'cancelado_at_utc', 'dentro_margen',
    'requiere_autorizacion', 'autorizado_por', 'autorizado_at_utc',
    'notas_entrenador', 'notas_usuario',
    'created_at', 'updated_at', 'created_by', 'archivado_at'
  ],

  asistencia: [
    'id', 'agendamiento_id', 'user_id', 'entrenador_id', 'presente',
    'llegada_utc', 'salida_utc',
    'peso', 'frec_card_max', 'frec_card_prom', 'saturacion',
    'presion_sis', 'presion_dia', 'dolor', 'energia',
    'observaciones', 'created_at', 'created_by'
  ],

  // ─── Entrenamiento (MVP — Iter 6) ──────────────────────────────────────
  rutinas: [
    'id', 'nombre', 'descripcion', 'creada_por', 'nivel',
    'grupos_musculares', 'duracion_estimada_min', 'ejercicios',
    'publica', 'estado', 'created_at', 'updated_at'
  ],

  rutinas_asignadas: [
    'id', 'rutina_id', 'user_id', 'grupo_id', 'entrenador_id',
    'fecha_inicio_utc', 'fecha_fin_utc', 'estado', 'notas', 'created_at'
  ],

  grupos: [
    'id', 'nombre', 'descripcion', 'entrenador_id', 'sede_id',
    'tipo', 'capacidad_max', 'color', 'estado',
    'created_at', 'updated_at'
  ],

  grupos_miembros: [
    'id', 'grupo_id', 'user_id',
    'fecha_ingreso_utc', 'fecha_salida_utc', 'estado'
  ],

  // ─── Comunicación (MVP — Iter 5/6) ─────────────────────────────────────
  mensajes: [
    'id', 'de_user_id', 'para_user_id', 'para_grupo_id', 'para_rol',
    'asunto', 'contenido', 'created_at'
  ],

  alertas: [
    'id', 'user_id', 'tipo', 'severidad', 'titulo', 'descripcion',
    'accion_url', 'entidad_ref', 'leida', 'leida_at_utc',
    'created_at', 'expires_at_utc'
  ],

  solicitudes: [
    'id', 'tipo', 'user_id', 'target_id', 'datos', 'estado',
    'resuelta_por', 'resuelta_at_utc', 'motivo_resolucion', 'created_at'
  ],

  // ─── Sistema (MVP — Iter 3) ────────────────────────────────────────────
  auditoria: [
    'id', 'created_at_utc', 'user_id', 'accion', 'entidad', 'entidad_id',
    'datos_antes', 'datos_despues', 'ip', 'user_agent',
    'resultado', 'error_msg'
  ],

  config: [
    'key', 'value', 'tipo', 'descripcion', 'updated_at_utc', 'updated_by'
  ],

  indices: [
    'entidad', 'valor', 'target_id'
  ],

  // ─── Fase 2 (creadas vacías en bootstrap para no migrar después) ───────
  encuestas: [
    'id', 'titulo', 'descripcion', 'creada_por', 'dirigida_a',
    'preguntas', 'fecha_inicio', 'fecha_fin', 'estado', 'created_at'
  ],

  encuestas_respuestas: [
    'id', 'encuesta_id', 'user_id', 'respuestas', 'submitted_at'
  ],

  calificaciones: [
    'id', 'agendamiento_id', 'de_user_id', 'para_user_id',
    'estrellas', 'comentario', 'created_at'
  ],

  logros_catalogo: [
    'id', 'codigo', 'nombre', 'descripcion', 'icono',
    'criterio', 'puntos', 'categoria'
  ],

  logros_usuario: [
    'id', 'user_id', 'logro_id', 'alcanzado_at', 'datos'
  ],

  puntos_usuario: [
    'user_id', 'total_puntos', 'nivel',
    'ultima_racha', 'racha_actual', 'updated_at'
  ],

  directorio_gimnasios: [
    'id', 'nombre_marca', 'verificado', 'restricciones',
    'contacto_dueno', 'created_at', 'updated_at'
  ],

  solicitudes_marca: [
    'id', 'marca', 'tipo_solicitud', 'datos', 'estado',
    'resuelta_por', 'resuelta_at', 'created_at'
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Configuración inicial — keys a insertar en hoja `config` durante bootstrap
// ──────────────────────────────────────────────────────────────────────────
const CONFIG_INITIAL = [
  ['app.name', 'Al Fallo', 'string', 'Nombre de la aplicación'],
  ['app.timezone_default', 'America/Bogota', 'string', 'Zona horaria por defecto para render'],
  ['app.currency_default', 'COP', 'string', 'Moneda por defecto'],
  ['app.session_ttl_hours', '8', 'number', 'Duración de la sesión en horas'],
  ['app.activation_token_ttl_hours', '24', 'number', 'TTL del token de activación de cuenta'],
  ['app.reset_token_ttl_hours', '1', 'number', 'TTL del token de reset de password'],
  ['app.draft_booking_ttl_minutes', '10', 'number', 'TTL del booking en estado borrador'],
  ['app.archive_after_days', '90', 'number', 'Días tras los cuales se archivan agendamientos finales'],
  ['app.disclaimer_url', '/disclaimer', 'string', 'Ruta del disclaimer público'],
  ['notif.email_enabled', 'true', 'boolean', 'Si se envían emails desde la plataforma'],
];

// ──────────────────────────────────────────────────────────────────────────
// Política de cancelación global default — insertada durante bootstrap
// ──────────────────────────────────────────────────────────────────────────
const POLITICA_CANCELACION_DEFAULT = {
  nombre: 'Estándar 12 horas',
  ventana_horas: 12,
  dentro_margen: 'sin_penalizacion',
  fuera_margen: 'descuenta_sesion',
  aplica_a: 'global',
  entidad_id: '',
  estado: 'active',
};

// ──────────────────────────────────────────────────────────────────────────
// Hojas que requieren índice en hoja `indices`
// ──────────────────────────────────────────────────────────────────────────
const INDEXED_LOOKUPS = {
  // entidad → { sourceSheet, sourceColumn }
  email:  { sheet: 'usuarios', col: 'email' },
  cedula: { sheet: 'usuarios', col: 'cedula' },
  nick:   { sheet: 'usuarios', col: 'nick' },
};
