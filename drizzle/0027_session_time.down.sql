-- Reversión de 0027: quita la hora pactada de las sesiones (las fechas no se tocan).
ALTER TABLE `session_history` DROP COLUMN `sessionTime`;
