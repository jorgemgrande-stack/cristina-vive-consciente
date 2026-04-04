# Cristina Vive Consciente — TODO

## FASE 1: Base del proyecto
- [x] Inicializar proyecto web
- [x] Sistema de diseño "Luz Botánica" (colores, tipografías, CSS)
- [x] Componente Header con logo BION real
- [x] Componente Footer sin referencias a Shopify
- [x] Componente Layout global
- [x] Componente PageHero reutilizable
- [x] Página / (Home)
- [x] Página /consultas
- [x] Página /masajes
- [x] Página /sistemas-agua
- [x] Página /aceites-esenciales
- [x] Página /guias-digitales
- [x] Página /recomendados
- [x] Página /contacto
- [x] Página /blog
- [x] Página 404 en español

## FASE 2: Contenido real
- [x] Integrar textos reales en /consultas (6 servicios)
- [x] Integrar textos reales en /masajes
- [x] Integrar textos reales en /sistemas-agua
- [x] Integrar textos reales en /aceites-esenciales
- [x] Integrar textos reales en /guias-digitales (2 ebooks)
- [x] Integrar textos reales en /recomendados (8 categorías)
- [x] Integrar textos reales en /contacto con bloque captación

## FASE 3: CRM
- [x] Upgrade a full-stack (web-db-user)
- [x] Esquema de base de datos: clients, appointments, clientNotes, sessionHistory, invoices
- [x] Migración db:push ejecutada
- [x] Backend tRPC: crm.clients (list, get, create, update, delete)
- [x] Backend tRPC: crm.appointments (list, create, update)
- [x] Backend tRPC: crm.notes (list, create, delete)
- [x] Backend tRPC: crm.sessions (list)
- [x] Backend tRPC: crm.invoices (list, create, update, nextNumber)
- [x] Backend tRPC: crm.dashboard (stats, todayAppointments, upcomingAppointments)
- [x] CRMLayout con sidebar y protección por rol admin
- [x] Dashboard CRM con estadísticas y citas del día
- [x] Módulo Clientes: listado con búsqueda y filtros
- [x] Módulo Clientes: ficha completa con historial, notas y acciones
- [x] Módulo Clientes: formulario nuevo/editar
- [x] Módulo Citas: listado con cambio de estado inline
- [x] Módulo Citas: formulario nueva cita
- [x] Módulo Facturas: listado con cambio de estado inline
- [x] Módulo Facturas: formulario nueva factura con cálculo automático IVA
- [x] Rutas CRM registradas en App.tsx

## Ajustes adicionales
- [x] Enlace sutil "Acceso privado" en footer para acceder al CRM
- [x] Logo correcto de BION en CRMLayout (sidebar y pantalla de login)

## Pendiente (Fases futuras)
- [x] Formulario de contacto funcional (envío email)
- [x] Sistema de reservas online
- [x] Integración pagos (Stripe)
- [ ] Blog con artículos reales
- [ ] Notificaciones WhatsApp automáticas
- [x] Exportar facturas a PDF
- [x] Corregir redirect post-login: tras autenticarse desde /crm debe volver a /crm

## Capa pública de solicitud de citas
- [x] Endpoint tRPC público: bookings.request (inserta en appointments con status pending)
- [x] Componente BookingModal: formulario público de solicitud de cita
- [x] Integrar BookingModal en botón "Reservar consulta" del Header
- [x] Integrar BookingModal en botón "Reservar consulta" de la Home
- [x] Integrar BookingModal en botones CTA de la página /consultas
- [x] Notificación al admin cuando llega una nueva solicitud

## Fase 4: Reservas completas
- [x] Ampliar BookingModal con campo duración y modalidad online/presencial clara
- [x] Email de confirmación al cliente tras solicitud (via nodemailer SMTP)
- [x] Email de notificación al admin con datos completos de la solicitud
- [x] Mensaje WhatsApp automático al cliente (enlace wa.me con texto pre-rellenado)
- [x] Simular flujo completo web → CRM documentado

## Pendiente de configuración (cuando Cristina tenga los datos)
- [x] Configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM para envío de emails reales
- [x] Configurar ADMIN_EMAIL con el email real de Cristina
- [x] Configurar WHATSAPP_ADMIN_NUMBER con el número real de WhatsApp de Cristina

