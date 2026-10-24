-- Reversión de 0025: quita la fecha de la última revisión periódica (no afecta a nada más).
ALTER TABLE `client_consents` DROP COLUMN `reviewedAt`;
