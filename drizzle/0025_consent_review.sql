-- 0025 · Revisión periódica de los datos de Primera visita y Acompañamiento
-- Solo aditiva: una columna NULL nueva. No modifica datos existentes.
ALTER TABLE `client_consents` ADD COLUMN `reviewedAt` bigint NULL;
