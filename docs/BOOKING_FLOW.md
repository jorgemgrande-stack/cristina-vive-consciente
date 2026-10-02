# Reservas de masajes — auditoría, flujo y medición

Auditoría y despliegue: 2026-10-02. **Estado: implementado y desplegado en producción** (ver §0).

## 0. Estado actual (resumen)

### Actualización 2026-10-02 (tarde): datos de Cristina, domicilio y cookies — rama `feat/reservas-horarios-domicilio-cookies`

> Esta parte **está en una rama y NO está desplegada** hasta que se fusione (al fusionar, Railway despliega solo).

Datos facilitados por Cristina y ya aplicados en el código (`shared/booking.ts`, única fuente):

- **Horario:** lunes a viernes 10:00–13:00 y 16:00–19:00; sábados y domingos 10:00–19:00. El formulario ofrece
  franjas según el día (entre semana mañana y tarde; fin de semana también mediodía 13:00–16:00) y el servidor
  rechaza una franja que no exista ese día. Sustituye a las franjas provisionales anteriores (9–13 y 16–20).
- **Tarifas:** Terapéutico 80 € en consulta y **110 € a domicilio**; Relajante 70 € en consulta y **100 € a domicilio**.
  El Terapéutico de 90 min (120 €) no tiene tarifa a domicilio y no la ofrece.
- **Domicilio:** el cliente elige "En consulta" o "A domicilio"; a domicilio exige dirección. Se guarda como modalidad
  `presencial` + etiqueta "· a domicilio" + precio de domicilio + la dirección en las notas internas de la cita (así no
  hace falta ninguna migración). Cristina confirma si puede desplazarse a la zona. Las tarifas a domicilio viven por ahora
  en `HOME_SERVICE_PRICES` (constante); un campo `homePrice` en BD queda como mejora futura.
