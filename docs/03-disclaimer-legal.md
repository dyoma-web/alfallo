# Al Fallo · Marco legal y políticas

> ⚠️ **Documento borrador.** Aunque sigue la estructura exigida por la Ley 1581 de 2012 y el Decreto 1377 de 2013, **debe ser revisado por un abogado colombiano antes del lanzamiento público**. Lo que sigue son textos funcionales listos para integrar al producto, marcando con `[REVISAR]` los puntos que el abogado debe validar.

---

## 0. Marco normativo aplicable

| Norma | Qué regula | Cómo nos afecta |
|---|---|---|
| Ley 1581 de 2012 | Régimen general de protección de datos personales en Colombia | Define principios, deberes del responsable, derechos del titular |
| Decreto 1377 de 2013 | Reglamenta parcialmente la Ley 1581 | Define contenido mínimo de la política y del aviso de privacidad |
| Decreto 1074 de 2015, Libro 2, Parte 2, Título 2, Capítulo 25 y 26 | Compila lo anterior | Es la versión consolidada vigente |
| Ley 1266 de 2008 | Habeas Data financiero | No nos aplica directamente (no operamos financiero) |
| Ley 527 de 1999 | Comercio electrónico | Aplica para validez de aceptación digital de T&C |
| Resolución SIC 2466 de 2012 | Inscripción en RNBD | Si superamos 100.000 titulares debemos inscribir las BD en el Registro Nacional |
| Ley 23 de 1982 + Decisión 351 CAN | Derechos de autor | Marcas y logos de gimnasios → propiedad de sus dueños |

**Autoridad de control**: Superintendencia de Industria y Comercio (SIC) — Delegatura de Protección de Datos Personales.

---

## 1. Identificación del Responsable del Tratamiento

```
[REVISAR — completar con datos legales reales]

Razón social:     [Pendiente — definir si es persona natural o jurídica]
NIT / CC:         [Pendiente]
Domicilio:        [Pendiente — Colombia]
Correo de contacto: equipo@alfallo.co  [REVISAR — registrar dominio]
Teléfono:         [Pendiente]
Sitio web:        https://dyoma-web.github.io/alfallo/
```

**Importante**: la Ley 1581 exige identificar inequívocamente al Responsable. Mientras "Al Fallo" no esté constituido como persona jurídica, el responsable es la persona natural detrás del proyecto (David Yomayusa, según los datos del repo). Esta identificación debe aparecer en todo aviso público.

---

## 2. Aviso de privacidad
*(Texto para mostrar en login, registro, footer, pantallas de captura de datos)*

### Versión corta — banner / footer
> "Al Fallo trata tus datos personales conforme a la Ley 1581 de 2012. Al usar esta plataforma aceptas nuestra [Política de Tratamiento de Datos]. Puedes ejercer tus derechos escribiendo a `equipo@alfallo.co`."

### Versión expandida — pantalla de registro y activación de cuenta
> "Para crear tu cuenta en Al Fallo necesitamos tratar algunos datos personales tuyos: nombres, apellidos, correo, número de identificación, celular, foto de perfil opcional, e información sobre tus entrenamientos, asistencia, plan contratado y progreso.
>
> Usamos estos datos únicamente para operar la plataforma: agendar tus sesiones, mantener tu historial, comunicarte con tu entrenador, enviar alertas, generar reportes y mejorar el servicio. **No los vendemos, no los entregamos a terceros con fines comerciales y no los usamos para perfilamiento publicitario externo.**
>
> Tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento. Si decides salir, conservaremos un mínimo histórico anonimizado por requerimientos legales y operativos por máximo [REVISAR — proponer 5 años].
>
> Al hacer clic en 'Acepto y creo mi cuenta' confirmas que has leído nuestra [Política de Tratamiento de Datos] y que autorizas estos usos."

Checkbox obligatorio: **☐ He leído y acepto la Política de Tratamiento de Datos Personales y los Términos de Uso de Al Fallo.**

---

## 3. Política de Tratamiento de Datos Personales (PTDP)
*(Documento legal completo accesible en `/politica-datos` y enlazado desde el aviso de privacidad)*

### 3.1. Identificación del Responsable
Ver §1 de este documento.

### 3.2. Tratamiento al cual serán sometidos los datos y su finalidad

Los datos personales recolectados serán tratados para las siguientes finalidades:

