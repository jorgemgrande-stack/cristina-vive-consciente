# Editar web — inventario y matriz de cobertura

Rama `feat/editar-web`. Referencia de solo lectura: `nayade_experiences_platform@integration/elephant-source`, commit `8c29f8f0ea9ba96bebf78fda896b8d978c24dcb4` (coincide con el verificado en el encargo).
De la referencia se tomó el **modelo** (bloques + diseño de lista cerrada + árbol de secciones + borrador/publicación), no el código multiempresa: persistencia, sesión, archivos y catálogo son los de Cristina.

## Cómo funciona

- Cada página/plantilla/ajuste global es un **documento** (`site_documents`) con **borrador** y **versión publicada** (`site_document_versions`). Migración **0028, aditiva** (3 tablas nuevas; reversión `drizzle/0028_site_editor.down.sql`; aplicar con `scripts/apply-0028-site-editor.mjs`).
- `servedFrom = legacy` → la web sigue sirviendo la página de siempre en código. Solo **publicar** cambia a `cms`. «Volver a la original» deshace el cambio sin perder borrador ni historial.
- Un único renderizador (`client/src/components/site/PageBlocksView.tsx`) pinta el lienzo, la vista previa y la web pública.
- Los listados/fichas son bloques **conectados**: embeben la página de siempre sin su cabecera (que pasa a ser un bloque «Cabecera» editable) y siguen leyendo Servicios, Agua, Aceites, Ebooks, Afiliados y Blog. Precio, duración y condiciones **no se copian**.
- Vista previa privada: `<ruta>?__preview=1` con sesión de administradora; envoltorio que bloquea clics y envíos. Los visitantes solo reciben lo publicado (los bloques ocultos ni se envían).
- Migración repetible: `site.migrate` / botón «Preparar borrador» (`server/siteMigration.ts`). Solo crea borradores.

## Matriz por URL / plantilla

| URL / plantilla | Sección visible | Fuente actual | Dónde se edita |
|---|---|---|---|
| `/` Portada | Presentación de imágenes + texto y botones | Imágenes: **Hero Inicio**; textos: bloque conectado `home_slideshow` | Editar web → Portada (textos); imágenes en Hero Inicio |
| | Banda verde, servicios, Sobre mí, pilares, testimonios, CTA final | Código (antes fijo) | Bloques (Texto, Tarjetas, Texto e imagen, Ventajas, Opiniones, CTA) |
| | Masajes destacados, sistemas de agua, últimas entradas | Servicios / Agua / Blog | Bloques conectados (posición y orden editables; datos en su sección) |
| `/consultas` | Cabecera | Código | Bloque Cabecera (título, texto, imagen, botón) |
| | Listado | Servicios | Bloque conectado (posición/diseño); ficha de cada servicio en Servicios |
| `/masajes` | Cabecera (incl. botones «Reservar sesión» / «Cómo funciona») | Código | Bloque Cabecera. **Limitación:** los dos botones de la cabecera original (abrir reserva / desplegar explicación) no existen como bloque; la migración los omite |
| | Listado y explicación técnica | Servicios + código | Bloque conectado. **Texto «Cómo funciona» y textos del listado: en código** |
| `/sistemas-agua` | Cabecera | Código | Bloque Cabecera (botón «Solicitar asesoramiento» pasa a enlace a /contacto; el original abre una ventana) |
| | Catálogo, autoridad, secciones | Agua + código | Bloque conectado; **textos internos del catálogo en código** |
| `/aceites-esenciales` | Cabecera, aviso, filtros, catálogo, bloque final | Aceites + código | Cabecera editable; resto en bloque conectado (**aviso terapéutico y textos del catálogo en código**) |
| `/guias-digitales` | Cabecera + guías | Ebooks | Cabecera editable; guías conectadas |
| `/recomendados` | Cabecera + productos | Afiliados | Cabecera editable; productos conectados |
| `/contacto` | Cabecera + formulario + datos + comunidad | Código + automatizaciones | Cabecera editable; formulario en bloque conectado (**textos del formulario en código**) |
| `/blog` | Cabecera + listado | Blog | Cabecera editable; artículos en Blog |
| `/privacidad`, `/politica-de-cookies` | Texto legal | Código (versiones de consentimiento de `shared/clientCare`, datos «Pendiente») | **Cabecera/bloques alrededor editables; el cuerpo del texto legal sigue en código** (decisión deliberada: no copiar a HTML libre un texto legal enlazado a versiones de consentimiento) |
| `tpl:/consultas/:slug`, `/masajes/:slug`, `/sistemas-agua/:slug`, `/aceites-esenciales/:slug`, `/blog/:slug` | Ficha | Servicios / Agua / Aceites / Blog | Plantilla: bloques antes/después de la ficha. Datos y reserva de la ficha: su sección y su código |
| Páginas nuevas `/<dirección>` | Lo que Cristina cree | Editor | Editar web → Nueva página (borrador → publicar; cambio de dirección con 301 automático) |
| Cabecera global | Logo, menú escritorio/móvil, enlace contacto, botón destacado, aviso | Código | Editar web → Ajustes del sitio |
| Pie global | Texto, columnas, contacto, redes, copyright, enlaces legales | Código | Ajustes del sitio. «Gestionar cookies» siempre visible |
| Botón WhatsApp | Visibilidad, número, saludo | `shared/booking` | Ajustes del sitio (el número solo cambia el globo; avisos a Cristina no cambian) |
| Estados vacíos y textos de reserva/compra | Éxito de cita, botón enviar, Mi consulta vacía, pedido pagado, gracias de guía, 404, aviso de contacto | Código | Editar web → Textos de reserva y compra (15 textos) |
| SEO | Título, descripción, imagen social, noindex | Código / `usePageMeta` | Por página en «Página y SEO» (aplica a páginas publicadas desde el editor) |
| Redirecciones | 221 reglas heredadas + nuevas | `redirects.json` + `site_redirects` | Editar web → Redirecciones (las editables mandan sobre el JSON) |
| Sitemap | Páginas + fichas | `server/sitemap.ts` | Incluye páginas nuevas publicadas; respeta `noindex` |

