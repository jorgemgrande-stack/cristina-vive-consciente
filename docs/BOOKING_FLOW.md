# Reservas de masajes — auditoría, flujo y medición

Estado: rama `feat/reservas-masaje` (sin desplegar). Fecha de la auditoría: 2026-10-02.

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

1. **Migración `drizzle/0020_appointment_events.sql`** (tabla nueva `appointment_events`). Hasta aplicarla en
   producción el código funciona igual pero no hay historial (el admin lo indica). Aplicar a mano, como el resto.
2. **Cobro online** (ver §2): A / B / C.
3. **Servicio a domicilio**: precio (100 €), cobertura/radio y si se reserva online o solo por consulta. Requiere un
   campo `homePrice` (migración + formulario del servicio + fichas) y una modalidad `domicilio` en el enum de
   `appointments.modality`.
4. **Masaje Terapéutico con `modality = "ambos"` en la BD**: el front ya lo muestra como "Presencial". Corregir el
   dato (`presencial`) en el CRM cuando se quiera; no se ha tocado producción.
5. **Franjas horarias** (mañana 9–13, tarde 16–20): confirmar con Cristina; están en `shared/booking.ts`.
6. **Lugar**: "Navas de Riofrío (Segovia)" está como constante en `shared/booking.ts` (los servicios no tienen campo
   de ubicación).
7. **Consentimiento de cookies** y qué etiqueta cargar (GTM / gtag) y con qué ID `AW-…`.
8. **Verificar en Railway** las variables `SMTP_*`, `ADMIN_EMAIL` y `WHATSAPP_*` (no se pudieron leer): sin SMTP o sin
   `ADMIN_EMAIL` las notificaciones quedan como "no enviada (sin configurar)" en el historial.
9. El aviso interno `notifyOwner` depende del servicio de Manus: sin configurar, se registra como "no enviada".
10. Las 3 citas existentes se crearon con la zona horaria antigua: no se han tocado.