**A. Operación del servicio**
- Crear y administrar la cuenta del titular.
- Asignar roles (cliente, entrenador, administrador).
- Permitir agendamiento, confirmación y cancelación de entrenamientos.
- Llevar registro de asistencia, planes contratados, rutinas asignadas e indicadores de salud reportados voluntariamente por el titular o por su entrenador.
- Generar reportes y estadísticas individuales y agregadas.

**B. Comunicación**
- Enviar notificaciones in-app y por correo sobre el estado de planes, sesiones, alertas y mensajes.
- Responder solicitudes, dudas y reclamos.

**C. Seguridad y auditoría**
- Mantener registros de acceso, escrituras y cambios para garantizar la integridad de la información.
- Detectar usos indebidos de la plataforma.

**D. Mejora del producto**
- Análisis estadístico **agregado y anonimizado** sobre uso de la plataforma.

**E. Cumplimiento legal**
- Atender requerimientos de autoridades competentes.
- Conservar registros por los plazos legales aplicables.

### 3.3. Datos sensibles

Algunos datos que tratamos son considerados **datos sensibles** por la Ley 1581 (artículo 5):

- Datos de salud: peso, frecuencia cardíaca, tensión arterial, restricciones físicas, lesiones, dolor reportado.
- Imagen del titular: foto de perfil y galería de progreso (si el titular las sube).

**Tratamiento especial de datos sensibles**:
- El titular **puede negarse** a entregarlos sin que esto le impida usar el servicio.
- Solo se solicitan los **estrictamente necesarios** para la finalidad declarada.
- Los datos de salud son visibles **únicamente** para el titular y para su entrenador asignado.
- Las fotos de progreso tienen niveles de privacidad configurables: `solo yo`, `mi entrenador`, `mi grupo`, `público dentro de la plataforma`.

### 3.4. Derechos del titular

Conforme al artículo 8 de la Ley 1581, el titular puede:

1. **Conocer, actualizar y rectificar** sus datos personales.
2. **Solicitar prueba** de la autorización otorgada.
3. **Ser informado** sobre el uso que se ha dado a sus datos.
4. **Presentar quejas** ante la SIC por infracciones.
5. **Revocar la autorización** y/o solicitar la **supresión** de los datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.
6. **Acceder en forma gratuita** a sus datos.

### 3.5. Procedimiento para ejercer los derechos

**Canal de contacto**:
- Correo electrónico: `equipo@alfallo.co` [REVISAR — registrar y configurar].
- Asunto sugerido: `Solicitud Habeas Data — [tipo de solicitud]`.

**Información requerida en la solicitud**:
- Nombres y apellidos del titular.
- Documento de identificación.
- Descripción precisa de la solicitud.
- Dirección o correo donde recibir respuesta.

**Tiempos de respuesta** (artículo 14 Ley 1581):
- Consultas: **10 días hábiles** prorrogables 5 días más.
- Reclamos: **15 días hábiles** prorrogables 8 días más.

Si la solicitud es incompleta, dentro de los 5 días siguientes se requerirá al titular para que complete.

### 3.6. Vigencia de la base de datos y plazos de conservación

| Tipo de dato | Plazo de conservación | Justificación |
|---|---|---|
| Cuenta activa | Mientras dure la relación | Necesario para la prestación del servicio |
| Cuenta cancelada — datos personales | Eliminación a solicitud, máximo 30 días | Derecho del titular |
| Cuenta cancelada — historial anonimizado | [REVISAR — proponer 5 años] | Estadísticas agregadas, obligaciones de auditoría |
| Logs de acceso y auditoría | 12 meses, luego archivo | Seguridad, trazabilidad |
| Datos contables / facturación | [REVISAR — verificar plazos DIAN si aplica] | Si se llega a integrar facturación |

### 3.7. Transferencia y transmisión de datos

**A terceros**: Al Fallo **no transfiere** datos personales a terceros con fines comerciales.

**Operadores tecnológicos**: los datos se almacenan en infraestructura de **Google LLC** (Google Sheets + Apps Script + Drive). Google es Encargado del Tratamiento bajo nuestras instrucciones. Esta transferencia internacional se ampara en:
- Adhesión de Google al marco de transferencias internacionales adecuado.
- Compromisos contractuales de Google con sus clientes (Google Cloud Privacy Notice, DPA).

