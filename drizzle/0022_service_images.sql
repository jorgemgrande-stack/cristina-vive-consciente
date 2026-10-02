-- Galería de imágenes de las fichas de servicio (masajes), gestionable desde el CRM.
-- Se aplica a mano (como el resto de migraciones de este proyecto; no está en el journal de drizzle-kit).
-- Tabla nueva y aislada: no modifica ninguna tabla existente. El código tolera que todavía no exista
-- (la ficha muestra la galería por defecto) y puede desplegarse antes o después.
-- Script idempotente: scripts/apply-service-images.mjs
CREATE TABLE IF NOT EXISTS `service_images` (
  `id` int AUTO_INCREMENT NOT NULL,
  `serviceId` int NOT NULL,
  `url` varchar(500) NOT NULL,
  `alt` varchar(300),
  `sortOrder` int NOT NULL DEFAULT 0,
  `isCover` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `service_images_id` PRIMARY KEY(`id`),
  INDEX `service_images_serviceId_idx` (`serviceId`)
);
