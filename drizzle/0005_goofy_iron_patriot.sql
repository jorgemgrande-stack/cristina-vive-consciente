CREATE TABLE `automation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event` enum('booking_confirmation','booking_admin','ebook_delivery','lead_welcome','lead_sequence_1','lead_sequence_2','lead_sequence_3','whatsapp_booking') NOT NULL,
	`channel` enum('email','whatsapp','sms') NOT NULL DEFAULT 'email',
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(30),
	`clientId` int,
	`status` enum('sent','failed','pending','skipped') NOT NULL DEFAULT 'pending',
	`subject` varchar(300),
	`errorMessage` text,
	`sentAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(200) NOT NULL,
	`sequenceStep` int NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` bigint,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_sequences_id` PRIMARY KEY(`id`)
);
