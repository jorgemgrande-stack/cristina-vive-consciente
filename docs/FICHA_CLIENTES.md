# Ficha integral de clientes

Herramienta sencilla de seguimiento para Cristina. **No** es una historia clínica. Está pensada primero para móvil.
Las reglas de uso de Primera visita y Acompañamiento emocional están en [PRIVACIDAD_FICHAS.md](PRIVACIDAD_FICHAS.md).

## Qué ofrece

**Pestañas de la ficha** (`/crm/clientes/:id`):

| Pestaña | Contenido |
|---|---|
| **Resumen** (por defecto) | «Información para recordar», destacada y con ayuda sobre qué no escribir. Teléfono con llamada y WhatsApp, ocupación y tarifa particular. **Última visita**, calculada con la sesión más reciente. **Próxima cita**, tomada de las reservas (la cita futura pendiente o confirmada más cercana). Servicios recibidos, enlazados a servicios reales. Acceso a la última sesión y al historial. Notas importadas (texto antiguo, plegado y con aviso). Al final, **Datos del cliente** (plegado): exportar todo y suprimir la ficha. |
| **Sesiones** | «Añadir nueva sesión»: fecha automática editable, servicio (por defecto el de la última sesión), duración automática según el servicio, observaciones prácticas, preferencias del cliente y pendiente para la próxima. De más reciente a más antigua. Cada sesión es una entrada nueva; editar una muestra «Editada el…» y lo registra en la auditoría. |
| **Citas** y **Notas** | Igual que antes: aceptar, cancelar o proponer fechas, y notas tipadas. |
| **Primera visita** | Salud y bienestar que el cliente quiera compartir para preparar las sesiones. Explicación breve; «Pedir consentimiento» muestra el texto para el cliente y una casilla sin marcar; con el consentimiento registrado aparece el formulario (6 campos opcionales, breves). Retirar, revisión periódica, exportar y suprimir la sección. Cifrado. |
| **Acompañamiento** | Anotaciones fechadas que separan relato del cliente, observaciones de Cristina y seguimiento. Consentimiento **propio**, independiente del de Primera visita, con las mismas herramientas. Cifrado. |

**Clientes:** si toca revisar los datos de Primera visita o Acompañamiento de alguna ficha (12 meses, o consentimiento retirado con datos conservados), aparece un aviso con el nombre y la sección, sin contenido.

**Otras mejoras:**
- **Buscador:** cada palabra busca en nombre, apellidos, email o teléfono, así que «ana garcía» encuentra a Ana García.
- **Edición:** confirmación antes de descartar cambios sin guardar, y estados vacíos con indicaciones.

## Código

| Pieza | Archivo |
|---|---|
| Reglas puras (cálculos, validación, textos de ayuda) | `shared/clientCare.ts` |
| Acceso a datos | `server/clientCareDb.ts` |
| API (`trpc.care.*`), permisos, consentimiento, exportación y supresión | `server/routers/clientCare.ts` |
| Clave de cifrado (único requisito de configuración) y cifrado | `server/sensitive/config.ts`, `server/sensitive/crypto.ts` |
| Refuerzo del acceso de administración | `server/_core/adminAuth.ts` |
| Interfaz | `client/src/components/crm/ficha/*`, `client/src/pages/crm/ClienteDetalle.tsx` |
| Tests | `server/clientCare.test.ts` (79 tests) |

## Migración 0024 (aditiva)

`drizzle/0024_client_management.sql` añade:
- columnas que admiten vacío en `clients` (`occupation`, `customRate`, `customRateNote`, `rememberInfo`);
- columnas que admiten vacío en `session_history` (`serviceId`, `durationMinutes`, `clientPreferences`, `editedAt`, `editedBy`);
- las tablas `crm_audit_log`, `client_sensitive_records` y `client_consents`.

No borra, renombra ni copia datos. El código anterior ignora lo añadido, así que **se aplica antes de desplegar**.

