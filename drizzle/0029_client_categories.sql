-- 0029 · Categorías de cliente, origen de notas y servicios/compras anteriores
-- Solo aditiva: tablas nuevas y dos columnas opcionales en client_notes. No toca datos existentes.
CREATE TABLE IF NOT EXISTS `client_categories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `category` varchar(40) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `client_categories_id` PRIMARY KEY(`id`),
  UNIQUE KEY `client_categories_uq` (`clientId`, `category`),
  KEY `client_categories_cat_idx` (`category`)
);
CREATE TABLE IF NOT EXISTS `client_prior_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `content` text NOT NULL,
  `source` varchar(120) NOT NULL,
  `sourceKey` varchar(80) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `client_prior_items_id` PRIMARY KEY(`id`),
  UNIQUE KEY `client_prior_items_uq` (`clientId`, `sourceKey`)
);
ALTER TABLE `client_notes` ADD COLUMN `source` varchar(120) NULL;
ALTER TABLE `client_notes` ADD COLUMN `sourceKey` varchar(80) NULL;
ALTER TABLE `client_notes` ADD UNIQUE KEY `client_notes_source_uq` (`clientId`, `sourceKey`);
-- Recursos gratuitos para los clientes que ya existían: lo hace scripts/apply-0029-client-categories.mjs, solo en la primera aplicación.
