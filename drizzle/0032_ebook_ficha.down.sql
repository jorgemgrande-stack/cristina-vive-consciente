-- Reversión de 0032 (borra la sinopsis, el autor y la edición guardados).
ALTER TABLE `ebooks` DROP COLUMN `synopsis`;
ALTER TABLE `ebooks` DROP COLUMN `author`;
ALTER TABLE `ebooks` DROP COLUMN `edition`;
