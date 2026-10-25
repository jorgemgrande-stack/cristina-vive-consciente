# Primera visita y Acompañamiento emocional: tratamiento de los datos

> **No es asesoramiento jurídico ni una declaración de cumplimiento.** Recoge las reglas de uso decididas para la
> ficha, cómo las aplica la aplicación y qué queda pendiente (§6). Las medidas técnicas ayudan, pero no
> garantizan por sí solas el cumplimiento del RGPD ni de la LOPDGDD.

## 1. Reglas de uso

1. **Finalidad:** ayudar a Cristina a preparar las sesiones, darles seguimiento y conocer las preferencias que el cliente quiera compartir. Nada más.
2. **Minimización:** solo lo que el cliente quiera contar y sea útil para esa finalidad. Todos los campos son opcionales y breves.
3. **Sin diagnósticos:** no se escriben diagnósticos médicos ni psicológicos, y Cristina no se presenta como profesional sanitaria.
4. **Separación:** datos generales (Resumen, Citas, Notas), Primera visita, Sesiones y Acompañamiento emocional están separados.
5. **Consentimiento explícito, informado, voluntario y separado** para Primera visita y para Acompañamiento:
   - nunca se marca por defecto;
   - aceptar el módulo emocional no es condición para reservar ni recibir ningún servicio.
6. **Antes de guardar,** el servidor comprueba que existe el consentimiento vigente de ese cliente para ese módulo.
7. **Registro y retirada:** se registran la fecha, la versión del texto y la forma del consentimiento. Se puede retirar desde la ficha, y al retirarlo se suprimen los datos del módulo.
8. **Acceso:** Cristina es por ahora la única usuaria administradora. Hay autenticación, cifrado, control de acceso y auditoría, sin escribir nunca el contenido en los registros.
9. **Sin terceros:** estos datos no van a analítica, publicidad, herramientas de IA, correo ni WhatsApp.
10. **Derechos:** se pueden exportar y suprimir los datos de todo el cliente o de cada módulo.
11. **Conservación limitada:** hay una revisión periódica, y se eliminan los datos cuando dejan de ser necesarios o cuando se pide, salvo obligación legal de conservarlos.

## 2. Qué datos hay y dónde

| Tipo | Dónde | Cómo |
|---|---|---|
| Generales y prácticos: contacto, citas, tarifa, «Información para recordar», notas de gestión y notas prácticas de sesión | `clients`, `appointments`, `client_notes`, `session_history` | Texto normal |
| **Primera visita:** motivo, alergias o sensibilidades, circunstancias para la sesión, zonas a evitar, cómo se encuentra, otras observaciones | `client_sensitive_records` (`module = first_visit`) | **Cifrado** |
| **Acompañamiento emocional:** relato del cliente, observaciones de Cristina, objetivos y pendientes (anotaciones fechadas) | `client_sensitive_records` (`module = emotional`) | **Cifrado** |
| Consentimientos: fecha, versión del texto, forma, retirada y última revisión | `client_consents` | Sin datos de salud |
| Registro de accesos y cambios: quién, acción y nombres de campos, **nunca contenido** | `crm_audit_log` | — |

## 3. Cómo aplica la aplicación cada regla

