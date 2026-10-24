-- Datos 100 % FICTICIOS para probar la ficha de clientes en una base de PRUEBAS (nunca en producción).
-- Personas, teléfonos y textos inventados. Sin datos de salud ni emocionales.
-- Uso: mysql ... cristina_test < scripts/fixtures/clientes-ficticios.sql

INSERT INTO `services` (`id`, `slug`, `name`, `price`, `homePrice`, `durationMinutes`, `durationLabel`, `type`, `modality`, `status`, `sortOrder`)
VALUES
  (11, 'masaje_relajante_navas_de_rio_frio_segovia', 'Masaje Relajante', 70.00, 120.00, 45, '45 min', 'masaje', 'presencial', 'active', 2),
  (7, 'masaje_terapeutico_navas_de_rio_frio_segovia', 'Masaje Integrativo 60 min', 80.00, 120.00, 60, '1 hora', 'masaje', 'presencial', 'active', 1),
  (20, 'consulta_prueba', 'Consulta de prueba', 50.00, NULL, 60, '1 hora', 'consulta', 'ambos', 'active', 3);

INSERT INTO `clients` (`id`, `firstName`, `lastName`, `email`, `phone`, `status`, `notes`)
VALUES
  (9001, 'Lucía', 'Ficticia Pérez', 'lucia.ficticia@example.test', '+34600000001', 'active', 'Nota antigua importada de prueba'),
  (9002, 'Marcos', 'Inventado Ruiz', 'marcos.inventado@example.test', '+34600000002', 'active', NULL),
  (9003, 'Ana', 'García Ejemplo', NULL, '+34600000003', 'lead', NULL);

-- Citas: una pasada completada y una futura confirmada para Lucía (única fuente de verdad de las citas)
INSERT INTO `appointments` (`id`, `clientId`, `serviceType`, `serviceLabel`, `scheduledAt`, `durationMinutes`, `modality`, `status`, `price`)
VALUES
  (9101, 9001, 'masaje', 'Masaje Relajante — 45 min', UNIX_TIMESTAMP('2026-09-15 10:00:00') * 1000, 45, 'presencial', 'completed', 70.00),
  (9102, 9001, 'masaje', 'Masaje Relajante — 45 min', UNIX_TIMESTAMP('2030-01-15 10:00:00') * 1000, 45, 'presencial', 'confirmed', 70.00);

-- Sesión antigua (formato anterior a 0024) para comprobar que la migración la conserva
INSERT INTO `session_history` (`id`, `clientId`, `appointmentId`, `summary`, `nextSteps`, `sessionDate`)
VALUES (9201, 9001, 9101, 'Prefiere presión suave en espalda (prueba)', 'Probar aroma de lavanda (prueba)', UNIX_TIMESTAMP('2026-09-15 10:00:00') * 1000);

INSERT INTO `client_notes` (`id`, `clientId`, `type`, `content`)
VALUES (9301, 9001, 'general', 'Nota general de prueba');
