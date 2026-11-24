-- 0034 · Correo de entrega de la promoción: bandeja de envíos con estado y reintentos, y autorizaciones comerciales
-- Aditiva: tablas nuevas y una columna con valor 0 (apagado) en ebook_promos. No modifica datos existentes.
CREATE TABLE IF NOT EXISTS `ebook_promo_emails` (
  `id` int AUTO_INCREMENT NOT NULL,
  `promoId` int NOT NULL,
  `registrationId` int NOT NULL,
  `clientId` int NULL,
  `dedupeKey` varchar(340) NOT NULL,
  `email` varchar(320) NOT NULL,
  `name` varchar(200) NOT NULL,
  `status` enum('pending','sending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  `attempts` int NOT NULL DEFAULT 0,
  `nextAttemptAt` bigint NULL,
  `lastError` varchar(300) NULL,
  `sentAt` bigint NULL,
  `showServices` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ebook_promo_emails_id` PRIMARY KEY(`id`),
  UNIQUE KEY `ebook_promo_emails_dedupe_uq` (`promoId`, `dedupeKey`),
  KEY `ebook_promo_emails_due_idx` (`status`, `nextAttemptAt`)
);
CREATE TABLE IF NOT EXISTS `commercial_consents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NULL,
  `email` varchar(320) NOT NULL,
  `textVersion` varchar(40) NOT NULL,
  `method` varchar(40) NOT NULL,
  `grantedAt` bigint NOT NULL,
  `withdrawnAt` bigint NULL,
  `unsubscribeToken` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `commercial_consents_id` PRIMARY KEY(`id`),
  UNIQUE KEY `commercial_consents_token_uq` (`unsubscribeToken`),
  KEY `commercial_consents_email_idx` (`email`),
  KEY `commercial_consents_client_idx` (`clientId`)
);
ALTER TABLE `ebook_promos` ADD COLUMN `sendDeliveryEmail` int NOT NULL DEFAULT 0;
