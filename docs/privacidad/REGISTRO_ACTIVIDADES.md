# Registro de actividades de tratamiento (art. 30 RGPD)

> **Borrador preparado a partir del funcionamiento real de la web y del CRM** (código revisado y configuración de
> Railway consultada el 25 de octubre de 2026, solo los nombres de las variables). No es asesoramiento jurídico ni
> una certificación. Los datos marcados _[pendiente]_ debe completarlos Cristina, con revisión profesional si lo
> estima necesario.

## Responsable

| | |
|---|---|
| Nombre | Cristina Battistelli (Cristina Vive Consciente · BION) |
| NIF | _[pendiente]_ |
| Domicilio | _[pendiente]_ |
| Contacto | `info@cristinaviveconsciente.es`, el que figura en los textos de consentimiento aprobados. _[Confirmar que el buzón funciona y unificar: la web usa también `hola@cristinaviveconsciente.es` y el pie de página muestra `hola@cristinaviveconsciente.com`.]_ |
| Delegado de protección de datos | No designado. _[Documentar la decisión: previsiblemente no es obligatorio.]_ |

## Encargados y otros destinatarios (comunes)

| Proveedor | Función | Datos | Ubicación | Estado verificado |
|---|---|---|---|---|
| Railway | Alojamiento de la web, la base de datos MySQL y los archivos subidos | Todos | **EE. UU.**: región *US West*, comprobada en el panel de Railway para el servicio web y para MySQL | Activo. _[Pendiente: contrato de encargado (DPA), subencargados y garantías de la transferencia (art. 44-46)]_ |
| Brevo (`smtp-relay.brevo.com`) | Envío de los emails de la web | Email, nombre y contenido de cada aviso (citas, pedidos, contacto, secuencia de seguimiento) | _[pendiente]_ | Activo (`SMTP_HOST`). _[Pendiente: entidad y DPA]_ |
| CallMeBot | Aviso por WhatsApp **al número de Cristina** | Citas: servicio, día y hora. Pedidos: referencia, producto e importe. **Sin nombre, teléfono, email ni mensaje.** | _[pendiente]_ | Activo (`CALLMEBOT_APIKEY`). Es un puente no oficial de uso personal. _[Valorar si es aceptable]_ |
| Google (Analytics, Ads, Tag Manager) | Medición | Eventos sin datos personales (servicio, modalidad) y conversiones. Solo con consentimiento de cookies. **Nunca en `/crm` ni en `/admin`.** | EE. UU. | Activo (`VITE_GA4_ID`, `VITE_GOOGLE_ADS_ID`) |

**Inactivos en producción** (sin variables configuradas, comprobado el 25 de octubre de 2026):
- Meta WhatsApp Cloud API;
- notificaciones Manus (`BUILT_IN_FORGE_*`);
- Stripe.

`VAPI_API_KEY` está configurada, pero **ningún código la usa**. No se llama a ningún servicio de IA desde la web ni desde el CRM.

## Actividades

### 1. Gestión de clientes, citas y sesiones (CRM)
- **Finalidad:** prestar y organizar los servicios, citas, notas de sesión y facturación.
- **Base jurídica:** contrato o medidas precontractuales (6.1.b) y obligaciones legales (6.1.c).
- **Interesados:** clientes y personas que solicitan cita.
- **Datos:**
  - identificativos y de contacto;
  - citas;
  - notas prácticas de sesión;
  - preferencias;
  - tarifa particular;
  - facturas.
- **Origen:** el propio interesado (formulario de cita o directamente a Cristina).
- **Destinatarios:**
  - encargados: Railway y Brevo;
  - CallMeBot solo con los datos mínimos indicados;
  - Administración tributaria si procede.
- **Transferencias:** EE. UU. (Railway). _[Garantías pendientes]_
- **Conservación:** _[plazos pendientes]_. Facturas: los plazos legales. Supresión de la ficha disponible en el CRM (conserva citas y facturas).
- **Seguridad:** acceso solo de administración, límite de intentos, cookie segura y auditoría de cambios sin contenido.

### 2. Primera visita (datos de salud)
- **Finalidad:** preparar las sesiones y darles seguimiento.
- **Base jurídica:** consentimiento explícito (6.1.a + 9.2.a), con el texto `pv-2026-10-v1`, aprobado por Cristina. _[Confirmación profesional recomendada]_
- **Datos:** motivo, alergias o sensibilidades, circunstancias para la sesión, zonas a evitar, bienestar y observaciones. Todos opcionales.
- **Destinatarios:** ninguno, salvo el alojamiento (Railway): el contenido va cifrado en la aplicación.
- **Transferencias:** EE. UU. (Railway, cifrado). _[Garantías pendientes]_
- **Conservación:**
  - mientras haya consentimiento y sean necesarios;
  - revisión cada 12 meses;
  - supresión inmediata al retirar el consentimiento.
- **Seguridad:** ver [ANALISIS_RIESGOS.md](ANALISIS_RIESGOS.md).

