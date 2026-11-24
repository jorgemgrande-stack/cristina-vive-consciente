-- 0035 · Alcance de la autorización comercial (p. ej. «promo-email:12» = el correo de esa campaña)
-- Aditiva: una columna opcional. Las autorizaciones sin alcance (NULL) siguen valiendo en general.
ALTER TABLE `commercial_consents` ADD COLUMN `scope` varchar(80) NULL;
