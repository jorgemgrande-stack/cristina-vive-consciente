# WhatsApp al cliente cuando Cristina acepta una cita

## Hoy (sin coste, sin trámites)
Al aceptar una cita, el cliente recibe el **email** de confirmación. Además, Cristina tiene un **botón de WhatsApp con el mensaje ya redactado**:
- en la página del enlace del aviso (`/a/…`), justo después de aceptar: «Avisar a {nombre} por WhatsApp»;
- en el CRM → Citas: el icono verde de WhatsApp de una cita **confirmada** abre el chat con el texto de confirmación.

Texto: «Hola {nombre}, soy Cristina (BION). Tu cita de {servicio} está confirmada para el {día} a las {hora}, {lugar}. Si necesitas cambiarla, respóndeme por aquí. ¡Hasta pronto! 🌿»

## Automático (sin que Cristina pulse nada)
WhatsApp solo permite que una empresa escriba primero con una **plantilla aprobada por Meta** y desde la **API de WhatsApp Business** (el mismo requisito del estudio del aviso a Cristina). El código ya está preparado y **se activa solo** cuando existen estas variables en Railway:

| Variable | Qué es |
|---|---|
| `WHATSAPP_API_TOKEN` | Token permanente de la WhatsApp Business Platform |
| `WHATSAPP_PHONE_ID` | Identificador del número remitente |
| `WHATSAPP_TEMPLATE_CONFIRMED` | Nombre de la plantilla aprobada (categoría **Utilidad**) |
| `WHATSAPP_TEMPLATE_LANG` | Opcional; por defecto `es` |

Plantilla a aprobar (5 variables de texto, en este orden): `{{1}}` nombre · `{{2}}` servicio · `{{3}}` día · `{{4}}` hora · `{{5}}` lugar.

> Hola {{1}}, soy Cristina (BION). Tu cita de {{2}} está confirmada para el {{3}} a las {{4}}, {{5}}. Si necesitas cambiarla, respóndeme por aquí.

Requisitos: cuenta Meta Business verificada, WABA y un número remitente (lo normal es un número distinto al personal de Cristina). Coste: unos céntimos por mensaje de plantilla (consultar la tarifa vigente de Meta).

- Sin la API configurada, el intento queda en el historial de la cita como **«omitido»** (no es un error) y se usa el botón.
- Si la API responde con error, queda como **«fallida»** con el motivo, y el botón sigue disponible.
- El cliente debe tener teléfono: desde ahora es **obligatorio** en el formulario.

## Teléfono obligatorio
- Formulario: «Teléfono *»; el servidor lo valida y lo guarda en formato único (`+34693026894`).
- Si el cliente ya existía (mismo email), la reserva **actualiza** su teléfono (antes no lo hacía: por eso un cliente creado sin teléfono seguía sin él).
- CRM → Citas: el teléfono se ve siempre bajo el nombre (clicable) y, si falta, se avisa en rojo.