**[REVISAR]** — el abogado debe validar si esta transferencia internacional requiere autorización expresa adicional del titular dentro del flujo de registro, dado que Google opera servidores fuera de Colombia.

**Autoridades competentes**: podemos compartir datos cuando lo requieran autoridades judiciales o administrativas en ejercicio de sus funciones, conforme a la ley.

### 3.8. Seguridad de la información

Implementamos medidas razonables:
- Contraseñas almacenadas con hash criptográfico (SHA-256 + salt + pepper). **Nunca en texto plano.**
- Acceso por roles — cada usuario solo ve lo que su rol permite.
- Tokens de sesión con expiración (8 horas).
- Logs de auditoría inmutables.
- Backups cifrados diarios.
- HTTPS en toda comunicación.

**Limitaciones declaradas**: el MVP usa Google Sheets como datastore. Aunque es operacionalmente funcional, **no constituye una infraestructura de grado financiero o médico**. Los titulares aceptan que el servicio está en fase piloto al momento de registrarse, y que se migrará a infraestructura de producción al madurar.

### 3.9. Cambios a esta política

Cualquier cambio sustancial será notificado por correo electrónico y por aviso destacado en la plataforma con al menos **15 días** de anticipación.

---

## 4. Términos y Condiciones de Uso
*(Documento accesible en `/terminos`)*

### 4.1. Naturaleza del servicio

Al Fallo es **una herramienta de gestión de información** para profesionales del entrenamiento físico y sus clientes. Permite organizar agendas, planes, asistencia, rutinas y progreso.

**Al Fallo NO es**:
- Una agencia de contratación ni intermediario comercial.
- Un proveedor de servicios de entrenamiento ni de salud.
- Un sistema de facturación electrónica.
- Una pasarela de pagos.
- Un proveedor de consejo médico, nutricional ni deportivo.

**Al Fallo NO se hace responsable** de:
- La calidad, idoneidad ni resultados del servicio prestado por entrenadores, gimnasios o sedes registrados en la plataforma.
- Las relaciones contractuales, comerciales o disputas entre entrenadores, sus clientes y los gimnasios donde operan.
- Lesiones, daños físicos o consecuencias derivadas del entrenamiento.

### 4.2. Roles y obligaciones

**Cliente / Usuario**:
- Mantener actualizada su información personal y de salud en lo que decida compartir voluntariamente.
- Cumplir las políticas de cancelación de su entrenador o sede.
- No suplantar identidad ni crear cuentas fraudulentas.
- Respetar las normas de convivencia con otros usuarios.

**Entrenador**:
- Garantizar que la información profesional cargada (certificaciones, perfil) es veraz.
- Operar bajo las normas legales aplicables al ejercicio de su profesión en Colombia.
- Tratar la información de sus usuarios conforme a la Ley 1581 — actúa como **co-responsable** sobre los datos de sus clientes.
- Respetar los acuerdos comerciales con las sedes y gimnasios donde opere.

**Administrador (equipo Al Fallo)**:
- Mantener la plataforma operativa y disponible en términos razonables.
- Responder oportunamente a solicitudes Habeas Data.
- No interferir indebidamente en relaciones comerciales entre entrenadores, clientes y gimnasios.

### 4.3. Suspensión y cancelación de cuentas

Al Fallo puede suspender o cancelar cuentas que:
- Violen la Política de Tratamiento de Datos.
- Suplanten identidad.
- Carguen contenido ofensivo, ilegal o que viole derechos de terceros.
- Usen la plataforma para fines distintos a los declarados.

### 4.4. Limitación de responsabilidad

En la **máxima medida permitida por la ley colombiana**, Al Fallo no responde por:
- Pérdida de información debida a fallas de Google Sheets / Apps Script / GitHub Pages u otros servicios de terceros sobre los que no tenemos control.
- Interrupciones de servicio.
- Daños indirectos, lucro cesante o consecuencias derivadas del uso o imposibilidad de uso de la plataforma.

Al Fallo realiza esfuerzos razonables (backups diarios, monitoreo) pero **no garantiza disponibilidad 24/7** durante la fase MVP/piloto.

### 4.5. Ley aplicable y jurisdicción

Estos términos se rigen por las **leyes de la República de Colombia**. Cualquier controversia será resuelta ante los **jueces ordinarios competentes en Colombia**, salvo acuerdo expreso de arbitraje.

