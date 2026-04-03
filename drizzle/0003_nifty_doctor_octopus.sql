CREATE TABLE `affiliate_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`imageUrl` text,
	`category` varchar(100) NOT NULL,
	`affiliateUrl` text NOT NULL,
	`provider` varchar(100),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `affiliate_products_id` PRIMARY KEY(`id`)
);
