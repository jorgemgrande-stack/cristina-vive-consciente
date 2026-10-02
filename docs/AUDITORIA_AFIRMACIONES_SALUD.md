# Auditoría de afirmaciones de salud

Fecha: 2026-10-02 · Rama: `feat/revision-afirmaciones-salud` · Estado: **código corregido; sustituciones de la base de datos preparadas pero NO aplicadas**.

> Esto es una revisión editorial, **no asesoramiento jurídico**. Las referencias normativas son orientativas; la revisión final debe hacerla un profesional (abogado/a o asesoría sanitaria y de publicidad).

## 1. Por qué importa

BION ofrece naturopatía, masajes y aromaterapia. Un naturópata no es una profesión sanitaria regulada. Atribuir a un servicio o a un producto la capacidad de **diagnosticar, tratar, curar o prevenir enfermedades**, de **«reforzar el sistema inmune»**, de **desintoxicar** o de **aliviar dolor, inflamación, ansiedad o insomnio** puede constituir publicidad sanitaria engañosa o sin autorización, y, según el caso, intrusismo (por ejemplo, **elegir «remedios y dosis»** o indicar **posología**). Marco de referencia (orientativo): Ley General de Publicidad y RD 1907/1996 sobre publicidad y promoción de productos, actividades o servicios con pretendida finalidad sanitaria; Reglamento (CE) 1924/2006 sobre declaraciones nutricionales y de propiedades saludables (alimentos y complementos); Ley 44/2003 de ordenación de las profesiones sanitarias y art. 403 del Código Penal (intrusismo). Además, **Google Ads restringe** las afirmaciones sobre salud, algo especialmente relevante porque las fichas de masaje son las páginas de destino de las campañas.

**Criterio aplicado:** los textos deben describir la **experiencia, la técnica, los aromas, la duración y la logística**, nunca efectos sobre la salud. Cada servicio lleva además un aviso visible: *«no diagnostican, tratan ni curan enfermedades y no sustituyen la consulta ni el tratamiento de un profesional sanitario»*.

## 2. Alcance y cifras

Contenido público analizado (API pública de producción, solo lectura): 9 servicios, 26 aceites y productos, 5 categorías de aceites, 2 sistemas de agua, 2 ebooks, 97 productos afiliados y 20 artículos del blog; además, todo el texto escrito en el código (páginas, emails).

- **37 contenidos** con afirmaciones de salud tienen sustitución preparada (**107 campos**; en **74** de ellos el texto original contenía afirmaciones estrictas).
- **0** afirmaciones estrictas en las redacciones nuevas (lo verifica un test: `server/healthClaims.test.ts`).
- **22 puntos del código** con afirmaciones: **19 corregidos**; los 3 restantes son intencionales y solo del CRM (el texto del propio aviso, que debe nombrar los términos, y un ejemplo de contraindicaciones, donde sí es correcto mencionar embarazo, fiebre o infecciones).
- **13 artículos del blog** contienen afirmaciones; **no se reescriben** (ver §6).

## 3. Qué ya está cambiado (en esta rama, en el código)

| Dónde | Antes | Ahora |
|---|---|---|
| Página `/masajes` | «apoya el sistema inmunológico, para la inflamación, el dolor»; «La sanación energética restaura el flujo de energía primordial»; aceites con «Alivio del dolor» e «Inmunológico»; «grado terapéutico certificado»; beneficios de relleno («mejora la circulación y el drenaje linfático») | Descripción de la experiencia; aceites descritos por su **aroma**; sin beneficios de relleno |
| `/sistemas-agua` | «El agua estructurada puede… eliminar toxinas, **reducir la inflamación, reforzar el sistema inmune**»; «referencia científica: Masaru Emoto» | Lista de lo que ofrecen los sistemas (filtrado, sabor, diseño); se indica que el enfoque **no cuenta con consenso científico** |
| Fichas de aceites | «herramientas terapéuticas potentes»; «evaluación de tu estado de salud… protocolos… tu evolución»; «en qué dosis» | Orientación informativa sobre aromaterapia y precauciones; remite al médico |
| Ficha de consulta | «revisión de tu caso», «traer analíticas o historial» | «revisión de tus hábitos» |
| Home | franja «Comprensión del síntoma» | «Hábitos y estilo de vida» |
| Buscadores y formularios | placeholders «ansiedad, sueño, digestivo», «apoyo inmune, dolor muscular» | placeholders neutros (aroma, rutinas) |
| Ebook de aceites (copia en código) | «uso interno… protocolos» | «aplicación tópica diluida… precauciones» |
| **Aviso legal** | — | Componente `HealthDisclaimer` en el pie de **todas** las páginas y en las fichas de masaje, consulta y aceite |
| **Control en el CRM** | — | Al guardar un servicio con afirmaciones de salud, el CRM **avisa y pide confirmar** |

