# Reservas de masajes — auditoría, flujo y medición

Auditoría y despliegue: 2026-10-02. **Estado: implementado y desplegado en producción** (ver §0).

## 0. Estado actual (resumen)

### Qué quedó implementado y desplegado

- **PR #2** fusionado en `main` (commit `c0858af`; incluye `5a7fc51`, `f1479ef` y `6337a4f`). Railway lo desplegó
  automáticamente (cada push a `main` despliega; las ramas no).
- **Migración `0020_appointment_events.sql` aplicada en producción**: tabla nueva `appointment_events`
  (11 columnas, 0 filas; las 3 citas existentes intactas). El historial se llenará con la primera solicitud real.
- **Formulario de masaje**: se presenta como reserva de masaje; muestra servicio, duración, precio y lugar; solo
  modalidad presencial; fecha + franja; resumen antes de enviar; confirmación "pendiente de confirmación de Cristina".
  Las consultas conservan su formulario de siempre.
- **Corrección crítica**: los slugs reales de los masajes eran rechazados por `bookings.request`; ahora se resuelven
  contra la tabla `services`.
- **Servidor**: hora siempre en `Europe/Madrid`, fecha no pasada, anti-duplicados, transiciones de estado protegidas
  (no se confirma dos veces ni se confirma una cita cancelada).
- **Admin `/crm/citas`**: filtros por estado, servicio y fechas; confirmar / rechazar con motivo / proponer otra
  fecha; "Detalle e historial" con cada cambio de estado y el resultado de cada notificación.
- **WhatsApp**: eliminado el número de relleno; una sola constante, +34 657 165 343 (`shared/booking.ts`), para el
  enlace de la confirmación, los avisos al admin y el botón flotante.
- **Móvil**: el modal queda por encima de la cabecera y del botón flotante de WhatsApp; fecha, franja, email y
  teléfono en una columna en pantallas pequeñas.
- **Medición preparada, apagada por defecto**: eventos `booking_form_opened` y `booking_request_submitted`
  (`client/src/lib/analytics.ts`); sin consentimiento no se emite nada; no se carga ninguna etiqueta; sin datos
  personales. Se retiró la etiqueta de Umami rota.

### Qué comprobaciones se hicieron

- Tests: 42 (41 OK). El único fallo, `whatsapp.test.ts` ("generateBookingWhatsAppText is not a function"), **ya
  fallaba en `main` antes de estos cambios** (verificado ejecutando el test contra el código de `main`).
- `pnpm check` y `vite build`: OK.
- **Pruebas en Chrome contra una copia de prueba de la base de datos** (estructura de producción, sin datos reales, y un
  servidor SMTP falso: no salió ningún correo real): formulario 20/20; admin 27/27 (24/24 sin la migración); móvil a
  390 y 360 px 14/14. Cubren los dos masajes: solicitud, notificación, confirmación, rechazo y propuesta de otra fecha
  (el cliente elige y la cita vuelve a pendiente), más permisos (sin sesión → 401).
- Migración: aplicada dos veces sin error en la copia de prueba; en producción solo se ejecutó el
  `CREATE TABLE IF NOT EXISTS` y se verificaron columnas y filas.
- Tras el despliegue: páginas públicas y `sitemap.xml` con 200; la web incluye el nuevo formulario y el número correcto;
  la ruta del historial responde 401 sin sesión (existe y está protegida); el log de arranque no muestra errores nuevos.

### Qué no se ha comprobado

- **El admin de producción en pantalla** (no se usaron credenciales): la verificación del historial es indirecta
  (tabla creada, ruta desplegada). Conviene que alguien con acceso abra `/crm/citas` → "Detalle e historial".
- **Ninguna reserva ni notificación reales**: no se hizo ninguna solicitud de prueba en producción. La primera la hará
  Cristina (o Jorge coordinado con ella): el aviso va a su `ADMIN_EMAIL` real.

### Estado de la configuración de notificaciones (solo nombres; sin valores)

