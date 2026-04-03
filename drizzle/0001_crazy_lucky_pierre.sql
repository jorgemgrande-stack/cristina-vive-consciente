CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`serviceType` enum('consulta_acompanamiento','consulta_naturopata','consulta_breve','consulta_express','biohabitabilidad','kinesiologia','masaje','otro') NOT NULL,
	`serviceLabel` varchar(200),
	`scheduledAt` bigint NOT NULL,
	`durationMinutes` int DEFAULT 60,
	`modality` enum('presencial','telefono','zoom','whatsapp') DEFAULT 'zoom',
	`status` enum('pending','confirmed','completed','cancelled','rescheduled') NOT NULL DEFAULT 'pending',
	`price` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`internalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`appointmentId` int,
	`type` enum('general','sesion','seguimiento','observacion','alerta') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`status` enum('active','inactive','lead') NOT NULL DEFAULT 'active',
	`birthDate` varchar(20),
	`address` text,
	`city` varchar(100),
	`notes` text,
	`referredBy` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`appointmentId` int,
	`invoiceNumber` varchar(50) NOT NULL,
	`status` enum('draft','sent','paid','cancelled') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`concept` text NOT NULL,
	`notes` text,
	`issuedAt` bigint NOT NULL,
	`dueAt` bigint,
	`paidAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `session_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`appointmentId` int,
	`summary` text,
	`protocols` text,
	`nextSteps` text,
	`recommendedProducts` text,
	`supplements` text,
	`sessionDate` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `session_history_id` PRIMARY KEY(`id`)
);
