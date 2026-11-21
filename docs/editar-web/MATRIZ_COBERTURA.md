# Editar web — inventario y matriz de cobertura

Rama `feat/editar-web` (PR en borrador). Referencia de solo lectura: `nayade_experiences_platform@integration/elephant-source`, commit `8c29f8f0ea9ba96bebf78fda896b8d978c24dcb4`. De la referencia se tomó el **modelo** (bloques, diseño de lista cerrada, árbol de secciones, borrador/publicación, biblioteca de imágenes, encuadre y reordenación por arrastre), no el código multiempresa: persistencia, sesión, archivos y catálogo son los de Cristina.

## Cómo funciona

- Cada página, plantilla de ficha y los ajustes globales son un **documento** con **borrador**, **versión publicada** e **historial** (`site_documents`, `site_document_versions`, `site_redirects`). Migración **0028, aditiva** (reversión `drizzle/0028_site_editor.down.sql`; aplicar con `scripts/apply-0028-site-editor.mjs --dry-run` primero).
- `servedFrom = legacy`: la web sirve la página de siempre en código. **Solo «Publicar» cambia a la versión del editor.** «Volver a la original» lo deshace sin perder borrador ni historial.
- Un único renderizador (`PageBlocksView`) pinta el lienzo, la vista previa y la web pública. La vista previa es la web real (`?__preview=1`, solo con sesión de administradora) con clics y envíos bloqueados.
- Los listados y catálogos son bloques **conectados** a sus datos de siempre. Las **fichas** se dividen en **secciones** conectadas a la ficha del elemento: precio, duración y condiciones se leen de su única fuente (Servicios, Agua, Aceites, Blog); los servicios marcados como internos siguen excluidos (la ficha responde «no encontrado» y no aparecen en listados ni sitemap).
- Acciones de botón (`action:…`): abrir la reserva, la reserva de masaje, el asesoramiento de agua, mostrar «Cómo funciona» o abrir las preferencias de cookies. Se eligen con un selector.
- Textos internos: 199 textos editables (reserva, Mi consulta, pedido, guías, Masajes, Sistemas de agua, Aceites, Contacto y comunidad) en «Textos».
- Textos legales: se preparan, previsualizan y publican como el resto. Cada versión publicada lleva su número y fecha, que se muestran en la página y se guardan junto al consentimiento de cookies (`policyVersion`). El comportamiento del consentimiento no cambia. Los datos «Pendiente» van resaltados y el editor avisa antes de publicar.
- Imágenes: biblioteca de archivos ya subidos (los de Galería) además de subir nuevos; encuadre por punto focal (en la cabecera, distinto en móvil); la Galería protege de borrado las imágenes usadas por páginas del editor.
- Bloques: reordenación por **arrastre** (lienzo y «Estructura», también hacia columnas) y botones **subir/bajar** (teclado y pantallas táctiles).

## Matriz por URL / plantilla

| URL / plantilla | Qué se edita desde `/crm/web` | Datos (siguen en su módulo) |
|---|---|---|
| `/` Portada | Textos y botones de la presentación; banda, servicios (tarjetas con etiqueta), Sobre mí, pilares, testimonios, CTA; orden/visibilidad/diseño de todo | Imágenes: **Hero Inicio**; masajes: Servicios; agua: Agua; blog: Blog |
| `/consultas` | Cabecera (título, texto, imagen, encuadre, 2 botones); posición/diseño del listado; textos de reserva | Servicios (precio, duración, condiciones); acceso «Editar servicio» desde la tarjeta |
| `/masajes` | Cabecera con **«Reservar sesión»** (abre la reserva de masaje) y **«Cómo funciona»** (muestra/oculta la explicación), con texto y destino editables; 37 textos internos | Servicios |
| `/sistemas-agua` | Cabecera con «Solicitar asesoramiento» (abre la ventana) y «Ver sistemas»; 69 textos internos (catálogo, confianza, formulario de presupuesto) | Agua → Productos |
| `/aceites-esenciales` | Cabecera con «Reservar consulta…» y «Mi consulta (n)» (solo si hay aceites); bloque de la experta como texto; 27 textos internos (aviso, filtros, tarjeta) | Aceites → Productos |
| `/guias-digitales`, `/recomendados`, `/blog` | Cabecera y posición del listado | Ebooks / Afiliados / Blog |
| `/contacto` | Cabecera; 54 textos del formulario, avisos, información y bloque «comunidad» | Automatizaciones (envío y secuencias) |
| `/privacidad`, `/politica-de-cookies` | Texto completo (preparar, previsualizar, publicar), con datos «Pendiente» marcados y versión trazable | — |
| Fichas de consulta, masaje, agua, aceite y artículo | Orden, visibilidad y diseño de cada sección; bloques antes/después; recorte por sección | Ficha del elemento (Servicios, Agua, Aceites, Blog) |
| Páginas nuevas | Todo; dirección con redirección 301 automática al cambiarla | — |
| Cabecera, pie, WhatsApp, aviso | Ajustes del sitio | — |
| SEO, redirecciones, sitemap | Página y SEO; Redirecciones; sitemap con las páginas publicadas y `noindex` | `redirects.json` (base heredada) |