```bash
# con DATABASE_URL de la base de datos destino
node scripts/apply-0024-client-management.mjs --dry-run   # muestra los cambios pendientes
node scripts/apply-0024-client-management.mjs             # aplica solo lo que falte (idempotente)
```

En producción, desde la carpeta vinculada a Railway:

```powershell
railway run --service MySQL -- powershell -NoProfile -Command '$env:DATABASE_URL = $env:MYSQL_PUBLIC_URL; node scripts/apply-0024-client-management.mjs --dry-run'
```

**Reversión:** `drizzle/0024_client_management.down.sql`. Es **destructiva para lo añadido** (los datos nuevos de la ficha, la auditoría, los datos cifrados y los consentimientos). Antes de usarla: exportar y volver a desplegar el código anterior.

**Probada sobre una base con datos ficticios:** aplica 12 cambios; una segunda ejecución no cambia nada; los datos previos quedan intactos; la reversión deja la estructura exactamente igual que antes; y se puede volver a aplicar.

## Migración 0025 (aditiva)

`drizzle/0025_consent_review.sql` añade `client_consents.reviewedAt` (admite vacío): fecha de la última revisión periódica. No modifica datos.

```bash
node scripts/apply-0025-consent-review.mjs --dry-run
node scripts/apply-0025-consent-review.mjs
```

**Reversión:** `drizzle/0025_consent_review.down.sql` (solo quita esa columna). **Se aplica antes de desplegar.**

## Migración 0027 (aditiva): hora de la sesión

`drizzle/0027_session_time.sql` añade `session_history.sessionTime` (`varchar(5)`, admite vacío): la hora pactada de la sesión en formato «HH:MM», 24 h.
- Las sesiones existentes quedan sin hora y conservan su fecha.
- No es la hora de creación ni la de edición: esas siguen en `createdAt` y `editedAt`.
- El historial ordena por día (hora de Madrid), después por hora (las que no tienen hora van al final del día) y, a igualdad, muestra primero la registrada más tarde.

```bash
node scripts/apply-0027-session-time.mjs --dry-run
node scripts/apply-0027-session-time.mjs
```

**Reversión:** `drizzle/0027_session_time.down.sql`.

**Se aplica antes de desplegar.** El código lee la columna, así que sin ella fallaría la lista de sesiones.

## Pruebas

```bash
pnpm check && pnpm test && pnpm build
```

**Pruebas en navegador:** se hicieron con la build de producción contra la base `cristina_test`, cargada con `scripts/fixtures/clientes-ficticios.sql`, y con pantalla de móvil de 390 px. Cubren:
- búsqueda y apertura de la ficha;
- Resumen y edición;
- registro y edición de sesiones;
- que Citas, Notas y el panel siguen funcionando;
- Primera visita y Acompañamiento, con una clave temporal y en móvil de 390 y 360 px: sin consentimiento no hay formulario y el servidor rechaza guardar (también llamando a la API); casilla sin marcar; registro con fecha y versión; guardado cifrado y lectura; consentimiento separado por módulo; exportación de la sección y de todo el cliente; retirada con supresión solo de ese módulo; revisión periódica; supresión de la ficha conservando citas; auditoría sin contenido.

## Despliegue

1. Generar la clave de cifrado y guardar una copia fuera de Railway (PRIVACIDAD_FICHAS.md §7). Añadir `SENSITIVE_DATA_KEY` y `SENSITIVE_KEY_VERSION=k1` en el servicio web de Railway.
2. Aplicar 0025 en producción (dry-run y después aplicar).
3. Fusionar el PR, que despliega automáticamente en Railway.
4. Verificar en producción que Primera visita muestra «Pedir consentimiento», **sin escribir datos en fichas reales**.

Sin la clave, Primera visita y Acompañamiento muestran «falta la clave de cifrado» y el servidor no lee ni guarda esos datos; el resto de la ficha funciona igual.
