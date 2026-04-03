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
- [ ] Formulario de contacto funcional (envío email)
- [ ] Sistema de reservas online
- [ ] Integración pagos (Stripe)
- [ ] Blog con artículos reales
- [ ] Notificaciones WhatsApp automáticas
- [ ] Exportar facturas a PDF
- [x] Corregir redirect post-login: tras autenticarse desde /crm debe volver a /crm

## Capa pública de solicitud de citas
- [x] Endpoint tRPC público: bookings.request (inserta en appointments con status pending)
- [x] Componente BookingModal: formulario público de solicitud de cita
- [x] Integrar BookingModal en botón "Reservar consulta" del Header
- [x] Integrar BookingModal en botón "Reservar consulta" de la Home
- [x] Integrar BookingModal en botones CTA de la página /consultas
- [x] Notificación al admin cuando llega una nueva solicitud
