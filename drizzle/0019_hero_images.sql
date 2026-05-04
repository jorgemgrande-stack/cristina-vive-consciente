CREATE TABLE `hero_images` (
  `id` int AUTO_INCREMENT NOT NULL,
  `url` text NOT NULL,
  `key` varchar(500) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `hero_images_id` PRIMARY KEY(`id`)
);
