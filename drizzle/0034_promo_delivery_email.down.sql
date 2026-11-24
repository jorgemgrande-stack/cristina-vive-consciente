-- Reversión de 0034 (destructiva para lo añadido: borra la bandeja de envíos y las autorizaciones comerciales registradas).
ALTER TABLE `ebook_promos` DROP COLUMN `sendDeliveryEmail`;
DROP TABLE IF EXISTS `commercial_consents`;
DROP TABLE IF EXISTS `ebook_promo_emails`;