- **Pago:** de momento se reserva y se paga **en consulta**; el formulario y la ficha lo dicen ("no se cobra nada al
  enviar la solicitud"). Posible señal del 50 % por Bizum: **sin implementar** (ver decisiones).
- **Política de cancelación:** texto estándar de centros de masaje (24 h de antelación; con menos, posible señal previa
  para una nueva cita; las señales se devuelven íntegras con 24 h o más). Se muestra en el resumen previo al envío y en la
  ficha. **Es un borrador original, pendiente de que Cristina lo valide.**
- **Ubicación:** enlace "Ver en Google Maps" (búsqueda "Bion Cristina - Masajes") en el formulario y en la ficha.
- **Cookies y Google Ads preparados:** banner de consentimiento (Rechazar / Configurar / Aceptar todo, mismo peso visual;
  se reabre desde el pie), página `/politica-de-cookies` (borrador descriptivo) y carga de Google tag **solo si** hay IDs
  (`VITE_GOOGLE_ADS_ID`, `VITE_GA4_ID`, `VITE_GOOGLE_ADS_BOOKING_LABEL`) **y** consentimiento, con Consent Mode v2
  (todo "denied" por defecto). La conversión de Ads es `booking_request_submitted`, sin valor ni datos personales.
  Sin IDs no se descarga nada de Google (como hoy). No se ha creado ninguna cuenta ni campaña.

Comprobaciones de esta rama (Chrome contra BD de prueba y SMTP falso): formulario/consultas 20/20, admin 27/27,
móvil 390/360 px 14/14, horarios+domicilio+cookies+medición 27/27 (29/29 construyendo con IDs de prueba: gtag solo tras
consentimiento, conversión sin datos). Tests unitarios y de router ampliados.

**Hecho en producción (autorizado por Jorge):** se ejecutó `scripts/relocate-images-2026-10.mjs`: portadas de los 2 ebooks
(`/site/hero-agua.webp`, `/site/hero-aceites.webp`; `pdfUrl` muerto → NULL) y la imagen de 6 productos afiliados
(ids 16, 28, 50, 60, 76, 81). Verificado: las imágenes responden 200. Copia de los valores anteriores guardada fuera del
repositorio.

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

### Imágenes y PDFs de los ebooks

- Imágenes de ebooks y afiliados: **hecho** (ver arriba).
- **PDFs de los ebooks: pendiente.** Los originales estaban en el CDN caído y no hay copia. Hay que aportar los dos
  archivos para subirlos como `/uploads/ebooks/ebook-agua.pdf` y `/uploads/ebooks/ebook-aceites.pdf` (hasta entonces la
  descarga tras una compra daría error; hoy los ebooks no tienen precio de Stripe configurado).

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
- **Modalidad.** Masaje ⇒ solo presencial (nada de Zoom, teléfono ni WhatsApp; validado también en servidor). Desde
  la rama de 2026-10-02 el cliente elige además dónde: en consulta (Navas de Riofrío) o a domicilio (con dirección y tarifa
  de domicilio) en los servicios que la tienen. A domicilio se guarda como presencial + etiqueta "· a domicilio".
- **Precio.** En consulta, el de la ficha (`services.price`): 70 € el Relajante, 80 € el Terapéutico; a domicilio, 100 € y
  110 € (constantes en `shared/booking.ts`). Se indica "se abona en la cita; no se cobra nada al enviar". Sin precio ⇒
  "Consultar tarifa".
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

### Resueltas (2026-10-02)

- Franjas horarias → horario real de Cristina (ver arriba).
- Tarifa a domicilio y si se ofrece → 110 € / 100 €, reservable desde el formulario con dirección.
- Cobro → por ahora en consulta. Política de cancelación → borrador estándar (pendiente de validar).
- Ubicación → "Navas de Riofrío (Segovia)" + ficha de Google "Bion Cristina - Masajes".
- Banner de cookies y preparación de Google Ads → hechos (apagados sin IDs).

### De Cristina

1. **Validar la política de cancelación** (24 h, señal previa, devolución íntegra con 24 h o más) o ajustarla.
2. **Bizum 50 %:** ¿se quiere pedir una señal del 50 % por Bizum al confirmar y el resto en consulta? Si sí, hay que
   decidir cómo se comunica (en el email de confirmación) y cómo se registra el abono (hoy no hay estado de pago en la cita).
3. **Cobertura del servicio a domicilio:** radio o localidades a las que se desplaza (hoy Cristina lo confirma caso por caso
   al responder; no se bloquea ninguna dirección).
4. **Textos del CRM:** las fichas de los masajes aún dicen "Para domicilio consultar tarifas" (Terapéutico 60 y 90 min) y el
   Terapéutico de 90 min dice "duración de 1 hora": se corrigen desde `/crm` (Servicios) o con un script con autorización.
5. **Terapéutico de 90 min:** ¿tiene servicio a domicilio y a qué precio? Hoy no se ofrece (sin tarifa).

### De Jorge

6. **Google Ads / Analytics:** crear/aportar el ID `AW-…` (y GA4 `G-…` si se quiere), la etiqueta de conversión de "solicitud
   de reserva", y definirlos como variables de entorno de Vite en Railway (requiere nuevo despliegue). Revisión legal de la
   política de cookies y, cuando existan, de privacidad y términos (hoy "Próximamente").
7. **Subir los PDFs de los ebooks** (aportar los archivos).
8. **Dato del Masaje Terapéutico** (`modality = "ambos"` en la BD): la web ya lo muestra como "Presencial".
9. **WhatsApp automático** (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID`): **para más adelante**; mientras tanto solo hay enlaces `wa.me`.
10. **Fusionar la rama** `feat/reservas-horarios-domicilio-cookies` cuando se dé el visto bueno (despliega solo).

### Observaciones sin decisión urgente

- El botón "Reservar consulta" de la cabecera abre el formulario de consulta aunque se esté en la ficha de un masaje.
- `/api/admin/login` devuelve datos de depuración (si email o contraseña coinciden) y los formularios públicos no tienen
  límite de envíos ni captcha: ya estaban antes de este trabajo.
- Las 3 citas anteriores se crearon con la zona horaria antigua y no se han tocado.
