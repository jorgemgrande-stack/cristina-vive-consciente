# Propuesta para Cristina: suscripción y emails de seguimiento

> **Propuesta para decidir, sin nada activado ni desactivado.** No cambia campañas, contenidos ni calendario de
> los emails. No es asesoramiento jurídico: las referencias legales son orientativas y conviene confirmarlas.

## 1. Cómo funciona hoy (comprobado en el código)

- **Formulario de contacto** (`/contacto`): cualquier persona que escribe recibe:
  - un email de bienvenida en el momento;
  - a los **3 días**, «El agua que bebes importa…» (guías);
  - a los **7 días**, «Un regalo para ti…» (productos y consultas).

  La casilla del formulario habla de la **política de privacidad**, no de recibir emails comerciales.
- **Bloque «Únete a la comunidad»** (misma página):
  - pide solo el email y **no tiene casilla**;
  - el código envía `acceptPrivacy: true` automáticamente;
  - activa la misma secuencia de emails.
- **Baja:**
  - los emails incluyen un enlace `mailto:` («Darse de baja») y la opción de responder «Baja»;
  - **nada lo procesa automáticamente**: alguien tiene que leer el correo y cancelar a mano;
  - en el código existe una función para cancelar la secuencia (`cancelLeadSequences`), pero **no se usa**.
- **Consentimiento:** no se guarda ningún registro de consentimiento para emails comerciales (cuándo, con qué texto, desde dónde).

## 2. Qué mecanismos faltan

Para que la suscripción sea **expresa** y la baja **automática**:

| # | Falta | Por qué |
|---|---|---|
| 1 | **Casilla separada y desmarcada** para recibir emails comerciales, distinta de la de privacidad, en el formulario de contacto y en el bloque de comunidad | Los emails comerciales requieren consentimiento previo y expreso (art. 21 LSSI). Aceptar la política de privacidad no equivale a aceptar publicidad. |
| 2 | **Registro del consentimiento:** fecha, origen (formulario), versión del texto de la casilla y email | Hay que poder demostrarlo (art. 7.1 RGPD). Necesita una migración aditiva (una tabla de suscripciones o columnas nuevas). |
| 3 | **Enviar la secuencia solo a quien marca la casilla** | Quien solo hace una pregunta recibe la respuesta, no publicidad. |
| 4 | **Enlace de baja de un clic** en cada email, con un token firmado por persona: abre una página «Te has dado de baja» y cancela al momento los envíos pendientes | La baja debe ser sencilla y gratuita (art. 22 LSSI). Se aprovecha `cancelLeadSequences`. |
| 5 | **Cabecera `List-Unsubscribe`** (baja de un clic, RFC 8058) en los emails comerciales | Gmail y Yahoo la exigen a remitentes de envíos masivos, y mejora la entrega. |
| 6 | **Lista de exclusión:** quien se da de baja no vuelve a entrar en la secuencia aunque escriba de nuevo por el formulario | Evita reactivar envíos sin un nuevo consentimiento. |
| 7 | **Texto del bloque de comunidad** que diga qué se va a recibir y con qué frecuencia | Consentimiento informado. |

## 3. Opciones

**A. Recomendada: secuencia solo con casilla.**
- Se añaden las piezas 1 a 7.
- Quien marca la casilla recibe la bienvenida y los emails de los días 3 y 7, igual que ahora, con el mismo contenido y el mismo calendario.
- Quien no la marca solo recibe la respuesta a su mensaje.

**B. Sin secuencia comercial desde el formulario.**
- El formulario de contacto solo responde.
- El bloque de comunidad desaparece o pasa a ser solo informativo.

**C. Dejarlo como está.** No se recomienda:
- se envían emails comerciales sin un consentimiento expreso que se pueda demostrar;
- la baja depende de una gestión manual.

## 4. Lo que tiene que decidir Cristina

1. **Opción:** A, B o C.
2. **Si es A:**
   - texto de la casilla (propuesta: «Quiero recibir por email contenidos, guías y novedades de Cristina Vive Consciente. Puedo darme de baja en cualquier momento.»);
   - si el email de bienvenida cuenta como comercial o solo como confirmación.
3. **Contactos que ya están en la secuencia:**
   - dejar que terminen sus envíos;
   - pausar los pendientes;
   - o pedirles confirmación.

   **No se toca nada sin su decisión.**
4. **Remitente y email de baja:** unificar (`hola@…es`, `info@…es`, `hola@…com`).

## 5. Qué haría falta después (estimación técnica)

**Con la opción A:**
- migración aditiva para guardar consentimientos y bajas;
- casillas en los dos formularios;
- comprobación en el servidor;
- página y endpoint de baja con token firmado;
- cabecera `List-Unsubscribe`;
- tests.

**Con la opción B:** quitar la programación de la secuencia en el formulario y ajustar el bloque de comunidad.

**En ambos casos:**
- un PR separado;
- pruebas con direcciones ficticias;
- ningún cambio en los emails ya enviados.
