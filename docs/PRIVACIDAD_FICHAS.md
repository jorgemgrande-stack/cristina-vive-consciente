# Privacidad de las fichas de clientes

> **No es asesoramiento jurídico.** Este documento recoge requisitos técnicos y preguntas que deben confirmar
> Cristina y un asesor de protección de datos. Ninguna conclusión de aquí está verificada como cumplimiento
> legal. Las secciones con datos de salud o emocionales **siguen desactivadas en producción**.

## 1. Qué datos hay y cómo se separan

| Tipo | Dónde | Estado |
|---|---|---|
| Administrativos y prácticos: nombre, teléfono, citas, tarifa particular, «Información para recordar» y notas prácticas de sesión | `clients`, `session_history` y `appointments`, en texto normal | Activo |
| **Ficha de primera visita**: motivo, alergias o sensibilidades, salud relevante para la sesión, zonas a evitar, bienestar físico o emocional y observaciones | `client_sensitive_records` (`module = first_visit`), **cifrado** | **Desactivado** |
| **Acompañamiento emocional**: relato del cliente, observaciones de la profesional y seguimiento | `client_sensitive_records` (`module = emotional`), **cifrado** | **Desactivado** |
| Consentimientos: fecha, versión del texto, forma de obtención y retirada | `client_consents` | Desactivado, igual que su módulo |
| Registro de accesos y cambios: quién, qué acción y qué campos, **nunca el contenido** | `crm_audit_log` | Activo |

La interfaz pide expresamente que **no** se escriban datos de salud, emocionales ni familiares en los campos administrativos.

**Aviso sobre datos que ya existen:** 106 clientes tienen texto en el campo antiguo `clients.notes`, procedente de la importación inicial. No se ha leído ni copiado. Se muestra plegado como «Notas importadas» y con un aviso. **Cristina debe revisarlo** y retirar cualquier dato de salud o personal sensible.

## 2. Conclusiones de la revisión normativa (pendientes de confirmar)