| Regla | Dónde se aplica |
|---|---|
| Minimización y campos breves | Esquemas `firstVisitPayload` y `emotionalPayload` en `shared/clientCare.ts`. Todo es opcional, con un máximo de 1000 caracteres por campo, validado también en el servidor. |
| Sin diagnósticos | Textos de ayuda en cada campo y textos de consentimiento («no son diagnósticos», «no es terapia psicológica ni atención sanitaria»). |
| Separación | Pestañas distintas y tabla aparte. Cada registro cifrado va ligado a su cliente y a su módulo (AAD): copiado a otra ficha o a otro módulo, no se descifra. |
| Consentimiento informado y no marcado | «Pedir consentimiento» muestra el texto para el cliente (`CONSENT_TEXTS`, con versión) y una casilla **sin marcar**. Sin marcarla no se puede registrar, y el servidor exige `informed: true` (`care.consents.grant`). |
| Consentimiento separado | Cada módulo tiene el suyo: el de Primera visita no sirve para Acompañamiento. |
| Comprobación antes de guardar | `requireActiveConsent` en `server/routers/clientCare.ts` responde `PRECONDITION_FAILED` aunque se llame a la API directamente. Sin consentimiento, la interfaz no muestra el formulario. |
| Fecha y versión | `client_consents.grantedAt`, `textVersion` y `method`. |
| Retirada con supresión | `care.consents.withdraw` registra la retirada y **suprime en el acto** los datos de ese módulo, y solo de ese. Si una obligación legal obliga a conservarlos, hay que marcarlo expresamente: entonces quedan pendientes de revisión hasta suprimirlos. |
| Acceso y auditoría | Todas las operaciones exigen sesión de administración y se comprueban en el servidor. Se auditan la lectura, el guardado, la exportación, el consentimiento, la retirada, la revisión y la supresión, sin contenido. Los errores no repiten el texto recibido. |
| Cifrado | AES-256-GCM en la aplicación (`server/sensitive/crypto.ts`). En la base de datos y en sus copias solo hay texto cifrado. Sin clave configurada, el servidor no lee ni guarda (§7). |
| Sin terceros | El módulo no importa correo, WhatsApp ni ningún servicio externo, y los tests lo comprueban. Google (GTM, GA4, Ads) **no se carga ni envía eventos en `/crm` ni en `/admin`**, aunque se hayan aceptado las cookies (`client/src/lib/googleTag.ts`). No hay integración con herramientas de IA. |
| Exportar | De la sección: botón «Exportar esta sección» (`care.rights.exportModule`). De todo el cliente: Resumen → «Datos del cliente» → «Exportar todo» (`care.rights.export`). El JSON se genera en el navegador y no pasa por terceros. |
| Suprimir | De la sección: «Suprimir esta sección» (`care.rights.eraseModule`). De la ficha: Resumen → «Datos del cliente» → «Suprimir ficha», escribiendo el nombre (`care.rights.erase`). Borra sesiones, notas, Primera visita, Acompañamiento y consentimientos, y conserva citas y facturas. |
| Revisión periódica | Cada 12 meses desde el consentimiento o la última revisión (`RETENTION_REVIEW_MONTHS`): aviso en Clientes, con nombre y sección, y en la ficha, con «Sí, se necesitan» o «Suprimir». También avisa de los datos conservados tras una retirada. |

**Probado** con datos ficticios en la base `cristina_test`: tests automáticos (`server/clientCare.test.ts`) y recorrido completo en el navegador, en móvil.

## 4. Cómo usarlo (Cristina)

1. **Primera visita:** abre la pestaña y pulsa «Pedir consentimiento».
   - Enseña o entrega al cliente el texto que aparece (en papel para firmar o por formulario).
   - Solo si lo acepta expresamente, marca la casilla, elige la forma y pulsa «Registrar consentimiento».
   - Guarda la copia firmada o el registro del formulario.
2. **Acompañamiento:** igual, con su propio consentimiento. Si el cliente no lo quiere, no pasa nada: la reserva y las sesiones no dependen de ello.
3. **Qué escribir:** solo lo que el cliente cuenta y sirve para la sesión, con sus palabras. Ni diagnósticos ni etiquetas.
4. **Si el cliente retira el consentimiento:** «Retirar» → «Retirar y suprimir». Marca «Conservarlos…» solo si hay una obligación legal concreta.
5. **Si el cliente pide una copia o el borrado:**
   - «Exportar esta sección» o «Exportar todo»;
   - «Suprimir esta sección» o «Suprimir ficha».
   - Respuesta en un mes como máximo (art. 12.3 RGPD). Apunta la fecha de la petición y la de la respuesta.
6. **Revisión periódica:** cuando aparezca el aviso, decide si los datos siguen siendo necesarios. Si no, suprímelos.

## 5. Datos que ya existían

106 clientes tienen texto en el campo antiguo `clients.notes`, procedente de la importación inicial. No se ha leído ni copiado. Se muestra plegado como «Notas importadas».

**Cristina debe revisarlo.** Si contiene salud o emociones, puede pasarlo a Primera visita o Acompañamiento, **solo con el consentimiento del cliente**, o borrarlo.

## 6. Pendiente

### 6.1 Decisiones que debe confirmar Cristina

- [x] **Textos de consentimiento** `pv-2026-10-v1` y `ae-2026-10-v1`: **aprobados por Cristina** el 25 de octubre de 2026. Se comprobó que los publicados coinciden literalmente con los aprobados. Si se cambia un texto, hay que subir su versión.
- [ ] **Email de contacto:** confirmar que `info@cristinaviveconsciente.es` funciona y unificarlo en la web, que usa también `hola@…es` y `hola@…com`.
- [ ] **Plazo de revisión:** 12 meses por defecto. Se cambia en `RETENTION_REVIEW_MONTHS`.
- [ ] **Campos:** confirmar que todos son necesarios para la finalidad. Quitar uno es sencillo.
- [ ] **Primera visita y reservas:** decidir si se puede dar una sesión sin consentimiento a Primera visita. Hoy la aplicación no lo impide, y el texto dice que es voluntario.
- [ ] **Forma del consentimiento:** dónde se guardan las copias firmadas en papel y cómo funciona el «formulario electrónico». Hoy no existe un formulario para el cliente en la web: solo se registra en la ficha.