---

## 5. Disclaimer de marcas y propiedad intelectual
*(Texto a mostrar en directorio de gimnasios — Fase 2 — y en footer global desde el inicio)*

### 5.1. Versión corta — footer
> "Las marcas, nombres comerciales, logotipos y elementos de identidad visual de los gimnasios, sedes y entrenadores mencionados en Al Fallo son propiedad de sus respectivos dueños. Al Fallo no promueve, recomienda ni intermedia transacciones comerciales entre usuarios y dichas marcas. Solo facilita la gestión de información que cada parte decide cargar voluntariamente."

### 5.2. Versión expandida — página dedicada `/marcas`

**Sobre los gimnasios y marcas mencionados en Al Fallo**

Al Fallo permite a los entrenadores indicar las sedes y gimnasios donde prestan sus servicios. Esta información es ingresada **directamente por los entrenadores y administradores** de la plataforma, no por Al Fallo.

**Reconocimiento de propiedad**:
- Todas las marcas, nombres, logotipos, eslóganes e identidades visuales de gimnasios mencionados pertenecen a sus respectivos titulares.
- El uso de un nombre de gimnasio en Al Fallo no implica relación comercial, patrocinio, afiliación ni respaldo entre Al Fallo y dicha marca.

**Procedimiento de reclamo de marca** (Fase 2):
Los titulares de derechos sobre una marca pueden:
1. **Verificar la marca** en la plataforma — recibirán un distintivo de "marca verificada".
2. **Restringir el uso** de su logotipo, foto o elementos protegidos — Al Fallo mostrará la información en formato textual neutro.
3. **Solicitar retiro** de menciones que violen sus derechos.

Canal de reclamo: `marcas@alfallo.co` [REVISAR — registrar].

**Política DMCA-equivalente**:
Aplicamos un procedimiento de **notificación y retiro** análogo a la DMCA estadounidense, adaptado a la Ley 23 de 1982 y la Decisión 351 de la Comunidad Andina. Recibida una solicitud fundamentada, el contenido reportado se retira en máximo 5 días hábiles.

### 5.3. Propiedad de los datos cargados

**Principio general**: cada usuario es propietario de los datos personales que carga en la plataforma. Al Fallo es **responsable del tratamiento** pero no propietario.

**Datos operativos** (agendamientos, asistencia, planes, indicadores):
- Pertenecen al titular del dato (cliente o entrenador, según corresponda).
- El entrenador puede generar reportes con los datos de los usuarios que tiene asignados, dentro de la plataforma.
- Si un cliente se desvincula de un entrenador, sus datos personales lo siguen al cliente. El entrenador conserva un histórico operativo anonimizado para fines estadísticos.

**Resolución de controversias sobre propiedad de datos**:
> En caso de controversia sobre la titularidad o propiedad de información cargada en Al Fallo, **se aplicará la legislación del territorio donde la información fue cargada originalmente**. Si la carga ocurrió en Colombia, prevalece la Ley 1581 de 2012 y demás normas concordantes. Si la plataforma se opera en otros territorios en el futuro, prevalecerá la legislación local de carga.

**[REVISAR]** — el abogado debe validar la cláusula anterior. La intención del cliente es que la jurisdicción se determine por el lugar de carga, no por el domicilio de Al Fallo. Esto puede tener implicaciones complejas con clientes internacionales y debe validarse.

---

## 6. Microcopy para pantallas

### 6.1. Pantalla de registro / activación
**Bloque de consentimiento** (obligatorio, antes del botón final):

```
☐ He leído y acepto la Política de Tratamiento de Datos Personales.
   Al aceptar autorizas a Al Fallo a tratar tus datos para operar
   la plataforma según se describe en la política.

☐ He leído y acepto los Términos y Condiciones de Uso.

☐ (Opcional) Acepto recibir comunicaciones de Al Fallo sobre
   actualizaciones del servicio, novedades y consejos. Puedes
   desactivar esto cuando quieras desde tu perfil.
```

### 6.2. Modal antes de subir foto de progreso
> "Al subir una foto de progreso, autorizas a Al Fallo a almacenarla y mostrarla únicamente según el nivel de privacidad que elijas. Solo tú decides quién la ve. Puedes eliminarla en cualquier momento desde tu galería.
>
> Privacidad de esta foto: [Selector — Solo yo / Mi entrenador / Mi grupo / Pública en la plataforma]"

