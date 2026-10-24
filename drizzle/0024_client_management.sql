-- 0024 · Ficha integral de clientes
-- ADITIVA y compatible: solo añade columnas NULL y tablas nuevas. El código anterior las ignora,
-- así que se aplica ANTES de desplegar el código que las usa. No toca ni copia datos existentes.
-- Se aplica a mano, como el resto de migraciones del proyecto (no está en el journal de drizzle-kit).
-- Reversión: drizzle/0024_client_management.down.sql
-- Script con comprobaciones (idempotente, --dry-run): scripts/apply-0024-client-management.mjs

-- Datos generales y prácticos del cliente (opcionales; nunca salud ni datos emocionales)
ALTER TABLE `clients`
  ADD COLUMN `occupation` varchar(150) NULL,
  ADD COLUMN `customRate` decimal(10,2) NULL,
  ADD COLUMN `customRateNote` varchar(200) NULL,
  ADD COLUMN `rememberInfo` text NULL;

-- Sesiones: servicio real, duración, preferencias y trazabilidad de la última edición
ALTER TABLE `session_history`
  ADD COLUMN `serviceId` int NULL,
  ADD COLUMN `durationMinutes` int NULL,
  ADD COLUMN `clientPreferences` text NULL,
  ADD COLUMN `editedAt` timestamp NULL,
  ADD COLUMN `editedBy` int NULL;

-- Registro de accesos y cambios (sin contenido de notas)
CREATE TABLE IF NOT EXISTS `crm_audit_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `action` varchar(40) NOT NULL,
  `entityType` varchar(40) NOT NULL,
  `entityId` int,
  `clientId` int,
  `fields` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `crm_audit_log_id` PRIMARY KEY(`id`),
  INDEX `crm_audit_log_clientId_idx` (`clientId`)
);

-- Datos de categoría especial, separados y cifrados en la aplicación (la columna solo guarda texto cifrado)
CREATE TABLE IF NOT EXISTS `client_sensitive_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `module` enum('first_visit','emotional') NOT NULL,
  `ciphertext` mediumtext NOT NULL,
  `keyVersion` varchar(20) NOT NULL,
  `recordDate` bigint NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `createdBy` int,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int,
  CONSTRAINT `client_sensitive_records_id` PRIMARY KEY(`id`),
  INDEX `client_sensitive_records_client_module_idx` (`clientId`, `module`)
);

-- Consentimientos explícitos por módulo (fecha, versión del texto, retirada)
CREATE TABLE IF NOT EXISTS `client_consents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `module` enum('first_visit','emotional') NOT NULL,
  `textVersion` varchar(40) NOT NULL,
  `method` varchar(40) NOT NULL,
  `grantedAt` bigint NOT NULL,
  `withdrawnAt` bigint,
  `reviewRequired` boolean NOT NULL DEFAULT false,
  `recordedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `client_consents_id` PRIMARY KEY(`id`),
  INDEX `client_consents_client_module_idx` (`clientId`, `module`)
);
