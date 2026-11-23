-- 0033 · Promociones: registro de quien descarga (formulario), medición ampliada y origen «promo» en servicios recibidos
-- Aditiva: tabla nueva, dos columnas opcionales y un valor más en el enum client_services.source. No modifica datos.
CREATE TABLE IF NOT EXISTS `ebook_promo_registrations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `promoId` int NOT NULL,
  `clientId` int NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `source` varchar(30) NOT NULL DEFAULT 'directo',
  `status` enum('linked','created','review') NOT NULL,
  `candidates` varchar(200) NULL,
  `token` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ebook_promo_registrations_id` PRIMARY KEY(`id`),
  UNIQUE KEY `ebook_promo_registrations_token_uq` (`token`),
  KEY `ebook_promo_registrations_promo_idx` (`promoId`, `email`)
);
ALTER TABLE `ebook_promo_events` ADD COLUMN `registrationId` int NULL;
ALTER TABLE `ebook_promo_events` ADD COLUMN `confirmed` int NOT NULL DEFAULT 0;
ALTER TABLE `client_services` MODIFY COLUMN `source` enum('manual','order','promo') NOT NULL DEFAULT 'manual';
