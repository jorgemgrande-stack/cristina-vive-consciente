-- Precio del servicio a domicilio, editable desde el CRM (services.homePrice). Es la ÚNICA fuente de ese precio.
-- NULL = tarifa a consultar. Solo se usa en servicios de tipo masaje. La reserva a domicilio se acuerda por
-- WhatsApp: el formulario de la web solo reserva en consulta (shared/booking.ts → HOME_BOOKING_VIA_FORM).
-- Se aplica a mano (como el resto de migraciones de este proyecto; no está en el journal de drizzle-kit).
-- Script idempotente que además corrige los textos del CRM: scripts/apply-services-home-price.mjs
-- Estado 2026-10-24: la columna existe en producción y los dos masajes tienen homePrice NULL.
ALTER TABLE `services` ADD COLUMN `homePrice` decimal(10,2) NULL;

-- Precio confirmado por Cristina el 2026-10-24: 120 € a domicilio en ambos masajes.
-- (Los valores provisionales 100 € / 110 € de la primera versión de este archivo nunca estuvieron vigentes).
UPDATE `services` SET `homePrice` = 120.00 WHERE `slug` = 'masaje_relajante_navas_de_rio_frio_segovia' AND (`homePrice` IS NULL OR `homePrice` IN (100.00, 110.00));
UPDATE `services` SET `homePrice` = 120.00 WHERE `slug` = 'masaje_terapeutico_navas_de_rio_frio_segovia' AND (`homePrice` IS NULL OR `homePrice` IN (100.00, 110.00));
