# Estudio: aviso de reserva a Cristina con botones Aceptar / Declinar / Posponer

Fecha: 2026-10-02 · Estado: **estudio, sin implementar** (decisión pendiente)

## Qué hay hoy
- Al llegar una solicitud, el servidor registra el aviso a Cristina por email (si hay SMTP y ADMIN_EMAIL) y genera un enlace `wa.me` que **no se envía solo**: `server/whatsapp.ts` solo manda de verdad si existen `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_ID`, y lo hace con texto libre.
- Las acciones Aceptar / Cancelar / Proponer fechas ya existen y son seguras (`bookingActions.ts`, router del CRM, transiciones controladas por `ACCEPTABLE_FROM`, etc.). Cualquier canal nuevo debe reutilizarlas, no duplicarlas.

## Opción A — WhatsApp Business Platform (API oficial de Meta)
Cristina recibe un WhatsApp con los datos y 3 botones de respuesta rápida.
- Requisitos: cuenta Meta Business verificada, cuenta de WhatsApp Business (WABA), un número registrado en la API, y una **plantilla** aprobada por Meta (los mensajes iniciados por la empresa fuera de la ventana de 24 h solo pueden ser plantillas; admiten hasta 3 botones de respuesta rápida).
- Número: lo normal es un número distinto para el remitente (el de la API) y que Cristina siga usando el suyo (+34 657 165 343) como destinatario. Usar su número actual como remitente exige migrarlo o usar el modo de coexistencia con la app Business; hay que confirmarlo con Meta.
- Recepción de pulsaciones: un webhook (`POST /api/whatsapp/webhook`) con verificación del token y firma `X-Hub-Signature-256`. Debe comprobar que el remitente es el número de Cristina y que la cita sigue "pendiente" (idempotente).
- Aceptar y Declinar: llaman a las acciones existentes y envían el email/aviso al cliente como hoy.
- Posponer: necesita fechas. Lo razonable es que el botón responda (dentro de la ventana de 24 h ya se permite texto libre) con un enlace al CRM para proponer fechas, o con una lista de las próximas horas libres.
- Coste: pago por mensaje de plantilla (unos céntimos); comprobar la tarifa vigente de Meta para España. Trámite: verificación de empresa y aprobación de plantilla (días).
- Riesgos: depende de Meta (suspensión, cambios de política); hay que guardar el token como secreto en Railway; el aviso no debe incluir datos de salud (ya se evita en el formulario).

## Opción B — Enlaces firmados de un clic (email y WhatsApp)
El aviso (email hoy; también el enlace `wa.me`) incluye un enlace único `https://cristinaviveconsciente.es/a/<token>` con resumen de la cita y 3 botones.
- Sin coste ni trámites; funciona con SMTP ya existente. Cristina ve la cita y pulsa Aceptar / Declinar / Posponer en una página sencilla (sin entrar al CRM).
- Seguridad: token aleatorio largo, de un solo uso por acción, con caducidad; la acción se ejecuta con un POST tras pulsar el botón (un GET no cambia nada, para que los antivirus/previews del email no acepten citas solos); mismas reglas de transición que el CRM; registro en el historial de la cita.
- Límite: el aviso por WhatsApp no sería automático (sigue siendo un enlace `wa.me` que se abre a mano) salvo que se combine con A.

## Recomendación
1. **Hacer B ya**: poco trabajo, sin dependencias externas, y Cristina decide desde el móvil.
2. **Valorar A después** si Cristina quiere recibirlo en WhatsApp de forma automática. A reutiliza los mismos endpoints de B (token + acciones), así que B no se tira.
3. Decisión que necesito de Cristina para A: si acepta crear la cuenta Meta Business, qué número usar como remitente y que el negocio esté verificado.

## Cambios previos relacionados (esta rama)
- Horas fijas en el formulario de masajes (en lugar de franjas): cada 30 min dentro del horario, la sesión debe terminar antes de cerrar.
- El selector de servicio, al abrir el formulario desde un masaje, solo muestra masajes.
