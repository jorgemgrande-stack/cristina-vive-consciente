-- Historial/trazabilidad de citas (alta, cambios de estado, notificaciones y su resultado).
-- Se aplica a mano (como el resto de migraciones de este proyecto; no está en el journal de drizzle-kit).
-- Es una tabla nueva y aislada: no modifica ninguna tabla existente.
-- El código tolera que todavía no exista (no se pierde ninguna reserva: solo no hay historial).
CREATE TABLE IF NOT EXISTS `appointment_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `appointmentId` int NOT NULL,
  `type` varchar(40) NOT NULL,
  `fromStatus` varchar(20),
  `toStatus` varchar(20),
  `channel` varchar(20),
  `audience` varchar(20),
  `result` varchar(20),
  `detail` varchar(500),
  `actorUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `appointment_events_id` PRIMARY KEY(`id`),
  INDEX `appointment_events_appointmentId_idx` (`appointmentId`)
);