### 3. Acompañamiento emocional
Igual que la actividad 2, con estas diferencias:
- **Texto de consentimiento:** `ae-2026-10-v1`. Es un consentimiento separado y no condiciona reservas.
- **Datos:** relato del cliente, observaciones de Cristina y objetivos o pendientes, en anotaciones fechadas.

### 4. Contacto y comunidad (web `/contacto`)
- **Finalidad:** responder. Además, se envía un email de bienvenida y dos emails de seguimiento (días 3 y 7) con contenidos, guías y productos.
- **Base jurídica:** consentimiento (casilla en el formulario principal). _[Pendiente: ver observaciones 1 y 2]_
- **Datos:**
  - nombre y email;
  - opcionales: apellidos, teléfono, interés y mensaje.
- **Dónde se guarda:**
  - `clients` (como «lead», con el mensaje en `notes`);
  - `lead_sequences`;
  - `automation_logs`.
- **Destinatarios:** Brevo (emails al interesado y a Cristina).
- **Conservación:** _[pendiente]_. No hay borrado automático.

### 5. Consultas de sistemas de agua (`/sistemas-agua`)
- **Finalidad:** responder a la consulta.
- **Base jurídica:** consentimiento (casilla registrada en `water_inquiries.acceptPrivacy`) y medidas precontractuales.
- **Datos:** nombre, apellidos, teléfono, email, provincia, localidad, tipo de vivienda y observaciones.
- **Destinatarios:** ninguno externo (el aviso de WhatsApp de Meta no está activo).
- **Conservación:** _[pendiente]_.

### 6. «Mi consulta» de aceites (`/mi-consulta`)
- **Finalidad:** responder a la consulta.
- **Base jurídica:** consentimiento, comprobado también en el servidor.
- **Datos:** nombre, apellidos, email, teléfono, provincia, usos y experiencia (opciones cerradas, sin texto libre) y productos. No se piden datos de salud.
- **Destinatarios:** ninguno externo.
- **Conservación:** _[pendiente]_.

### 7. Pedidos de guías digitales (Bizum)
- **Finalidad:** gestionar el pedido y la entrega.
- **Base jurídica:** contrato (6.1.b) y obligaciones legales (6.1.c).
- **Datos:** nombre, email, teléfono (opcional), producto e importe.
- **Destinatarios:**
  - Brevo (emails);
  - CallMeBot (referencia, producto e importe).
- **Conservación:** el enlace de descarga caduca; el pedido no se borra. _[Plazos pendientes]_

### 8. Comentarios del blog
- **Finalidad:** moderar y publicar.
- **Base jurídica:** consentimiento.
- **Datos:** nombre y comentario. Si se aprueba, se publica con ese nombre.
- **Conservación:** _[pendiente]_.

### 9. Cookies y medición
Ver `/politica-de-cookies`:
- consentimiento por categorías;
- Consent Mode con todo denegado por defecto;
- sin remarketing.

## Observaciones detectadas al preparar este registro (decisión de Cristina)

1. **Suscripción a la comunidad** (propuesta en [PROPUESTA_MARKETING.md](PROPUESTA_MARKETING.md)) (`/contacto`, bloque inferior):
   - no tiene casilla;
   - el código envía `acceptPrivacy: true` sin que el interesado marque nada;
   - activa la misma secuencia de emails de los días 3 y 7.
   - Para emails comerciales hace falta consentimiento previo y expreso (art. 21 LSSI).
2. **Emails de seguimiento a quien usa el formulario de contacto:**
   - se envían a **cualquiera** que escriba, aunque solo haya hecho una pregunta;
   - la baja solo funciona respondiendo «Baja», y no se procesa automáticamente.
   - **Decidir:** casilla separada para los emails comerciales, o no enviarlos sin ella; y una baja que funcione sola.
3. **«Mi consulta»:** **corregido.** Opciones cerradas en lugar de texto libre, y consentimiento exigido también en el servidor. Las consultas anteriores conservan su texto: Cristina puede revisarlas en el CRM.
4. **Formulario de cita:** **corregido.** El mensaje es solo de información práctica (máximo 300 caracteres) y avisa de no incluir datos de salud. Las citas anteriores conservan su texto.
5. **El contenido de los formularios se copia en otros sitios:**
   - en `automation_logs` se guarda un enlace `wa.me` con nombre, teléfono, email y mensaje (lo que se haría por WhatsApp si no está activo Meta);
   - el mensaje del formulario de contacto se copia en `clients.notes`.
   - Revisar si hace falta conservar estas copias.
6. **Google Fonts:** **corregido.** Las tipografías se sirven desde la propia web.
7. **Transferencia a EE. UU.:**
   - Railway aloja todo en *US West*;
   - **decidir:** mantenerlo con las garantías documentadas o pasar los servicios a la región de la UE de Railway.
   - Esto último es una migración técnica que requiere planificarse.
