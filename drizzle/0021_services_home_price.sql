-- Precio del servicio a domicilio, editable desde el CRM (services.homePrice).
-- NULL = no se ofrece a domicilio. Solo se usa en servicios de tipo masaje.
-- Se aplica a mano (como el resto de migraciones de este proyecto; no está en el journal de drizzle-kit),
-- ANTES de desplegar el código que lee la columna. Es aditiva: el código anterior la ignora.
-- Script idempotente: scripts/apply-services-home-price.mjs
ALTER TABLE `services` ADD COLUMN `homePrice` decimal(10,2) NULL;

-- Valores que hasta ahora estaban fijos en el código (shared/booking.ts)
UPDATE `services` SET `homePrice` = 100.00 WHERE `slug` = 'masaje_relajante_navas_de_rio_frio_segovia' AND `homePrice` IS NULL;
UPDATE `services` SET `homePrice` = 110.00 WHERE `slug` = 'masaje_terapeutico_navas_de_rio_frio_segovia' AND `homePrice` IS NULL;