Fuentes oficiales consultadas:
- **RGPD:** DOUE L 119 de 4.5.2016 (<https://www.boe.es/doue/2016/119/L00001-00088.pdf>; conviene cotejarlo en EUR-Lex).
- **LOPDGDD:** <https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673>
- **CEPD, Directrices 05/2020 sobre el consentimiento:** <https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_es.pdf>
- **AEPD:** listas de EIPD de los artículos 35.4 y 35.5 (<https://www.aepd.es/documento/listas-dpia-es-35-4.pdf>, <https://www.aepd.es/documento/listasdpia-35.5l.pdf>), Facilita (<https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd>), Guía para el sector sanitario (<https://www.aepd.es/guias/guia-profesionales-sector-sanitario.pdf>) y nota sobre el Marco de Privacidad UE-EE. UU. (<https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-valora-sentencia-tribunal-general-ue-que-confirma-marco-transferencias-datos-ue-eeuu>).

1. **Son datos de salud.** La ficha de primera visita y, con alta probabilidad, el acompañamiento emocional son «datos relativos a la salud» (art. 4.15 y considerando 35 RGPD), independientemente de que quien los recoja no sea sanitaria. Un relato libre puede revelar además otras categorías especiales, como creencias o vida sexual (art. 9.1). Por eso los formularios **no** preguntan por ellas.
2. **Bases jurídicas.**
   - **Datos administrativos:** previsiblemente la ejecución de un contrato (art. 6.1.b).
   - **Primera visita y acompañamiento:** la vía más plausible para una profesional no sanitaria es el **consentimiento explícito (art. 9.2.a)**, con un consentimiento separado para cada finalidad (CEPD 05/2020, apartado 44).
   - **El art. 9.2.h y el 9.3 probablemente no aplican:** exigen asistencia sanitaria o un profesional con secreto profesional establecido por ley. **Lo debe confirmar un asesor.**
3. **Requisitos del consentimiento.** Debe ser demostrable (art. 7.1), separado de otros asuntos (art. 7.2), retirable con la misma facilidad (art. 7.3), libre (art. 7.4) y mediante una declaración expresa (CEPD, apartado 93).
   - **Duda abierta:** si es «libre» cuando la ficha se presenta como requisito de seguridad para dar la sesión. **Lo debe valorar un asesor.**
4. **Información al cliente.** Hay que darle la información del art. 13, que puede ser por capas (art. 11 LOPDGDD).
5. **Registro de actividades (art. 30.5):** **obligatorio**, porque incluye categorías especiales.
6. **Evaluación de impacto (EIPD):** se cumple al menos el criterio «categorías especiales» de la lista de la AEPD, y quizá el de «aspectos de la personalidad». La exclusión de los autónomos que ejercen de forma individual decae si se cumplen dos o más criterios. **Un asesor debe decidir si hace falta.** Como mínimo, documentar un análisis de riesgos. Facilita **no** sirve para datos de salud.
7. **Delegado de protección de datos:** previsiblemente no es obligatorio, porque la escala es pequeña y la profesional ejerce a título individual. Conviene documentar la decisión.
8. **Retirada del consentimiento:** obliga a suprimir los datos si no hay otra base (art. 17.1.b; CEPD, apartado 119). Ver §5.
9. **Encargados y transferencias.** Railway, el alojamiento, es encargado del tratamiento (art. 28) y es una empresa de EE. UU.
   - Hay que revisar su contrato de encargado (DPA) y sus subencargados, y comprobar su certificación en el Marco de Privacidad de Datos UE-EE. UU. en dataprivacyframework.gov. Si no la tiene, hacen falta otras garantías (art. 46).
   - **Nada de esto está verificado.**
10. **Terceros.** No se envían datos de salud ni emocionales a IA, analítica, correo ni WhatsApp (ver §4).

**No verificado:**
- la certificación y el DPA de Railway;
- los plazos legales de conservación aplicables a este sector;
- la posible regulación autonómica de la kinesiología;
- los plazos de notificación de brechas (arts. 33 y 34).

## 3. Lista de preparación antes de activar cualquier sección protegida

Ninguna casilla está resuelta. Marcarlas es responsabilidad de Cristina, con un asesor donde se indica.

- [ ] **Asesor:** confirmar la base jurídica: art. 6.1.a + 9.2.a para la primera visita y el acompañamiento, y 6.1.b para lo administrativo. Confirmar que no aplica el 9.2.h ni el 9.3.
- [ ] **Cristina:** confirmar que no es sanitaria colegiada ni centro sanitario autorizado, y si su comunidad autónoma regula alguna de sus actividades.
- [ ] **Asesor:** decidir si la ficha de primera visita puede ser condición para dar la sesión sin que el consentimiento deje de ser libre.
- [ ] **Finalidad y minimización:** revisar campo por campo qué es imprescindible. Pueden quitarse campos.
- [ ] **Textos:** cláusula del art. 13 por capas y **dos** textos de consentimiento separados, uno por módulo, con versión. Los redacta o revisa el asesor y los valida Cristina.
- [ ] **Registro de actividades** (art. 30) completado.
- [ ] **Análisis de riesgos y decisión motivada sobre la EIPD.**
- [ ] **Decisión documentada** sobre el delegado de protección de datos.
- [ ] **Railway:** DPA aceptado, subencargados revisados, región de los datos y certificación en el Marco de Privacidad de Datos comprobadas.
- [ ] **Conservación:** plazos y criterios definidos (§5).
- [ ] **Procedimientos:** atención de derechos en un mes (§6) y gestión de brechas.
- [ ] **Seguridad (§4):** clave de cifrado generada y custodiada; **segundo factor de autenticación** para el acceso de administración (pendiente, §7); copias de seguridad cifradas y probadas.

## 4. Medidas técnicas implementadas

- **Bloqueo de servidor por defecto.**
  - `server/sensitive/config.ts`: un módulo solo se habilita si están **todas** las variables de §8.
  - **Con el módulo desactivado:** el servidor rechaza con `FORBIDDEN` leer, crear o modificar datos y consentimientos de ese módulo **antes de validar la entrada o consultar la base de datos**. No basta con ocultar la pestaña. El rechazo se registra en la auditoría, sin contenido.
- **Cifrado de aplicación AES-256-GCM** (`server/sensitive/crypto.ts`).
  - Cada registro va ligado a su cliente y a su módulo: un texto cifrado copiado a otra ficha o a otro módulo no se descifra, y cualquier manipulación se detecta.
  - En la base de datos y en sus copias solo hay texto cifrado.
  - La clave viene del entorno del servidor y nunca del repositorio.
- **Consentimiento por módulo** (`client_consents`).
  - Sin uno vigente, el servidor no guarda nada.
  - Retirarlo bloquea los registros nuevos, deja constancia de la fecha y marca `reviewRequired`.
- **Registro de accesos y cambios** (`crm_audit_log`): quién, qué acción, sobre qué registro y qué campos. Se registran las lecturas de datos sensibles y los intentos rechazados. **Nunca el contenido.**
- **Sin fugas.**
  - Los errores no repiten el texto recibido.
  - Los datos sensibles no se registran en consola ni se envían por correo, WhatsApp, analítica ni a terceros.
  - El módulo no importa ningún servicio de notificaciones. Los tests espían `fetch`, correo y WhatsApp.
- **Acceso de administración reforzado.**
  - Credenciales comparadas en tiempo constante.
  - Límite de 5 intentos fallidos cada 15 minutos por IP.
  - Cookie `httpOnly`, `sameSite=lax` y `secure` en producción, con sesión de 30 días.
  - **Corregido:** el login respondía con pistas sobre el email y la longitud de las credenciales.
- **Mínimo privilegio:** solo existe un perfil, el de administración, y todas las operaciones exigen ese rol en el servidor. No se han creado usuarios nuevos.
- **Sin datos de producción en pruebas:** los tests y las pruebas en navegador usan la base `cristina_test`, con datos ficticios (`scripts/fixtures/clientes-ficticios.sql`).

## 5. Conservación y supresión (configurable, sin plazos inventados)

- **Plazos:** no se ha fijado ninguno, porque **los decide Cristina con el asesor** (art. 5.1.e; art. 32 LOPDGDD sobre el bloqueo). Hasta entonces no hay borrado automático.
- **Herramientas disponibles en el CRM:**
  - **Suprimir datos de un módulo** (`care.rights.eraseModule`): borra los registros cifrados sin necesidad de leerlos. Se ofrece al retirar el consentimiento.
  - **Suprimir la ficha** (`care.rights.erase`): borra sesiones, notas, datos sensibles y consentimientos, y vacía los campos de la ficha. **No** toca citas ni facturas, que pueden estar sujetas a otras obligaciones de conservación a confirmar. Pide escribir el nombre completo del cliente.
  - **Eliminar el cliente** (función existente): ahora borra también sus datos sensibles y sus consentimientos.
- **Cuando se fijen los plazos:** documentarlos aquí y, si se desea, programar un proceso de revisión que **proponga** borrados (no que los ejecute solo).

## 6. Derechos (arts. 15 a 21)

- **Acceso y portabilidad:** `care.rights.export` devuelve un JSON estructurado. Los datos sensibles solo se incluyen si su módulo está habilitado; si no, solo se indica cuántos registros hay.
- **Rectificación:** edición desde la ficha, con trazabilidad.
- **Supresión:** ver §5.
- **Plazo:** un mes, prorrogable dos más (art. 12.3).
- **Registro:** apuntar cada solicitud y su respuesta.

## 7. Requisitos técnicos pendientes antes de activar

1. **Segundo factor de autenticación (2FA)** para el acceso de administración. Ahora es solo una contraseña, y la AEPD lo recomienda para datos de salud.
2. **Custodia de la clave de cifrado.** Se guarda en las variables de entorno de Railway, el mismo proveedor que la base de datos, así que protege frente a copias o exportaciones de la base, pero no frente a un acceso a la cuenta de Railway. Valorar un gestor de secretos, y documentar cómo se rota la clave (`SENSITIVE_KEY_VERSION`) y cómo se recupera si se pierde: **sin la clave, los datos son irrecuperables**.
3. **Copias de seguridad cifradas y prueba de restauración** de la base de datos de Railway.
4. **Cifrado en reposo de MySQL en Railway:** no verificado.

## 8. Pasos exactos para habilitar un módulo (cuando §3 y §7 estén resueltos)

1. Generar la clave en un equipo de confianza y guardarla también fuera de Railway, para poder recuperarla:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. En Railway, en el servicio web, añadir estas variables **sin publicarlas en ningún otro sitio**:
   - `SENSITIVE_DATA_KEY=<clave>`
   - `SENSITIVE_KEY_VERSION=k1`
   - `PRIVACY_REVIEW_REF=<referencia del análisis de riesgos o EIPD y fecha>`
   - `PRIVACY_LEGAL_BASIS=explicit_consent`
   - `PRIVACY_NOTICE_VERSION=<versión del texto de consentimiento aprobado>`
   - **Y solo el módulo que se quiera habilitar:** `SENSITIVE_FIRST_VISIT_ENABLED=true` y/o `SENSITIVE_EMOTIONAL_ENABLED=true`
3. Redesplegar. Comprobar en una ficha de prueba que la sección muestra «Registrar consentimiento».
4. Para cada cliente: obtener **antes** su consentimiento explícito con el texto vigente, registrarlo en la ficha y solo después anotar datos.
5. Para desactivar un módulo: quitar su variable `…_ENABLED` y redesplegar. Los datos siguen cifrados y bloqueados.