## 4. Control permanente

- `shared/healthClaims.ts`: detector reutilizable (términos estrictos y «suaves») y el texto del aviso legal.
- `server/healthClaims.test.ts`: falla si alguna redacción preparada conserva una afirmación estricta.
- Quedan fuera del control, a propósito: las **contraindicaciones** (es correcto mencionar embarazo, fiebre…) y el propio aviso legal.

## 5. Base de datos: sustituciones preparadas (NO aplicadas)

107 sustituciones en `scripts/health-claims-rewrite.json`, para aplicar con `scripts/apply-health-claims-rewrite.mjs`:

- **Simulacro por defecto**; solo escribe con `--apply`.
- Solo cambia un campo si su valor actual es **exactamente** el que se auditó (huella SHA-1, comprobada también dentro del UPDATE): no pisa ediciones posteriores. Simulacro ya ejecutado contra producción: **todas las huellas coinciden** (107 aplicables, 0 modificados).
- Guarda antes una **copia** de lo anterior (`health-claims-backup-<fecha>.json`) y permite **deshacer** con `--restore`.
- Opciones (reversibles, no incluidas por defecto): `--deactivate-kinesiologia` y `--blog-draft` (ver §6).

| Contenido | Nombre | Afirmaciones detectadas en el original | Campos reescritos |
|---|---|---|---|
| Servicio #1 | Consulta + Acompañamiento 21 días | tóxicos | description, longDescription, includes |
| Servicio #2 | Consulta Naturópata 90 Min | hormonal, desintoxicación, inmune, posología, fertilidad, tóxicos, metabólicos | shortDescription, description, longDescription, benefits, includes |
| Servicio #3 | Consulta Breve Naturopatía 30 min | tratar, tóxicos, antiinflamatorias, patologias, fertilidad, hormonal, tratamientos | description, longDescription, benefits, contraindications |
| Servicio #4 | Consulta Express Salud | tóxicos, antiinflamatorias, patologias, fertilidad, hormonal, tratamientos, patologías | name, description, longDescription, benefits, contraindications |
| Servicio #5 | Asesoría de Biohabitabilidad | tóxicos | shortDescription, description, longDescription, benefits |
| Servicio #7 | Masaje Terapéutico 60 min | grado terapéutico, sanación, inmunológico, inflamación, dolor, antiinflamatoria | shortDescription, description, longDescription, benefits, includes |
| Servicio #10 | Masaje Terapéutico 90 min | grado terapéutico, sanación, inmunológico, inflamación, dolor | shortDescription, longDescription, benefits, includes |
| Aceite / producto #2 | Pack Recovery Bomb - Bomba Antigripal | antigripal, uso interno, internamente, grado terapéutico, inmune, antivirales, antibacterianas | name, descripcion, beneficios, indicaciones, tags |
| Aceite / producto #4 | Veggie Caps - 160 cápsulas | ingerir, ingesta | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #5 | Aceite Esencial de Lavanda 15ml | internamente, alivia | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #6 | Aceite Esencial Deep Blue 5ml / Roll-on | antiinflamatoria, alivio, alivia, antiinflamatorio, inflamacion | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #7 | Aceite Esencial Deep Blue Roll-On 10ml | antiinflamatoria, alivio, alivia, inflamacion | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #8 | Aceite Esencial Frankincense 15ml | rejuvenece, regeneración, cicatrización, inmune, inmunidad, artritis | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #9 | Aceite Esencial Serenity 15ml | insomnio, ansiedad | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #10 | Aceite Esencial Ylang Ylang 15ml | afrodisíacos, afrodisíacas, afrodisiaco | descripcion, beneficios, tags |
| Aceite / producto #11 | Aceite Esencial OnGuard 15ml | inmunitario, síntomas, defensas, inmune, antivirales, antibacterianas, alivia | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #12 | Aceite Esencial ZenGest 15ml | aliviar, alivia, interno:, grado terapéutico | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #13 | Aceite Esencial Orégano 15ml | infecciones, virales, parasitarias, antibacteriano, antiviral, antiparasitario, inmune | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #14 | Aceite Esencial Balance 15ml | — | beneficios |
| Aceite / producto #15 | Aceite Esencial Tea Tree 15ml | antibiótico, infecciones, herpes, psoriasis, hongos, acné, ingerir | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #16 | Aceite Esencial Peppermint 15ml | dolores, alivia, dolor, interno:, grado terapéutico | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #17 | Aceite Esencial Limón 15ml | resfriados, dolor, detox, depurativas, interno:, grado terapéutico, resfriado | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #18 | Aceite Esencial Air 15ml | descongestivo, respiratorias, respiratorio | descripcion, beneficios, indicaciones, tags |
| Aceite / producto #19 | Aceite de Coco Fraccionado | — | descripcion, beneficios |
| Aceite / producto #26 | Asesoría Aceites Esenciales para Perros | dosis | indicaciones |
| Categoría de aceites #2 | Mezclas terapéuticas | dolor, inmunidad | name, description |
| Categoría de aceites #4 | Packs y guías | — | description |
| Sistema de agua #4 | Jala 2.0 | virus | benefits |
| Ebook #1 | Guía Digital del Agua | — | description |
| Ebook #2 | Guía de Aceites Esenciales | uso interno | description |
| Producto afiliado #5 | Glicina en polvo + minerales Zeutics | dosis, metabólico | description |
| Producto afiliado #12 | ARCILLAS DETOX | detox | name |
| Producto afiliado #24 | PACK ARCILLAS DETOX + ARCILLAS PIEL | detox | name |
| Producto afiliado #66 | Omega 3 Omegran El Granero Integral – Ácidos Grasos Esenciales para una Salud Óptima | — | name |
| Producto afiliado #73 | Bisglicinato de Magnesio Solaray Absorción Óptima, soporte Muscular y apoyo al sistema nervioso | — | name |
| Producto afiliado #78 | Carbonato de Magnesio Soria Natural – Vitalidad y Bienestar Digestivo | — | name |
| Producto afiliado #83 | Citrobiotic en Gotas 100ml Extracto de Semilla de Pomelo - Refuerza Tus Defensas de Forma Natural | defensas | name |

