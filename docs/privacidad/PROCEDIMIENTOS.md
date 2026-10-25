# Procedimientos: conservación, supresión, derechos y brechas

> **Borrador de trabajo para Cristina.** No es asesoramiento jurídico. Los plazos marcados como «a decidir»
> requieren su decisión, con revisión profesional si lo estima necesario.

## 1. Consentimiento (Primera visita y Acompañamiento)

1. Antes de anotar nada, en la pestaña del módulo pulsa «Pedir consentimiento».
2. Enseña al cliente el texto que aparece: **en papel para firmar** o por el medio electrónico que se use.
3. Si lo acepta expresamente, marca la casilla, elige la forma y pulsa «Registrar consentimiento». Queda constancia de:
   - el cliente y el módulo;
   - la versión del texto (`pv-2026-10-v1` o `ae-2026-10-v1`);
   - la fecha;
   - la forma (papel firmado o formulario electrónico).
4. **Copias en papel:** guárdalas en _[lugar a decidir por Cristina]_ mientras se conserven los datos y _[plazo a decidir]_ después, para poder demostrar el consentimiento (art. 7.1 RGPD).
5. Si el cliente no consiente, no se anota nada en ese módulo. Acompañamiento **nunca** condiciona una reserva.
6. **Si cambia un texto:** hay que subir su versión en `shared/clientCare.ts`. Los consentimientos anteriores conservan su versión. Decidir con un profesional si hace falta pedirlos de nuevo.

## 2. Conservación

| Datos | Mientras… | Revisión | Al terminar |
|---|---|---|---|
| Primera visita y Acompañamiento | haya consentimiento vigente y sean necesarios para las sesiones | Aviso automático cada **12 meses** (Clientes y ficha). Cristina decide si siguen siendo necesarios. | «Suprimir esta sección». Si se retira el consentimiento, se suprimen en el acto. |
| Registro de consentimientos | se conserven los datos, y después _[plazo a decidir]_ para acreditar | — | Se borra con «Suprimir ficha» |
| Ficha general, sesiones y notas | haya relación con el cliente | _[periodicidad a decidir]_ | «Suprimir ficha» |
| Citas y facturas | _[plazos legales a confirmar: obligaciones fiscales y contables]_ | — | La aplicación no las borra al suprimir la ficha |
| Auditoría (`crm_audit_log`) | _[plazo a decidir]_ | — | Hoy no hay borrado automático |

**A decidir por Cristina:** los plazos marcados, y si un cliente sin actividad durante X meses debe tratarse como relación terminada.

## 3. Derechos de los clientes

**Cómo llega una solicitud:** por el correo de contacto. Hay que unificar cuál; ver la página de privacidad.

1. **Registrar** la fecha de entrada, el cliente, el derecho que ejerce y la fecha de respuesta, en _[hoja o carpeta a decidir]_. No apuntes en ese registro el contenido de los datos.
2. **Identificar** al solicitante de forma proporcionada, por ejemplo respondiendo desde el email o teléfono que ya consta en la ficha.
3. **Plazo:** un mes desde la recepción, prorrogable dos meses más en casos complejos, avisando al cliente (art. 12.3 RGPD).
4. **Qué hacer en cada caso:**

| Derecho | Qué hacer |
|---|---|
| Acceso o portabilidad | Ficha → Resumen → «Datos del cliente» → «Exportar todo». Para un solo módulo, «Exportar esta sección». Enviar el archivo por un canal seguro: **no** por WhatsApp ni como adjunto sin cifrar. Por ejemplo, entregarlo en persona o en un archivo comprimido con contraseña, y la contraseña por otro canal. |
| Rectificación | Editar el dato en la ficha. Queda registrado en la auditoría. |
| Supresión | «Suprimir esta sección» o «Suprimir ficha». Las citas y facturas se conservan si hay una obligación legal. |
| Retirada del consentimiento | En el módulo: «Retirar» → «Retirar y suprimir». |
| Oposición o limitación | Valorar caso a caso, con ayuda profesional si hace falta. |

5. **Responder** al cliente indicando lo que se ha hecho.

## 4. Brechas de seguridad

**Qué es una brecha:** cualquier pérdida, acceso o divulgación no autorizada de datos personales. Ejemplos:
- acceso de un tercero al CRM o a Railway;
- móvil u ordenador perdido con la sesión abierta;
- envío de datos a la persona equivocada;
- pérdida de la clave de cifrado.

1. **Contener, de inmediato:**
   - cambiar la contraseña de administración (`ADMIN_PASSWORD` en Railway) y la de Railway;
   - cerrar las sesiones, cambiando `JWT_SECRET` en Railway, lo que invalida todas las sesiones;
   - revocar los accesos que hagan falta.
2. **Evaluar:**
   - qué datos se han visto afectados (`crm_audit_log` muestra quién leyó o cambió qué ficha y cuándo, sin contenido);
   - si son de Primera visita o Acompañamiento;
   - si estaban cifrados y si la clave pudo verse comprometida.
3. **Notificar a la AEPD** en un máximo de **72 horas** desde que se tiene conocimiento, salvo que sea improbable que suponga un riesgo para las personas (art. 33). Se hace en la sede electrónica de la AEPD.
4. **Comunicar a los afectados** sin dilación si hay un riesgo alto (art. 34).
5. **Documentar toda brecha**, aunque no se notifique: fecha, hechos, datos afectados, efectos, medidas y decisión sobre la notificación (art. 33.5). Guardar el documento en _[lugar a decidir]_.
6. **Si la clave de cifrado se viera comprometida:** generar una clave nueva y volver a cifrar los datos. **Hoy no existe el script para hacerlo**: es una tarea técnica pendiente.

**Contactos:**
- soporte de Railway (desde el panel);
- _[profesional de protección de datos de referencia, a decidir]_.

## 5. Revisión de este documento

Revisar cada año o cuando cambie el tratamiento (nuevos campos, proveedores o región del servidor).
