-- Añadir campos de gestión de citas (cancelación, reprogramación)
ALTER TABLE `appointments`
  ADD COLUMN `cancellationReason` text,
  ADD COLUMN `rescheduleToken` varchar(100),
  ADD COLUMN `proposedSlots` text;

-- Tabla de eventos de calendario (bloqueos, formaciones, recordatorios...)
CREATE TABLE `calendar_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `title` varchar(200) NOT NULL,
  `notes` text,
  `eventAt` bigint NOT NULL,
  `durationMinutes` int DEFAULT 60,
  `type` enum('bloqueo','formacion','recordatorio','reunion','personal') NOT NULL DEFAULT 'recordatorio',
  `color` varchar(30),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` int
);
