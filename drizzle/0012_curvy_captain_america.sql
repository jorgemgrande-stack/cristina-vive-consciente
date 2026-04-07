CREATE TABLE `oil_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` varchar(500),
	`imageUrl` text,
	`icon` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oil_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `oil_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `oil_consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`email` varchar(200) NOT NULL,
	`telefono` varchar(30),
	`mensaje` text,
	`productsList` text,
	`status` enum('new','contacted','qualified','closed') NOT NULL DEFAULT 'new',
	`internalNotes` text,
	`clientId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oil_consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oil_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'aceites-esenciales',
	`tipoProducto` enum('aceite','mezcla','base','pack','accesorio') NOT NULL DEFAULT 'aceite',
	`descripcion` text,
	`beneficios` text,
	`indicaciones` text,
	`usoGeneral` text,
	`mensajeConsulta` text,
	`imagen` text,
	`tags` text,
	`destacado` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`visibleEnPublico` int NOT NULL DEFAULT 1,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `oil_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `oil_products_slug_unique` UNIQUE(`slug`)
);