## Fase 6: Ebooks (Stripe listo para activar)
- [x] Tabla ebook_purchases en base de datos
- [x] Catálogo de productos en server/ebooks/products.ts
- [x] Router tRPC: ebooks.list, ebooks.createCheckout, ebooks.download, ebooks.verifyPurchase
- [x] Webhook Stripe en /api/stripe/webhook (registrado antes de express.json)
- [x] Email de entrega con enlace de descarga seguro (sendEbookDeliveryEmail)
- [x] Etiquetado de cliente en CRM tras compra (updateClientTag)
- [x] Botones de compra reales en /guias-digitales (conectados a Stripe)
- [x] Página /ebooks/gracias (verificación de compra + enlace de descarga)
- [x] Página /ebooks/descarga (descarga segura por token, expira 72h)
- [x] Subir PDFs reales al CDN y añadir URLs en server/ebooks/products.ts
- [ ] Crear precios en Stripe Dashboard y añadir stripePriceId en server/ebooks/products.ts
- [x] Configurar SMTP para emails de entrega automática

## Fase 7: Productos Afiliados
- [x] Tabla affiliateProducts en base de datos
- [x] Helpers CRUD en db.ts para productos afiliados
- [x] Router tRPC affiliates: list (público), listAdmin, create, update, delete, toggleStatus, reorder
- [x] Módulo CRM: listado de afiliados agrupado por categoría con reordenación
- [x] Módulo CRM: formulario crear/editar producto afiliado con preview de imagen
- [x] Página /recomendados: listado dinámico desde DB con tarjetas y enlaces externos
- [x] rel="nofollow sponsored noopener noreferrer" en todos los enlaces de afiliado
- [x] Filtro por categoría en /recomendados
- [x] Enlace "Afiliados" añadido al sidebar del CRM
- [x] Rutas CRM registradas en App.tsx

## Fase 7B: Migración productos Shopify → Afiliados
- [x] Extracción de 15 colecciones de Shopify (cristinaviveconsciente.es)
- [x] 97 productos únicos migrados (1 duplicado detectado y omitido)
- [x] Script seed-afiliados.mjs creado y ejecutado correctamente
- [x] Categorías pendientes documentadas (vacías en Shopify): Cereales/Pan/Pasta, Legumbres/Semillas, Iluminación/Biorritmos

## Gestor de Categorías de Afiliados
- [x] Tabla affiliateCategories en DB (id, name, slug, description, sortOrder, status)
- [x] Helpers CRUD en db.ts para categorías de afiliados
- [x] Router tRPC affiliateCategories: list, create, update, delete, reorder, toggle
- [x] Página CRM /crm/categorias: listado con reordenación, editar, activar/desactivar, eliminar
- [x] Actualizar AfiliadoForm para usar selector dinámico de categorías desde DB
- [x] Migrar las 12 categorías existentes a la nueva tabla
- [x] Añadir enlace "Categorías" en el sidebar del CRM

## Mejora UX/UI — Recomendados
- [x] Rediseñar tarjetas de producto: imagen grande, nombre destacado, descripción, etiqueta, botón
- [x] Hover elegante con elevación suave y animación
- [x] Grid 3/2/1 columnas con espaciado generoso
- [x] Headers de categoría con título y descripción opcional
- [x] Botón "Ver producto" verde suave con icono externo
- [x] Mostrar proveedor y texto de confianza en cada tarjeta
- [x] Filtros de categoría mejorados visualmente con contadores
- [x] Mantener rel="nofollow sponsored" en todos los enlaces
- [x] Aviso de transparencia de afiliación visible
- [x] Skeleton de carga animado
- [x] CTA final de contacto

## FASE 8: Automatizaciones de Comunicación
- [x] Configurar credenciales SMTP en secrets (hola@cristinaviveconsciente.es / Dinahosting)
- [x] Email HTML de confirmación de reserva al cliente (plantilla branded)
- [x] Email HTML de notificación de reserva al admin (datos completos)
- [x] Email HTML de entrega de ebook con enlace de descarga seguro
- [x] Email HTML de bienvenida a lead (formulario de contacto)
- [x] Secuencia de emails para leads: email 1 (inmediato), email 2 (día 3), email 3 (día 7)
- [x] Tabla automation_logs en DB para registrar envíos (evento, destinatario, estado, fecha)
- [x] Tabla lead_sequences en DB para gestionar secuencia de emails pendientes
- [x] Job scheduler (setInterval) para procesar secuencias pendientes cada hora
- [x] Panel CRM /crm/automatizaciones: logs de envíos y estado de secuencias
- [x] Infraestructura WhatsApp: helper preparado con plantillas (activable con API futura)
- [x] Formulario de contacto /contacto conectado al flujo de leads (crea cliente + dispara secuencia)

