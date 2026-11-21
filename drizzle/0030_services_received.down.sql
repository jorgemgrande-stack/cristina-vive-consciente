-- Reversión de 0030 (borra el catálogo y los servicios registrados; las sesiones y pedidos conservan sus datos)
DROP TABLE IF EXISTS `client_services`;
DROP TABLE IF EXISTS `service_catalog`;
ALTER TABLE `orders` DROP COLUMN `clientLinkStatus`;
ALTER TABLE `session_history` DROP INDEX `session_history_appointment_uq`;
ALTER TABLE `session_history` DROP COLUMN `serviceLabel`;
