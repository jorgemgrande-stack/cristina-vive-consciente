-- 0026 · Servicios no publicados en la web
-- Solo aditiva: columna nueva con valor 1 (visible) para todos los servicios existentes. No modifica datos.
ALTER TABLE `services` ADD COLUMN `visibleEnPublico` int NOT NULL DEFAULT 1;
