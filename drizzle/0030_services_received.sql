-- 0030 · Servicios recibidos: catálogo editable, registro por clienta, vínculo de pedidos y sesiones desde citas
-- Solo aditiva: tablas nuevas y columnas opcionales. No modifica datos existentes.
CREATE TABLE IF NOT EXISTS `service_catalog` (
  `id` int AUTO_INCREMENT NOT NULL,
  `parentId` int NULL,
  `kind` enum('category','group','item') NOT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `ebookSlug` varchar(100) NULL,
  `priceCents` int NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `archived` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `service_catalog_id` PRIMARY KEY(`id`),
  UNIQUE KEY `service_catalog_slug_unique` (`slug`),
  KEY `service_catalog_parent_idx` (`parentId`)
);
CREATE TABLE IF NOT EXISTS `client_services` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `categoryId` int NULL,
  `groupId` int NULL,
  `itemId` int NULL,
  `pathLabel` varchar(400) NOT NULL,
  `name` varchar(200) NOT NULL,
  `amountCents` int NULL,
  `paymentStatus` enum('free','paid','pending') NOT NULL DEFAULT 'free',
  `receivedAt` bigint NOT NULL,
  `notes` text NULL,
  `source` enum('manual','order') NOT NULL DEFAULT 'manual',
  `orderId` int NULL,
  `sourceKey` varchar(80) NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` int NULL,
  CONSTRAINT `client_services_id` PRIMARY KEY(`id`),
  UNIQUE KEY `client_services_source_uq` (`clientId`, `sourceKey`),
  KEY `client_services_client_idx` (`clientId`)
);
ALTER TABLE `orders` ADD COLUMN `clientLinkStatus` varchar(20) NULL;
ALTER TABLE `session_history` ADD COLUMN `serviceLabel` varchar(200) NULL;
-- Una sola sesión por cita: el índice único session_history_appointment_uq (appointmentId) lo crea el script solo si no hay duplicados.
