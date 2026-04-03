# Informe de Auditoría — Productos Afiliados
**Fecha:** 3 de abril de 2026  
**Método:** Scraping automatizado de fichas de producto en cristinaviveconsciente.es (Shopify)

---

## Resumen de Resultados

| Categoría | Cantidad |
|---|---|
| **Total productos** | 97 |
| **Con enlace afiliado real** | 81 |
| **Productos propios** (arcillas) | 4 |
| **URLs incorrectas en Shopify** | 8 |
| **Productos eliminados (404)** | 4 |

---

## Distribución por Proveedor

| Proveedor | Productos | Tipo de enlace |
|---|---|---|
| **Amazon** | 61 | amzn.to / amazon.es/dp/... |
| **NaturalByMe** | 9 | naturalbyme.com/products/... |
| **Conasi** | 6 | conasi.eu/... |
| **Naturitas** | 5 | naturitas.es/p/... |

---

## Ejemplos de Productos con Ribbon Aplicado

| ID | Nombre | Proveedor | Ribbon | affiliate_url |
|---|---|---|---|---|
| 5 | Quinton Isotonic Agua de mar | Amazon | 🟡 Amazon | https://amzn.to/492wmSZ |
| 10 | Citrobiotic en Gotas 100ml | Amazon | 🟡 Amazon | https://amzn.to/3CkCucR |
| 32 | Galletas de trigo sarraceno Bio | Naturitas | 🟢 Naturitas | https://www.naturitas.es/p/... |
| 42 | Chocolinis Bio | Conasi | 🟢 Conasi | https://www.awin1.com/... |
| 75 | PACK HIDRATA Y REPARA NATURAL | NaturalByMe | 🔵 NaturalByMe | https://www.naturalbyme.com/... |
| 73 | Desodorante roll-on Árbol del té | Conasi | 🟢 Conasi | https://www.conasi.eu/... |

---

## Productos Sin Enlace Detectado (Requieren Revisión Manual)

Estos productos tienen URLs incorrectas en Shopify (el botón de compra apunta a otro producto):

| ID | Nombre | Motivo |
|---|---|---|
| 6 | Floradix hierro + vitaminas | URL incorrecta en Shopify (apunta a desodorante Matarrania) |
| 7 | Omega 3 Omegran El Granero | URL incorrecta en Shopify (apunta a desodorante Matarrania) |
| 8 | Bisglicinato de Magnesio Solaray | URL incorrecta en Shopify (apunta a desodorante Matarrania) |
| 69 | Urtekram Desodorante Cristal Rosa | URL incorrecta en Shopify (apunta a desodorante Matarrania) |
| 74 | Desodorante en crema - Matarrania | URL incorrecta en Shopify (apunta a sí mismo pero con URL errónea) |
| 77 | Urtekram sin fragancia 500ml | URL incorrecta en Shopify |
| 78 | Champú Urtekram Rosemary 500ml | URL incorrecta en Shopify |
| 79 | Champú Urtekram Árbol de Té 500ml | URL incorrecta en Shopify |

---

## Productos Eliminados de Shopify (404)

| ID | Nombre |
|---|---|
| 26 | Pack 6 Leche de avena ecológica Naturgreen |
| 27 | Pack 6L Bebida vegetal de coco sin azúcar |
| 28 | Pack 6 Bebida de almendra ecologica Ecocesta |
| 60 | Alga Maris 100 ml |

---

## Productos Propios (Sin Enlace Externo)

| ID | Nombre |
|---|---|
| 1 | ARCILLAS PIEL |
| 2 | ARCILLAS DETOX |
| 3 | PACK ARCILLAS DETOX + ARCILLAS PIEL |
| 4 | ARCILLAS NORMAL |

---

## Reglas de Detección de Proveedor

| Patrón URL | Proveedor Asignado |
|---|---|
| amzn.to / amazon.es / amazon.com | Amazon |
| conasi.eu / awin1.com?awinmid=30527 | Conasi |
| naturitas.es / awin1.com?awinmid=74228 | Naturitas |
| naturalbyme.com | NaturalByMe |
| iherb.com | iHerb |
| Sin enlace externo | Propio |

---

## Implementación Técnica

- **Columnas añadidas a BD:** `isAffiliate` (INT, 0/1), `sourceUrl` (TEXT)
- **Ribbon visual:** Aparece en esquina superior derecha de la tarjeta, solo si `isAffiliate = 1`
- **Paleta de colores del ribbon:**
  - Amazon: tono dorado/cálido (oklch 60°)
  - Conasi / Naturitas: tono verde (oklch 148°)
  - NaturalByMe: tono azul suave (oklch 200°)
- **Botón de compra:** `rel="nofollow sponsored external noopener noreferrer"`, `target="_blank"`
- **Texto del botón:** "Ver en [Proveedor]" (dinámico según el proveedor detectado)
