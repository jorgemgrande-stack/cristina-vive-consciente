# Ficha integral de clientes

Herramienta sencilla de seguimiento para Cristina. **No** es una historia clínica. Está pensada primero para móvil.
La privacidad de las secciones protegidas se explica en [PRIVACIDAD_FICHAS.md](PRIVACIDAD_FICHAS.md).

## Qué ofrece

**Pestañas de la ficha** (`/crm/clientes/:id`):

| Pestaña | Contenido |
|---|---|
| **Resumen** (por defecto) | «Información para recordar», destacada y con ayuda sobre qué no escribir. Teléfono con llamada y WhatsApp, ocupación y tarifa particular. **Última visita**, calculada con la sesión más reciente. **Próxima cita**, tomada de las reservas (la cita futura pendiente o confirmada más cercana). Servicios recibidos, enlazados a servicios reales. Acceso a la última sesión y al historial. Notas importadas (texto antiguo, plegado y con aviso). |
| **Sesiones** | «Añadir nueva sesión»: fecha automática editable, servicio (por defecto el de la última sesión), duración automática según el servicio, observaciones prácticas, preferencias del cliente y pendiente para la próxima. De más reciente a más antigua. Cada sesión es una entrada nueva; editar una muestra «Editada el…» y lo registra en la auditoría. |
| **Citas** y **Notas** | Igual que antes: aceptar, cancelar o proponer fechas, y notas tipadas. |
| **Primera visita** | Sección protegida: **desactivada**. |
| **Acompañamiento** | Sección protegida: **desactivada**. Además está oculta, y si se habilita solo aparece al pulsar «Mostrar acompañamiento» en ese dispositivo. |

**Otras mejoras:**
- **Buscador:** cada palabra busca en nombre, apellidos, email o teléfono, así que «ana garcía» encuentra a Ana García.
- **Edición:** confirmación antes de descartar cambios sin guardar, y estados vacíos con indicaciones.

## Código

| Pieza | Archivo |
|---|---|
| Reglas puras (cálculos, validación, textos de ayuda) | `shared/clientCare.ts` |
| Acceso a datos | `server/clientCareDb.ts` |
| API (`trpc.care.*`), permisos y bloqueos | `server/routers/clientCare.ts` |
| Activación de los módulos sensibles y cifrado | `server/sensitive/config.ts`, `server/sensitive/crypto.ts` |
| Refuerzo del acceso de administración | `server/_core/adminAuth.ts` |
| Interfaz | `client/src/components/crm/ficha/*`, `client/src/pages/crm/ClienteDetalle.tsx` |
| Tests | `server/clientCare.test.ts` (68 tests) |

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

## Pruebas

```bash
pnpm check && pnpm test && pnpm build
```

**Pruebas en navegador:** se hicieron con la build de producción contra la base `cristina_test`, cargada con `scripts/fixtures/clientes-ficticios.sql`, y con pantalla de móvil de 390 px. Cubren:
- búsqueda y apertura de la ficha;
- Resumen y edición;
- registro y edición de sesiones;
- bloqueo de las secciones protegidas, también llamando a la API directamente;
- que Citas, Notas y el panel siguen funcionando.

Con las secciones protegidas habilitadas, **solo en la base de pruebas y con una clave temporal**, se probaron además el consentimiento, el cifrado, la retirada y la supresión.

## Despliegue

1. Aplicar 0024 en producción (dry-run y después aplicar).
2. Fusionar el PR, que despliega automáticamente en Railway.
3. Verificar la ficha en producción.

Las secciones protegidas quedan **desactivadas** mientras no existan las variables de entorno descritas en PRIVACIDAD_FICHAS.md §8.