## Revisión Productos Afiliados — Extracción URLs + Ribbon Visual
- [x] Extraer affiliate_url real de cada ficha de producto Shopify (scraping masivo)
- [x] Detectar proveedor (Amazon, Conasi, Naturitas, propio) por URL de salida
- [x] Añadir columnas provider, is_affiliate, source_url al schema DB
- [x] Actualizar BD con datos extraídos (affiliate_url, provider, is_affiliate)
- [x] Añadir ribbon visual del proveedor en tarjetas de /recomendados
- [x] Solo mostrar ribbon si is_affiliate = true
- [x] Colores del ribbon integrados con la paleta (verde, tierra, beige)
- [x] Botón externo con rel="nofollow sponsored external" y target="_blank"
- [x] Generar informe: total, afiliados, propios, sin enlace

## Gestor de Servicios (Consultas y Masajes)
- [x] Tabla `services` en BD con campos: nombre, descripción, precio, duración, tipo, modalidad, imagen, estado, orden
- [x] Migrar servicios existentes de consultas y masajes a la nueva tabla
- [x] Router tRPC `services` con CRUD completo (list, get, create, update, delete, toggleStatus, reorder)
- [x] Procedimiento público `services.listPublic` para frontend (solo activos)
- [x] Módulo CRM `/crm/servicios` con listado, crear, editar, activar/desactivar
- [x] Submenú "Servicios" en el sidebar del CRM con filtro por tipo (Consultas / Masajes)
- [x] Mejorar tarjetas de servicios en /consultas con imagen, precio y botón de reserva
- [x] Mejorar tarjetas de servicios en /masajes con imagen, precio y botón de reserva
- [x] Conectar selector de servicios en reservas con la tabla `services`
- [x] Soporte de subida de imagen en el formulario de servicios del CRM
- [x] Ordenación drag-and-drop o por campo `sortOrder` en CRM

## Gestor de Ebooks + Rediseño /guias-digitales
- [x] Tabla `ebooks` en BD (nombre, descripción, precio, imagen, imágenes adicionales, archivo PDF, estado, orden, stripePriceId)
- [x] Migrar los 2 ebooks existentes (hardcodeados en products.ts) a la tabla BD
- [x] Router tRPC `ebooks` admin: listAdmin, get, create, update, delete, toggleStatus, reorder
- [x] Módulo CRM `/crm/ebooks`: listado con estado, precio, toggle activo/inactivo, reordenar
- [x] Formulario CRM `/crm/ebooks/nuevo` y `/crm/ebooks/:id/editar` con todos los campos
- [x] Añadir enlace "Ebooks" al sidebar del CRM
- [x] Registrar rutas CRM de ebooks en App.tsx
- [x] Rediseño /guias-digitales: carrusel de imágenes (1 imagen grande + 3 miniaturas debajo)
- [x] Cargar ebooks dinámicamente desde BD en /guias-digitales
- [x] Mantener flujo de compra Stripe existente con datos dinámicos

## Importación Clientes Shopify
- [x] Importar clientes del CSV de Shopify a la BD del CRM (limpiar duplicados y spam)

## Exportar Facturas a PDF
- [x] Instalar pdfkit en el servidor
- [x] Crear endpoint GET /api/invoices/:id/pdf con diseño branded
- [x] Añadir botón "Descargar PDF" en la lista de facturas del CRM
- [x] Añadir botón "Descargar PDF" en el formulario/detalle de factura

## Envío de Factura por Email
- [x] Procedimiento tRPC `crm.invoices.sendByEmail`: genera PDF y lo envía como adjunto al email del cliente
- [x] Plantilla HTML de email de factura con diseño branded (consistente con la web)
- [x] Botón "Enviar por email" en la lista de facturas del CRM
- [x] Botón "Enviar por email" en el detalle/edición de factura del CRM
- [x] Feedback visual: toast de éxito/error y estado de envío en la fila

## Datos Fiscales en Facturas
- [ ] Encabezado PDF con datos fiscales de Cristina (nombre, DNI, dirección, CP, ciudad, provincia)
- [ ] Añadir campos fiscales al schema de clientes: nif, razonSocial, address, postalCode, city, province, country
- [ ] Migrar BD con los nuevos campos fiscales del cliente
- [ ] Actualizar formulario CRM de clientes con sección "Datos fiscales"
- [ ] PDF de factura: bloque receptor con datos fiscales del cliente desde BD
- [ ] Actualizar getInvoiceById para incluir todos los campos fiscales del cliente
