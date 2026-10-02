# Fichas de masaje: galería, bloque de reserva y dudas frecuentes

Rama: `feat/fichas-masaje-galeria` (sin mergear a `main`). Estado: probado en local con datos reales de las dos fichas;
**nada se ha aplicado ni escrito en producción** (ni migración, ni datos, ni reservas de prueba, ni notificaciones).

## Qué hay
- **Galería** en `/masajes/:slug`: foto principal deslizable (en móvil se desliza con el dedo; en escritorio, flechas),
  miniaturas y vista ampliada (flechas, teclado ← → Esc, deslizar, el fondo no se desplaza, el foco vuelve al cerrar).
  Componente `client/src/components/ServiceGallery.tsx`. Carga prioritaria de la primera foto y precarga de la siguiente.
- **Gestión en el CRM** (Servicios → editar un masaje → «Galería de imágenes», `ServiceGalleryManager.tsx`): subir varias
  imágenes a la vez (mismo endpoint `/api/upload` de siempre), elegir portada, subir/bajar, editar el texto alternativo y quitar.
  - «Quitar» solo saca la imagen de la galería: **el archivo no se borra**. Los archivos de la galería quedan protegidos
    en `/crm/galeria` (no se pueden borrar desde allí mientras estén en uso).
  - La portada es también la imagen de la tarjeta del listado (`services.imageUrl`).
  - No toca imágenes de otros contenidos.
- **Bloque de reserva** claro: precio grande (en consulta y a domicilio), duración, lugar, pago y botón «Reservar ahora».
  En móvil, barra fija inferior con precio y botón. Conserva el flujo: es una solicitud pendiente hasta que Cristina la confirma.
- **Contenido** solo con datos confirmados: «La experiencia» (lo que incluye el servicio, en pasos), «Cómo reservar» (3 pasos
  del flujo real), y preguntas frecuentes construidas con precio, duración, lugar, horario, pago, cancelación y proceso de
  reserva ya existentes. Se han retirado los textos de relleno sin base (frecuencia «mensual», «evita el ejercicio 2 horas
  antes», beneficios genéricos de respaldo, párrafos sobre «sanación» cuando faltaba la descripción).

## Imágenes
- `sala.png` (carpeta de campañas) → `client/public/site/sala-masaje.webp` (151 KB; copia fija dentro del repo).
- **Es una imagen de aspecto generado por IA, no una foto real del local.** Por eso se muestra con el pie «La sala (imagen
  ilustrativa)» y su texto alternativo lo indica. Recomendado sustituirla por una foto real cuando exista (subirla desde el
  CRM y quitar esta).
- No se ha encontrado ninguna imagen de «preparación» en el proyecto ni en la carpeta de Cristina; solo hay una de sala.
- Galería por defecto (sin imágenes propias): imagen actual del masaje + imagen de detalle (si es distinta) + sala. Sin duplicados.

## Migración (pendiente de aplicar)
Tabla nueva `service_images` (`drizzle/0022_service_images.sql`, script idempotente `scripts/apply-service-images.mjs`
con `--dry-run`). Es aditiva y aislada.
- **El código funciona sin la tabla**: la ficha pública muestra la galería por defecto y el CRM avisa de que falta la
  migración. Se puede desplegar antes o después.
- Para gestionar imágenes desde el CRM hay que aplicarla: `node scripts/apply-service-images.mjs` (desde la carpeta con el `.env`).

## Comprobaciones hechas
- `tsc` sin errores; 102 tests pasan (19 nuevos de galería y router). Falla 1 test antiguo de WhatsApp, anterior a estos cambios.
- Prueba visual en Edge (escritorio 1366 px y móvil 390 px) con datos reales de ambas fichas: sin desbordes horizontales,
  un solo `h1`, imágenes cargadas, miniaturas, deslizar, vista ampliada, teclado/Esc, bloqueo de scroll y apertura del
  formulario de reserva desde la barra móvil (sin enviar nada).

## Aviso sobre textos existentes
Algunas fichas contienen en la base de datos frases de tono médico («apoyar el sistema inmunológico», «respuesta
antiinflamatoria», «Reduce el estrés…»). No se han modificado (son contenido de Cristina), pero conviene revisarlas, sobre
todo si se anuncian en Google Ads, cuya política restringe afirmaciones sobre salud.