### 6.3. Modal antes de cargar dato sensible de salud
> "Vas a registrar información sobre tu salud (peso, frecuencia cardíaca, presión, lesiones). Este dato es **sensible** según la Ley 1581. Lo guardamos cifrado y solo lo verán: tú y tu entrenador asignado. ¿Continuar?"

### 6.4. Footer global de la plataforma
```
Al Fallo · MVP · piloto colombiano
[Política de Datos] · [Términos] · [Marcas] · [Equipo]
Las marcas mencionadas pertenecen a sus dueños.
© 2026 Al Fallo. Operado bajo Ley 1581/2012.
```

### 6.5. Página `/equipo` (sustitución del clásico "Sobre nosotros")
> "Detrás de Al Fallo está **el equipo de administración**. Nos encargamos del mantenimiento, soporte, atención de solicitudes Habeas Data y de hacer crecer la plataforma de forma responsable.
>
> Para cualquier solicitud, escríbenos a `equipo@alfallo.co`. Respondemos en horario hábil colombiano y siempre dentro de los plazos que exige la ley para Habeas Data (10–15 días hábiles)."

### 6.6. Empty state de la lista de gimnasios (Fase 2)
> "Aún no hay gimnasios registrados en este filtro. ¿Eres dueño o administras un gimnasio? Solicita la verificación de tu marca escribiendo a `marcas@alfallo.co`."

### 6.7. Mensaje al cancelar cuenta
> "Vas a cancelar tu cuenta. Esto significa:
> - Tus datos personales serán eliminados en máximo 30 días.
> - Conservaremos un histórico anonimizado de tu actividad por motivos estadísticos y de auditoría.
> - Tu entrenador conservará tu historial operativo en sus reportes, sin tu información personal identificable.
>
> Esta acción no se puede deshacer. ¿Continuar?"

### 6.8. Aviso de cookies / localStorage
> "Al Fallo guarda en tu navegador información mínima para mantener tu sesión iniciada (un token de seguridad). No usamos cookies de seguimiento ni publicidad. Al usar la plataforma aceptas este uso técnico necesario."

---

## 7. Checklist de cumplimiento antes del lanzamiento

- [ ] Razón social / persona natural responsable identificada y registrada
- [ ] Dominio `alfallo.co` (o el que se elija) registrado y configurado
- [ ] Correos `equipo@alfallo.co` y `marcas@alfallo.co` operativos
- [ ] Política de Tratamiento de Datos publicada en `/politica-datos`
- [ ] Términos y Condiciones publicados en `/terminos`
- [ ] Disclaimer de marcas publicado en `/marcas`
- [ ] Página de equipo publicada en `/equipo`
- [ ] Banner de consentimiento implementado en registro
- [ ] Procedimiento Habeas Data documentado y con SLA real
- [ ] Plantillas de respuesta a solicitudes Habeas Data redactadas
- [ ] Borrador revisado por abogado colombiano
- [ ] Si se superan 100.000 titulares: inscripción en RNBD ante la SIC

---

## 8. Riesgos legales identificados

| Riesgo | Mitigación |
|---|---|
| Mostrar logos sin autorización | Subida de logos solo a marcas verificadas; retiro inmediato ante reclamo |
| Datos sensibles de salud accesibles sin protección suficiente | Cifrado, RBAC estricto, declaración explícita de fase MVP |
| Transferencia internacional a Google sin autorización clara | Autorización explícita en registro **[REVISAR con abogado]** |
| Suplantación de identidad de entrenadores | Validación manual del Admin antes de activar entrenadores |
| Reclamos de gimnasios por uso de marca | Procedimiento de notificación y retiro documentado |
| Lesiones del usuario durante entrenamiento | Disclaimer claro de no responsabilidad sobre el servicio profesional |
| Pérdida de datos por dependencia de Google | Backups diarios + plan de migración documentado |

---

## 9. Próximos pasos

Al cerrar la **Iteración 8** (lanzamiento), se debe ejecutar el checklist de §7 antes de hacer pública la URL. Hasta entonces, todo acceso debe ser invitación-controlada y los textos legales pueden tener placeholders `[REVISAR]`.

---

**Próximo documento**: [04-roadmap.md](04-roadmap.md) — las 8 iteraciones de desarrollo con criterios de aceptación.