### 6.2 Requisitos jurídicos o contractuales que no se resuelven con configuración técnica

Ninguno impide usar los módulos con las salvaguardas de §3, pero quedan **pendientes**:

1. **Información al cliente (art. 13 RGPD):** publicada en `/privacidad` (`client/src/pages/Privacidad.tsx`) con los datos verificados. Lo que falta (NIF, domicilio, entidades y garantías de los proveedores, plazos) aparece marcado como **pendiente** en la propia página.
2. **Base jurídica:**
   - la aplicación implementa el consentimiento explícito (art. 9.2.a) como control;
   - conviene que un asesor confirme que es la adecuada y que no aplican el art. 9.2.h ni el 9.3.
3. **Registro de actividades (art. 30):** borrador en [privacidad/REGISTRO_ACTIVIDADES.md](privacidad/REGISTRO_ACTIVIDADES.md), pendiente de completar y revisar. Incluye observaciones sobre la web (suscripción sin casilla, emails de seguimiento, «Mi consulta») que requieren decisión de Cristina.
4. **Análisis de riesgos y decisión sobre la EIPD (art. 35):** borrador en [privacidad/ANALISIS_RIESGOS.md](privacidad/ANALISIS_RIESGOS.md). Queda pendiente decidir y documentar si hace falta una EIPD formal.
5. **Railway como encargado del tratamiento (art. 28) y transferencia a EE. UU.** (comprobado: web y MySQL en la región *US West*):
   - aceptar o revisar su contrato de encargado (DPA) y sus subencargados;
   - comprobar su adhesión al Marco de Privacidad de Datos UE-EE. UU. u otras garantías del art. 46.
   - **No verificado.**
6. **Plazos legales de conservación** que pudieran aplicar a este sector, y posible regulación autonómica de las actividades.
7. **Conservación, derechos y brechas:** procedimiento en [privacidad/PROCEDIMIENTOS.md](privacidad/PROCEDIMIENTOS.md), con los plazos y lugares marcados «a decidir».
8. **Delegado de protección de datos:** previsiblemente no es obligatorio. Conviene documentar la decisión.

### 6.3 Mejoras técnicas recomendadas (no bloquean el uso)

1. **Segundo factor de autenticación** en el acceso de administración. Hoy hay contraseña, límite de 5 intentos cada 15 minutos y cookie segura.
2. **Custodia de la clave:** está en las variables de Railway, el mismo proveedor que la base de datos. Protege las copias y exportaciones de la base, pero no frente a un acceso a la cuenta de Railway.
   - Guardar una copia de la clave fuera de Railway: **sin la clave, los datos no se pueden recuperar**.
3. **Rotación de la clave:** se guarda la versión con cada registro, pero rotarla exige un script que vuelva a cifrar los datos. Ese script todavía no existe.
4. **Copias de seguridad** de la base de datos con prueba de restauración. **Cifrado en reposo** de MySQL en Railway: no verificado.

## 7. Configuración

El único requisito de configuración es la clave de cifrado, en el servicio web de Railway:

1. Generarla en un equipo de confianza y guardar una copia fuera de Railway:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Añadir `SENSITIVE_DATA_KEY=<clave>` y `SENSITIVE_KEY_VERSION=k1`, y redesplegar.
   - **No** cambiar después la clave de un entorno con datos.
3. Las variables antiguas `SENSITIVE_FIRST_VISIT_ENABLED`, `SENSITIVE_EMOTIONAL_ENABLED`, `PRIVACY_REVIEW_REF`, `PRIVACY_LEGAL_BASIS` y `PRIVACY_NOTICE_VERSION` **ya no se usan**.

Sin la clave, ambas pestañas muestran «falta la clave de cifrado» y el servidor no lee ni guarda esos datos. El resto de la ficha funciona igual.

## 8. Fuentes consultadas

- **RGPD:** DOUE L 119 de 4.5.2016 (<https://www.boe.es/doue/2016/119/L00001-00088.pdf>)
- **LOPDGDD:** <https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673>
- **CEPD, Directrices 05/2020 sobre el consentimiento:** <https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_es.pdf>
- **AEPD:**
  - listas de EIPD (<https://www.aepd.es/documento/listas-dpia-es-35-4.pdf>, <https://www.aepd.es/documento/listasdpia-35.5l.pdf>);
  - Guía para el sector sanitario (<https://www.aepd.es/guias/guia-profesionales-sector-sanitario.pdf>);
  - nota sobre el Marco de Privacidad UE-EE. UU. (<https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-valora-sentencia-tribunal-general-ue-que-confirma-marco-transferencias-datos-ue-eeuu>).
