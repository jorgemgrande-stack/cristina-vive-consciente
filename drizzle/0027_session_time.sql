-- 0027 · Hora pactada de la sesión (diario de sesiones de la ficha)
-- Solo aditiva: columna opcional nueva. Las sesiones existentes quedan con hora vacía y conservan su fecha.
ALTER TABLE `session_history` ADD COLUMN `sessionTime` varchar(5) NULL;
