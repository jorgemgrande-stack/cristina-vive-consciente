-- Reversión de 0029 (borra las categorías y el historial importado; las notas importadas conservan su texto)
DROP TABLE IF EXISTS `client_categories`;
DROP TABLE IF EXISTS `client_prior_items`;
ALTER TABLE `client_notes` DROP INDEX `client_notes_source_uq`;
ALTER TABLE `client_notes` DROP COLUMN `sourceKey`;
ALTER TABLE `client_notes` DROP COLUMN `source`;
