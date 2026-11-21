-- 0028 · Editar web (borradores, versiones publicadas, historial y redirecciones editables)
-- Solo aditiva: tablas nuevas. No toca ninguna tabla existente. Las páginas siguen sirviéndose desde código
-- (servedFrom = 'legacy') hasta que se publique cada una explícitamente.
CREATE TABLE IF NOT EXISTS `site_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `docKey` varchar(191) NOT NULL,
  `kind` enum('page','template','global') NOT NULL,
  `title` varchar(200) NOT NULL,
  `servedFrom` enum('legacy','cms') NOT NULL DEFAULT 'legacy',
  `draftJson` mediumtext NOT NULL,
  `draftUpdatedAt` timestamp NOT NULL DEFAULT (now()),
  `draftUpdatedBy` int,
  `publishedVersionId` int,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `site_documents_id` PRIMARY KEY(`id`),
  CONSTRAINT `site_documents_docKey_unique` UNIQUE(`docKey`),
  KEY `site_documents_kind_idx` (`kind`)
);
CREATE TABLE IF NOT EXISTS `site_document_versions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `documentId` int NOT NULL,
  `contentJson` mediumtext NOT NULL,
  `action` enum('publish','restore','migrate') NOT NULL,
  `note` varchar(200),
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `site_document_versions_id` PRIMARY KEY(`id`),
  KEY `site_document_versions_doc_idx` (`documentId`)
);
CREATE TABLE IF NOT EXISTS `site_redirects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `fromPath` varchar(300) NOT NULL,
  `toPath` varchar(500) NOT NULL,
  `auto` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `site_redirects_id` PRIMARY KEY(`id`),
  CONSTRAINT `site_redirects_fromPath_unique` UNIQUE(`fromPath`)
);
