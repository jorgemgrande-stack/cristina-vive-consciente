-- Reversión de 0033 (destructiva para lo añadido: borra los registros de descarga).
-- Antes de volver a enum('manual','order') hay que reasignar o borrar las filas con source = 'promo'.
DELETE FROM `client_services` WHERE `source` = 'promo';
ALTER TABLE `client_services` MODIFY COLUMN `source` enum('manual','order') NOT NULL DEFAULT 'manual';
ALTER TABLE `ebook_promo_events` DROP COLUMN `confirmed`;
ALTER TABLE `ebook_promo_events` DROP COLUMN `registrationId`;
DROP TABLE IF EXISTS `ebook_promo_registrations`;
