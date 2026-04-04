ALTER TABLE `clients` ADD `postalCode` varchar(20);--> statement-breakpoint
ALTER TABLE `clients` ADD `province` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `country` varchar(100) DEFAULT 'España';--> statement-breakpoint
ALTER TABLE `clients` ADD `nif` varchar(20);--> statement-breakpoint
ALTER TABLE `clients` ADD `razonSocial` varchar(200);