| Variable | Producción |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_EMAIL` | puestas |
| `WHATSAPP_ADMIN_NUMBER` | sin poner (se usa la constante +34 657 165 343) |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | sin poner: solo se genera el enlace `wa.me`, no hay envío automático |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | sin poner: el aviso interno heredado de Manus sale como "no enviada" |

### Pendiente de autorización (fuera de este flujo)

- Actualización en BD de imágenes de ebooks y de 6 productos afiliados (`scripts/relocate-images-2026-10.mjs`).
- Subida de los PDFs de los ebooks (`/uploads/ebooks/ebook-agua.pdf` y `ebook-aceites.pdf`).


## 1. Cómo funcionaba antes (hallazgos)

**Flujo cliente.** `BookingModal.tsx` (lo abren Header, Home, Masajes, MasajeDetalle y ConsultaDetalle) →
`trpc.bookings.request` → crea/reutiliza el cliente (`clients`, por email) y una cita `appointments` con
`status = "pending"` → emails (cliente + admin), WhatsApp al admin (solo enlace `wa.me` si no hay API) y aviso
"Manus" (`notifyOwner`).

**Admin.** `/crm/citas` (`Citas.tsx`) lista las citas y permite Aceptar (→ `confirmed` + emails), Cancelar con
motivo (→ `cancelled` + emails) y Proponer fechas (→ `rescheduled` + enlace de un solo uso
`/cita/seleccionar/:token`; el cliente elige y la cita vuelve a `pending`).

**Estados** (`appointments.status`): `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`.

**Pagos.** Stripe solo existe para **ebooks** (`ebooks.createCheckout` + webhook). Las citas no tienen cobro
online: `appointments.price` es informativo. No se ha tocado nada de Stripe, facturación ni pagos.

**Analítica.** El único código era una etiqueta de Umami en `index.html` con variables sin sustituir
(`%VITE_ANALYTICS_ENDPOINT%`): en producción pedía una URL inexistente y no medía nada. No hay GTM, gtag, píxeles
ni banner de consentimiento.

**Tests.** Solo `auth.logout.test.ts` y `whatsapp.test.ts` (este último ya fallaba: `generateBookingWhatsAppText`
no existe). Ninguno cubría reservas.

### Discrepancias código ↔ web ↔ requisitos

| # | Hallazgo | Gravedad |
|---|----------|----------|
| 1 | `bookings.request` validaba `serviceType` con un enum cerrado (`masaje`, `consulta_*`…), pero el formulario envía el **slug real** del servicio (`masaje_relajante_navas_de_rio_frio_segovia`…). Esos slugs no estaban en el enum ⇒ **la solicitud de cualquiera de los dos masajes reales era rechazada**. En producción no hay ni una cita de masaje (solo 3 citas, todas de consulta). | Crítica |
| 2 | El modal (montado siempre) fijaba el servicio solo en el primer render: abrir "Reservar" desde la tarjeta de otro masaje podía dejar el servicio equivocado ("Masaje Relajante" vs "Terapéutico"). | Alta |
| 3 | Formulario genérico: título "Solicitar consulta", campo "Tipo de consulta", Zoom preseleccionado, modalidades Zoom/Teléfono/WhatsApp para un masaje presencial. | Alta |
| 4 | **Zona horaria.** El servidor corre en UTC: `new Date("2026-10-10T10:00:00")` se guardaba como 10:00 UTC (= 12:00 en Madrid). Los emails de aceptación/cancelación formateaban sin zona. Hora preferida y hora mostrada no coincidían. | Alta |
| 5 | Nada impedía confirmar dos veces, confirmar una cita cancelada o cancelar una completada (cualquier estado → cualquier acción). | Media |
| 6 | Sin anti-duplicados (doble clic ⇒ dos citas y dos avisos). | Media |
| 7 | Las notificaciones eran "dispara y olvida": sin registro, sin saber si fallaron. Si no hay SMTP, `sendEmail` solo escribe en el log y devolvía éxito. | Alta |
| 8 | Cuando el cliente elegía una fecha propuesta, Cristina **no recibía ningún aviso**. | Media |
| 9 | Fecha pasada aceptada; el servidor no validaba nada de la fecha salvo que parseara. | Baja |
| 10 | El listado del CRM apilaba las columnas (faltaba la rejilla en cada fila). Sin filtros por servicio ni fecha. | Media |
| 11 | El Masaje Terapéutico tiene `modality = "ambos"` en BD y la web mostraba "Presencial / Online". | Media |
| 12 | El enlace "Confirmar por WhatsApp" del éxito sugería que el cliente confirmaba la cita. | Baja |

## 2. Flujo recomendado e implementado

```
Cliente: ficha de masaje → "Reservar" → formulario de masaje
   (servicio + duración + precio + lugar; fecha + franja; solo presencial)
   → "Revisar solicitud" (resumen) → "Enviar solicitud"
   → pantalla: "Solicitud recibida. Tu cita queda PENDIENTE de confirmación de Cristina"
