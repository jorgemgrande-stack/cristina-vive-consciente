-- Reversión de 0024 · Ficha integral de clientes
-- ATENCIÓN: borra las columnas y tablas añadidas en 0024 Y SU CONTENIDO (ocupación, tarifa particular,
-- «Información para recordar», campos nuevos de sesión, registro de auditoría, datos sensibles cifrados y
-- consentimientos). Antes de ejecutarla: exportar lo que deba conservarse y desplegar el código anterior.
-- No afecta a ninguna columna ni tabla existente antes de 0024.
DROP TABLE IF EXISTS `client_consents`;
DROP TABLE IF EXISTS `client_sensitive_records`;
DROP TABLE IF EXISTS `crm_audit_log`;
ALTER TABLE `session_history`
  DROP COLUMN `editedBy`,
  DROP COLUMN `editedAt`,
  DROP COLUMN `clientPreferences`,
  DROP COLUMN `durationMinutes`,
  DROP COLUMN `serviceId`;
ALTER TABLE `clients`
  DROP COLUMN `rememberInfo`,
  DROP COLUMN `customRateNote`,
  DROP COLUMN `customRate`,
  DROP COLUMN `occupation`;
