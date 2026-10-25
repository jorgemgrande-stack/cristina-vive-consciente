# Análisis de riesgos: Primera visita y Acompañamiento emocional

> **Borrador de trabajo.** No es asesoramiento jurídico, ni una evaluación de impacto (EIPD) formal, ni una
> certificación. Sirve de base para que Cristina, con un profesional si lo estima necesario, decida si hace falta
> una EIPD (art. 35 RGPD) y la documente.
>
> - Fecha: 25 de octubre de 2026.
> - Ámbito: datos de salud y emocionales anotados en el CRM.

## 1. Descripción

| | |
|---|---|
| Datos | Primera visita: motivo, alergias o sensibilidades, circunstancias para la sesión, zonas a evitar, bienestar y observaciones. Acompañamiento: relato del cliente, observaciones de Cristina, objetivos y pendientes. |
| Categoría | Datos relativos a la salud (art. 4.15 y considerando 35 RGPD). Los relatos libres pueden revelar otras categorías especiales (art. 9.1). |
| Interesados | Clientes de Cristina que lo consientan. Escala pequeña: una profesional que trabaja sola. |
| Finalidad | Preparar las sesiones, darles seguimiento y conocer las preferencias que el cliente quiere compartir. |
| Base prevista | Consentimiento explícito por módulo (art. 9.2.a), pendiente de confirmar (ver [REGISTRO_ACTIVIDADES.md](REGISTRO_ACTIVIDADES.md)). |
| Quién accede | Solo Cristina, con su usuario de administración. |
| Dónde | Railway (EE. UU., región *US West*): servidor web y MySQL. El contenido se guarda cifrado en la aplicación. |

## 2. Criterios de la lista de la AEPD (art. 35.4)

- **Categorías especiales de datos:** se cumple.
- **Evaluación de aspectos personales o de la personalidad:** posible en Acompañamiento. Se mitiga porque no hay perfiles, puntuaciones ni decisiones automatizadas.
- **Gran escala, decisiones automatizadas, vigilancia sistemática o tecnologías nuevas:** no se aprecian.

Se cumple al menos un criterio, quizá dos. **Lo que debe decidirse y documentarse:** si basta este análisis de riesgos o hace falta una EIPD formal. **Requiere revisión profesional.**

## 3. Riesgos y medidas

Escala orientativa de probabilidad (P) e impacto (I): baja, media o alta. **Riesgo residual:** el que queda con las medidas actuales.

| # | Riesgo | P | I | Medidas implementadas | Residual | Mejora pendiente |
|---|---|---|---|---|---|---|
| 1 | Acceso indebido a la cuenta de administración (contraseña robada o adivinada) | Media | Alta | Contraseña comparada en tiempo constante. Máximo 5 intentos fallidos cada 15 minutos por IP. Cookie `httpOnly`, `secure` y `lax`. Rol de administración comprobado en el servidor en cada operación. Auditoría de lecturas. | Media | **Segundo factor de autenticación (2FA).** Contraseña larga y única, guardada en un gestor. |
| 2 | Acceso a la base de datos o a sus copias (fuga en el proveedor, copia mal guardada) | Baja | Alta | Cifrado AES-256-GCM en la aplicación: la base de datos y sus copias solo contienen texto cifrado, ligado a cada cliente y módulo. | Baja | Verificar el cifrado en reposo y las copias de seguridad de Railway. |
| 3 | Acceso a la cuenta de Railway, donde están a la vez la base de datos y la clave | Baja | Alta | 2FA en la cuenta de Railway: **por verificar**. | Media | Activar y verificar el 2FA de Railway. Valorar guardar la clave en un gestor de secretos separado. |
| 4 | Pérdida de la clave de cifrado: los datos se vuelven irrecuperables | Baja | Media | Copia local en `C:\Users\Usuario\.secrets\cristina-sensitive\`, con acceso solo para ese usuario. | Media | **Copia fuera de ese equipo** (gestor de contraseñas o soporte guardado). |
| 5 | Datos guardados sin consentimiento, o consentimiento no válido | Media | Alta | El servidor rechaza guardar sin consentimiento vigente del módulo. Texto versionado, casilla sin marcar y un consentimiento por módulo. Acompañamiento no condiciona las reservas. | Baja | Guardar las copias firmadas y documentar dónde. |
| 6 | Recoger más datos de los necesarios, o diagnósticos | Media | Media | Campos opcionales y breves (1000 caracteres). Ayudas «sin diagnósticos». Los textos dicen que Cristina no es profesional sanitaria. | Baja | Revisar periódicamente qué se anota. |
| 7 | Conservación indefinida | Media | Media | Revisión cada 12 meses con aviso. La retirada suprime. Supresión por módulo o de toda la ficha. | Baja | Fijar plazos ([PROCEDIMIENTOS.md](PROCEDIMIENTOS.md) §2). |
| 8 | Envío a terceros: analítica, publicidad, IA, correo o WhatsApp | Baja | Alta | El módulo no llama a servicios externos y los tests lo comprueban. Google no se carga en `/crm` ni en `/admin`. Los avisos de WhatsApp y los correos de citas no llevan estos datos. | Baja | — |
| 9 | Contenido en registros o errores | Baja | Media | La auditoría solo guarda nombres de campos. Los errores no repiten lo recibido. Los tests lo comprueban. | Baja | — |
| 10 | Transferencia internacional (servidores en EE. UU.) | Alta (es un hecho) | Media | Cifrado en la aplicación: la clave también está en Railway, así que no impide el acceso del proveedor. | Media | **Contrato de encargado (DPA) de Railway y garantías** (Marco de Privacidad UE-EE. UU. o cláusulas tipo). Valorar mover los servicios a una región de la UE. |
| 11 | No atender derechos o retiradas a tiempo | Baja | Media | Exportación y supresión desde la ficha. Retirada en un paso. | Baja | Registro de solicitudes ([PROCEDIMIENTOS.md](PROCEDIMIENTOS.md) §3). |
| 12 | Brecha sin detectar o notificada tarde | Baja | Alta | Auditoría de accesos en `crm_audit_log`. | Media | Procedimiento de brechas ([PROCEDIMIENTOS.md](PROCEDIMIENTOS.md) §4) y revisión periódica de la auditoría. |
| 13 | Dispositivo de Cristina perdido o robado con la sesión abierta | Media | Alta | La sesión dura como máximo 30 días. | Media | Bloqueo de pantalla en el móvil y el ordenador. Cerrar sesión en dispositivos compartidos. Valorar una sesión más corta. |

## 4. Conclusión provisional

Con las medidas implementadas, los riesgos técnicos principales quedan en nivel bajo o medio.

Los que siguen en nivel medio dependen sobre todo de:
- el segundo factor de autenticación (riesgos 1, 3 y 13);
- la custodia de la clave (riesgo 4);
- las garantías del proveedor en EE. UU. (riesgo 10).

**Antes de considerar cerrado este análisis:** que lo revisen Cristina y, si procede, un profesional, y que se documente la decisión sobre la EIPD.
