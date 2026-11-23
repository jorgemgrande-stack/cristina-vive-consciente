-- 0032 · Ficha del ebook: sinopsis, autor y edición (opcionales)
-- Solo aditiva: columnas nuevas nulas. No modifica datos existentes.
ALTER TABLE `ebooks` ADD COLUMN `synopsis` text NULL;
ALTER TABLE `ebooks` ADD COLUMN `author` varchar(200) NULL;
ALTER TABLE `ebooks` ADD COLUMN `edition` varchar(100) NULL;
