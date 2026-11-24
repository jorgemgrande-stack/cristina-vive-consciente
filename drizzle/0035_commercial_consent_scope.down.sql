-- Reversión de 0035 (las autorizaciones dejarían de tener alcance: revisar antes de aplicar).
ALTER TABLE `commercial_consents` DROP COLUMN `scope`;
