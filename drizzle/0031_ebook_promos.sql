-- 0031 · Promociones de ebooks (descarga gratuita por tiempo limitado) y su medición agregada
-- Solo aditiva: tablas nuevas. No modifica datos existentes.
CREATE TABLE IF NOT EXISTS `ebook_promos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(120) NOT NULL,
  `name` varchar(200) NOT NULL,
  `ebookId` int NOT NULL,
  `headline` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `bannerText` varchar(200) NOT NULL,
  `published` int NOT NULL DEFAULT 0,
  `startsAt` bigint NULL,
  `endsAt` bigint NOT NULL,
  `donationEnabled` int NOT NULL DEFAULT 1,
  `donationConcept` varchar(60) NOT NULL DEFAULT 'Regalo Tierra',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ebook_promos_id` PRIMARY KEY(`id`),
  UNIQUE KEY `ebook_promos_slug_unique` (`slug`)
);
CREATE TABLE IF NOT EXISTS `ebook_promo_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `promoId` int NOT NULL,
  `kind` enum('view','download','share') NOT NULL,
  `channel` varchar(30) NULL,
  `source` varchar(30) NOT NULL DEFAULT 'directo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ebook_promo_events_id` PRIMARY KEY(`id`),
  KEY `ebook_promo_events_promo_idx` (`promoId`, `kind`)
);