Sistema: cita `pending` + historial + emails (cliente: "pendiente de confirmación"; Cristina: nueva solicitud)
Cristina (/crm/citas): lista con filtros → [Confirmar cita | Rechazar | Proponer otra fecha] → historial
   - Confirmar  → `confirmed` + email "Tu cita está confirmada" (con hora exacta en Madrid)
   - Rechazar   → `cancelled` + motivo + email
   - Proponer   → `rescheduled` + email con enlace → el cliente elige → vuelve a `pending` (+ aviso a Cristina)
```

- **Solicitud ≠ reserva.** Una cita solo está confirmada tras la acción "Confirmar cita". El texto del
  formulario, de la pantalla final y de los emails lo dice explícitamente.
- **Una solicitud no se convierte en confirmada por accidente:** `accept` solo funciona desde `pending`;
  `cancelar`/`proponer` no actúan sobre citas ya canceladas o completadas (error claro, nada se modifica).
  El desplegable manual de estado sigue existiendo (control de Cristina) pero deja rastro en el historial.
- **Modalidad.** Masaje ⇒ solo presencial (validado también en servidor). **Domicilio no se ofrece como opción**
  porque no hay cobertura ni tarifa configuradas: el formulario lo explica ("consulta tarifa y disponibilidad")
  y el cliente puede pedirlo en el mensaje.
- **Precio.** Se muestra el de la ficha (`services.price`): 70 € el Relajante, 80 € el Terapéutico. Se indica
  "se abona en la cita; no se cobra nada ahora". Sin precio ⇒ "Consultar tarifa".
- **Zona horaria.** Todo se interpreta y se muestra en `Europe/Madrid` (`server/bookingRules.ts`).
- **Datos de salud.** El campo libre es opcional y avisa "no incluyas datos de salud"; no se envía a ninguna
  plataforma de analítica ni de publicidad.

### Cobro con Stripe: cómo coordinarlo con la aceptación (NO implementado)

Hoy el masaje se paga en la cita. Si se quisiera cobrar online, recomendación:

1. **Opción A (recomendada, mínima):** no cobrar al solicitar. Al pulsar *Confirmar cita*, el email de confirmación
   incluye un enlace de pago (Stripe Checkout creado en ese momento con `appointmentId` en `metadata`, caducidad
   p. ej. 24–48 h). El webhook existente (`checkout.session.completed`) marcaría la cita como pagada y emitiría
   `booking_paid`. Nunca se cobra una fecha que Cristina no ha aceptado.
2. **Opción B:** autorización (captura manual) al solicitar y captura al confirmar. Más compleja (caducan a los 7
   días, gestión de rechazos/devoluciones) y para un servicio de 70–80 € no compensa.
3. **Opción C (estado actual):** pago en consulta.

Consecuencias de A: requiere un precio fiable por servicio (ya existe), un Price/Checkout dinámico, un campo de
estado de pago en la cita (migración) y decidir política de cancelación/devolución. Hasta que se decida, el
comportamiento actual se conserva intacto.

## 3. Admin (Cristina)

`/crm/citas`: filtros por estado (con "Pendiente de confirmar" y "Fechas propuestas"), por servicio
(Todos / Masajes / Consultas y otros) y por rango de fechas; rejilla de columnas corregida; botones según estado;
y **"Detalle e historial"** por cita: servicio, duración, precio informativo, modalidad, notas (franja y mensaje),
y el historial con cada cambio de estado (quién y cuándo) y cada notificación con su resultado
(*enviada / FALLÓ / no enviada (sin configurar)*). Permisos sin cambios: todo sigue tras `adminProcedure`.

Estado de pago: **no aplica todavía** (las citas no tienen cobro online); el detalle lo indica.

## 4. Preparación para Google Ads (no se ha tocado ninguna cuenta ni etiqueta)

Eventos definidos en `shared/bookingAnalytics.ts` y emitidos con `client/src/lib/analytics.ts`:

| Evento | Cuándo | Rol |
|--------|--------|-----|
| `booking_form_opened` | se abre el formulario | señal secundaria (intención, no conversión) |
| `booking_request_submitted` | el servidor aceptó la solicitud | **conversión primaria** (la única inmediata y fiable en web) |
| `booking_confirmed` | Cristina pulsa *Confirmar cita* | conversión de mayor calidad, **solo desde el admin**: no se puede emitir en el navegador; queda en el historial (`status_changed → confirmed`) para una futura importación de conversiones offline |
| `booking_paid` | cobro online (no existe hoy) | reservado |

Garantías: visitas y clics en "Reservar" no cuentan como reserva; solo se envían `service_slug`, `service_group`,
`modality`, `currency` (lista blanca, valores simples); nunca nombre, email, teléfono, texto libre ni datos de
salud, ni en parámetros de URL; **sin consentimiento no se emite nada** (por defecto, apagado) y no se carga ninguna
etiqueta de terceros. El sitio **aún no tiene banner de consentimiento**: cuando se añada, debe llamar a
`setConsent({analytics, ads})`.

## 5. Decisiones pendientes

### De Cristina

1. **Franjas horarias** del masaje: hoy mañana 9:00–13:00, tarde 16:00–20:00 y "sin preferencia" (`shared/booking.ts`).
   Confirmar que reflejan su disponibilidad real.
2. **Servicio a domicilio y tarifa**: la tarifa a domicilio (100 €), la cobertura/radio y si se reserva online o solo
   por consulta. Hoy **no se ofrece como opción**: el formulario indica que se pida en el mensaje. Implementarlo
   requiere un campo `homePrice` (migración + formulario del servicio + fichas) y una modalidad `domicilio` en
   `appointments.modality`.
3. **Cobro**: ¿se cobra online? Opciones de §2: A (enlace de pago al confirmar, recomendada), B (autorización al
   solicitar) o C (pago en consulta, estado actual). Hoy no se cobra nada al reservar y el formulario lo dice.
4. **Política de cancelación y devolución**, imprescindible si se cobra online (plazos, devoluciones, no-show).
5. **Lugar**: confirmar "Navas de Riofrío (Segovia)" como ubicación en consulta (constante en `shared/booking.ts`).

### De Jorge

6. **Cookies y Google Ads**: banner de consentimiento (hoy no existe), qué etiqueta cargar (GTM o gtag) y el ID `AW-…`.
   Hasta entonces la medición permanece apagada. Si se quiere medir `booking_confirmed`, decidir además el esquema de
   importación de conversiones offline (requiere guardar un identificador de clic con consentimiento).
7. **Dato del Masaje Terapéutico** (`modality = "ambos"` en la BD): la web ya lo muestra como "Presencial"; corregir
   el dato en el CRM cuando se quiera.
8. **Autorizar** la actualización de imágenes y la subida de PDFs de ebooks (ver "Pendiente de autorización").
9. **Variables de WhatsApp** (`WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_ID`) si se quiere envío automático en lugar del
   enlace `wa.me`; y qué hacer con el aviso interno de Manus (ocultarlo del historial si no se va a configurar).

### Observaciones sin decisión urgente

- El botón "Reservar consulta" de la cabecera abre el formulario de consulta aunque se esté en la ficha de un masaje.
- `/api/admin/login` devuelve datos de depuración (si email o contraseña coinciden) y los formularios públicos no tienen
  límite de envíos ni captcha: ya estaban antes de este trabajo.
- Las 3 citas anteriores se crearon con la zona horaria antigua y no se han tocado.
