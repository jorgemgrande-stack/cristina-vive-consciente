-- Reversión de 0026: quita la marca de visibilidad (todos los servicios activos vuelven a mostrarse en la web).
ALTER TABLE `services` DROP COLUMN `visibleEnPublico`;