Cambios de nombre incluidos: «Consulta Express **Salud**» → «Consulta Express **Bienestar**»; «Pack Recovery Bomb – **Bomba Antigripal**» → «Pack Recovery Bomb»; categoría «Mezclas **terapéuticas**» → «Mezclas de aceites» (el *slug* de la categoría no cambia); cuatro productos afiliados («ARCILLAS **DETOX**», «Refuerza tus **defensas**»…) pierden el reclamo del título. En el Masaje Terapéutico de 90 min se corrige además un dato: el texto decía «duración de 1 hora».

## 6. Lo que NO se ha reescrito y requiere una decisión

1. **Testaje Kinesiológico para Homeopatía (servicio #6).** Su esencia es «determinar los remedios homeopáticos y las dosis» mediante «kinesiología cuántica a distancia»: **no se puede reformular sin cambiar el servicio** y es el punto de mayor riesgo (elección de medicamentos y dosis). **Recomendación: desactivarlo hasta revisión legal** (`--deactivate-kinesiologia`, reversible desde el CRM).
2. **El nombre «Masaje Terapéutico».** «Terapéutico»/«terapia» sugiere acto sanitario (el masaje terapéutico suele asociarse a fisioterapia). No lo he cambiado porque afecta a las URL de las campañas de Google Ads y a la identidad del servicio; **conviene valorarlo con asesoramiento** (alternativa: «Masaje con aceites esenciales (Aromatouch)»).
3. **Aceites con uso interno (doTERRA).** Se han retirado las instrucciones de ingestión y dosis. Los **Veggie Caps** (cápsulas para ingerir aceites) se han dejado como «cápsulas vegetales vacías»; valorar retirar el producto. Revisar la venta/recomendación de aceites esenciales para ingesta.
4. **Blog (13 artículos con afirmaciones).** Son artículos de opinión/divulgación y su reescritura es una decisión editorial de Cristina. Triaje:

| Riesgo | Id | Artículo | Frases con afirmaciones | Términos |
|---|---|---|---|---|
| ALTO | #8 | MEDICINA DEL PASADO Y DEL FUTURO | 10 | curación, síntoma, enfermedad, diagnóstico, tratamiento, curativo, enfermedades |
| ALTO | #10 | EVITAR AGROTÓXICOS EN FRUTAS Y VERDURAS | 8 | ingesta, curan, tóxicos, tóxicas, hormonas, cáncer, prevenir |
| ALTO | #18 | LO QUE TIENES QUE SABER SOBRE EL KETCHUP | 7 | inmune, enfermedades, metabólicas, inflamatorio, diabetes, insomnio, trastornos |
| BAJO | #2 | MADRE TERESA DE CALCUTA ¿ANGEL O DEMONIO? | 5 | dolor, enfermedad, aliviado, fertilidad, tratamiento, curar |
| ALTO | #15 | LA REALIDAD SOBRE LOS PROTECTORES SOLARES | 5 | hormonal, tóxico, tóxicos, hormonas, inmunitario |
| MEDIO | #12 | ECOLÓGICO ¿QUÉ SIGNIFICA? | 3 | hormonas, antibióticos, tóxicos |
| ALTO | #17 | CÚRCUMA ¿ALIMENTO O MEDICINA? | 3 | antiinflamatorias, tratamiento, enfermedades, inflamatorias, depresión, inmune, inflamatorios |
| MEDIO | #1 | LLAMEMOS A LA REFLEXIÓN | 2 | defensas, enfermedad |
| ALTO | #7 | ¿ALIMENTO PARA TU HIJO? | 2 | enfermedad, cáncer |
| ALTO | #11 | TRANSGÉNICO ¿QUÉ SIGNIFICA? | 2 | alergias, depresión, antibióticos, enfermedades, cáncer, fertilidad, dolencias |
| MEDIO | #4 | EL MONSTRUO EN TUS MANOS | 1 | ansiedad, depresión |
| MEDIO | #31 | DESINFORMATIVOS, LUCES, CAMARA Y ACCIÓN | 1 | enfermedades |
| BAJO | #6 | LA SEMANA ¿SANTA? | 1 | dolor |
| MEDIO | #13 | BENEFICIOS DE LOS ALIMENTOS DE TEMPORADA | 1 | resfriados, inmune |
| MEDIO | #14 | TERRORISMO CLIMÁTICO | 1 | síntomas, dolores |
| BAJO | #5 | APOYO Y MAESTRO DE TU HIJO | 0 | — |
| BAJO | #9 | LA IMPORTANCIA DE LA PRESENCIA PARA NUESTROS HIJOS | 0 | — |
| BAJO | #16 | ESTABLECER BASES EN LA NUTRICIÓN INFANTIL | 0 | — |
| BAJO | #19 | LA CARA ¿ESPEJO DEL ALMA? | 0 | — |
| BAJO | #20 | UNA VERDAD INCÓMODA | 0 | — |

   - **ALTO** (7 artículos): atribuyen enfermedades (cáncer, depresión…) o «tratamientos» a alimentos, sustancias o hábitos, o acusan a empresas concretas («interés criminal»: además riesgo de difamación). **Recomendación: pasarlos a borrador hasta revisarlos** (`--blog-draft`, reversible desde el CRM; no se borran ni se editan).
   - **MEDIO**: afirmaciones puntuales («los cítricos ayudan al sistema inmune»); basta reformular esas frases.
   - Los artículos sobre vacunación y salud pública (#1, #31) mezclan opinión y salud: **revisión recomendada**.
5. **Consultas de naturopatía.** Se han reformulado como orientación de **estilo de vida y alimentación**. Siguen ofreciendo «orientación sobre complementos alimenticios»: conviene que Cristina confirme con su asesoría qué puede recomendar. También sigue en el contenido el concepto de «biohabitabilidad / higiene electromagnética» (no es una afirmación de salud, pero tampoco tiene respaldo científico).
6. **Lenguaje «suave» que se mantiene** (revisar si se quiere ser más estricto): «equilibrio energético», «meridianos», «armonización», «reconectar cuerpo, mente y espíritu». No prometen un efecto sobre la salud, pero son conceptos no científicos: el aviso legal los acompaña.
7. **Productos afiliados (97).** Solo se han corregido los títulos con afirmaciones claras (6). Los títulos proceden de las tiendas; conviene revisarlos al incorporar productos nuevos (el control del CRM no cubre este módulo).

## 7. Cómo aplicarlo (cuando lo decidas)

Desde la carpeta del proyecto con el `.env` (cada paso es reversible):

```powershell
# 1) simulacro (no escribe)
node ..\cvc-booking\scripts\apply-health-claims-rewrite.mjs
# 2) aplicar las sustituciones (guarda una copia para poder deshacer)
node ..\cvc-booking\scripts\apply-health-claims-rewrite.mjs --apply
# 3) opcional: desactivar kinesiología y pasar a borrador los 7 artículos de riesgo alto
node ..\cvc-booking\scripts\apply-health-claims-rewrite.mjs --apply --deactivate-kinesiologia --blog-draft
# deshacer las sustituciones
node ..\cvc-booking\scripts\apply-health-claims-rewrite.mjs --restore health-claims-backup-<fecha>.json --apply
```

## 8. Recomendaciones finales

1. **Revisión legal** de los textos finales (especialmente consultas de naturopatía, aceites y la oferta de kinesiología/homeopatía).
2. Decidir sobre «Masaje Terapéutico», kinesiología y los 7 artículos del blog.
3. Que Cristina use el control del CRM y evite términos de salud al redactar fichas nuevas.
4. Los **anuncios de Google Ads** usan texto descriptivo sin afirmaciones de salud (duración, técnica, lugar, precio); mantenerlo así. Sí incluyen la palabra «terapéutico» en el nombre y las palabras clave del masaje (ver §6.2).