## Lo que sigue exigiendo código (identificado)

1. `/privacidad` y `/politica-de-cookies`: cuerpo del texto legal.
2. `/masajes`: botones «Reservar sesión» y «Cómo funciona» de la cabecera; bloque «Cómo funciona» y textos del listado.
3. `/sistemas-agua`, `/aceites-esenciales`: textos internos del catálogo, filtros y avisos; ventana de asesoramiento.
4. `/contacto`: textos del formulario y del bloque «comunidad».
5. Fichas `/consultas/:slug`, `/masajes/:slug`, `/sistemas-agua/:slug`, `/aceites-esenciales/:slug`, `/blog/:slug`: estructura interna de la ficha (la plantilla permite añadir bloques antes y después).
6. Textos internos de la ventana de reserva (campos, ayudas, avisos de masaje) más allá de los 3 textos editables.
7. Biblioteca de medios: se usa el subidor existente (`/api/upload`); no hay selector de archivos ya subidos.
8. SEO por página en servidor: el SPA sigue fijando título/meta en el navegador (igual que antes); los rastreadores sin JavaScript ven los de `index.html`.
9. Reordenar bloques: botones subir/bajar (sin arrastrar y soltar).

## No cambia (reglas y registros actuales)

Citas y calendario, carrito «Mi consulta», cobros/Bizum/Stripe, pedidos, facturación, descargas, afiliados y automatizaciones no pasan por «Editar web». Los formularios del editor crean un contacto en el CRM (si hay correo) y avisan a Cristina; **no** inscriben en la secuencia de emails comerciales de los días 3 y 7 (decisión de marketing pendiente de Cristina).

## Cambios visibles respecto a la web anterior

- Pie: el botón «Reservar consulta» enlazaba a un aviso «Próximamente»; ahora lleva a `/consultas` (editable). El enlace «Términos» (aviso «Próximamente») y los iconos sociales vacíos se retiran hasta que haya URL real.
- Cada página pública hace una consulta breve (`site.page`) antes de pintar para decidir entre la versión publicada y la de siempre.

## Verificación

- `pnpm check` (tsc) y `pnpm test`: 308 pruebas, incluidas `server/siteEditor.test.ts` (saneado, árbol, direcciones) y `server/siteEditor.db.test.ts` (borrador → publicar → historial → restaurar, páginas nuevas, redirecciones, plantillas) contra MySQL de pruebas (`SITE_TEST_DATABASE_URL`).
- Navegador (sesión de administradora, BD de desarrollo): hero de `/consultas` editado, guardado en borrador (el visitante seguía viendo lo anterior), vista previa móvil a 390 px, publicado, restaurado; enlace global cambiado y publicado; página nueva creada, publicada, renombrada (301 desde la antigua, sitemap actualizado); cambio de precio en Servicios (140 € → 147 €) reflejado en `/consultas` publicada.