## Paridad de las 11 páginas y 5 plantillas (original frente a vista previa del borrador)

Comprobada en el navegador a 1280 px y 390 px: texto, enlaces, imágenes, botones y formularios. Resultado: textos 99–100 %, **enlaces, imágenes y botones sin diferencias**, formularios y campos iguales (`/contacto` 1/8, ficha de blog 1/2). Diferencias conocidas: la banda verde de la portada es texto en negrita (antes mayúsculas con puntos) y las etiquetas de las tarjetas y «Testimonios»/«Empieza hoy» se recuperaron como etiquetas y encabezados.

## Lo que sigue exigiendo código (URL, elemento y motivo)

| URL | Elemento | Motivo |
|---|---|---|
| `/contacto` | Opciones del desplegable «Motivo de consulta» (p. ej. «Consulta Express 10€») | Son nombres de producto con precio y el texto es también el valor que se envía; se gestionan con los servicios |
| `/contacto`, pie | Correo `hola@cristinaviveconsciente.es` del cuerpo de contacto e Instagram de la página | Dato, no texto; en el pie sí es editable. Pendiente unificar los tres correos |
| `/masajes` | Nombres de los 8 aceites del bloque «Cómo funciona» | Nombres de producto |
| Fichas (`/consultas/:slug`, `/masajes/:slug`, `/sistemas-agua/:slug`, `/aceites-esenciales/:slug`, `/blog/:slug`) | Títulos internos fijos de cada sección («Qué ofrece», pasos de «Cómo reservar») y preguntas frecuentes | Texto fijo en el componente de la sección (no es dato del elemento); el orden, visibilidad y diseño sí son editables |
| Fichas | Cabecera (galería + título + precio + reserva) y, en agua, «Instalación/mantenimiento/garantía» y «Por qué elegirlo/para quién» | Comparten una cuadrícula y no se pueden partir sin romper el diseño; se mueven como una sola sección |
| `/sistemas-agua` y `/aceites-esenciales` | Resumen de filtros (« · categoría», « · "búsqueda"») | Lo que escribe la persona |
| Todas | Ventana de reserva: campos, ayudas y avisos más allá de 3 textos | Lógica de citas (no se toca) |
| Todas | SEO en el servidor | El título/meta se fijan en el navegador (igual que antes); los rastreadores sin JavaScript ven los de `index.html` |

## Pendientes de Cristina (no son código)

- Completar en `/privacidad` los 8 datos «Pendiente» (NIF, domicilio, garantías de Railway/Brevo/CallMeBot, plazos, base de los emails de seguimiento) con información confirmada; el editor los lista y avisa antes de publicar.
- Decidir las secuencias comerciales de los días 3 y 7 (los formularios del editor **no** inscriben en ellas) y el cambio del pie.

## Cambios visibles del pie (para que Cristina decida)

1. El botón «Reservar consulta» del pie mostraba «Próximamente»; ahora lleva a `/consultas` (editable).
2. Se retira el enlace «Términos» (solo mostraba «Próximamente»).
3. Los iconos de redes sin URL no se muestran hasta que se configuren (antes eran botones que decían «Próximamente»).

## No cambia (reglas y registros actuales)

Citas y calendario, carrito «Mi consulta», cobros/Bizum/Stripe, pedidos, facturación, descargas, afiliados y automatizaciones no pasan por «Editar web». Los formularios del editor crean un contacto en el CRM (si hay correo) y avisan a Cristina.

## Verificación

- `pnpm check`, `pnpm build` y `pnpm test` (317 pruebas con las nuevas de acciones, migración, plantillas y textos legales; y de flujo con MySQL con `SITE_TEST_DATABASE_URL`).
- Navegador (sesión de administradora, BD de desarrollo): edición del hero de `/consultas`, borrador, vista previa móvil, publicar y restaurar; enlace global; página nueva con redirección y sitemap; precio 140 → 147 € reflejado; botones de Masajes; ficha de masaje con secciones reordenadas y ocultas; servicio interno → «no encontrado»; textos legales publicados con sello de versión y `policyVersion` en el consentimiento; arrastre; biblioteca (177 imágenes) y encuadre de móvil; textos internos editados llegando a `/contacto`.
