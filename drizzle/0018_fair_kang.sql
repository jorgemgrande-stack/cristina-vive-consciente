CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`notes` text,
	`eventAt` bigint NOT NULL,
	`durationMinutes` int DEFAULT 60,
	`type` enum('bloqueo','formacion','recordatorio','reunion','personal') NOT NULL DEFAULT 'recordatorio',
	`color` varchar(30),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hero_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` text NOT NULL,
	`key` varchar(500) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hero_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `cancellationReason` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `rescheduleToken` varchar(100);--> statement-breakpoint
ALTER TABLE `appointments` ADD `proposedSlots` text;