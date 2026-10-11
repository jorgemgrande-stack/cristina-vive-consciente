-- Pedidos de guías digitales pagados por Bizum (confirmación manual por Cristina en el CRM).
-- Se aplica a mano (como el resto de migraciones de este proyecto; no está en el journal de drizzle-kit).
-- Tabla nueva y aislada: no modifica ninguna tabla existente.
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `reference` varchar(20) NOT NULL,
  `productType` varchar(20) NOT NULL DEFAULT 'ebook',
  `productSlug` varchar(100) NOT NULL,
  `productTitle` varchar(200) NOT NULL,
  `amountCents` int NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'EUR',
  `customerName` varchar(200) NOT NULL,
  `customerEmail` varchar(320) NOT NULL,
  `customerPhone` varchar(30),
  `paymentMethod` varchar(20) NOT NULL DEFAULT 'bizum',
  `status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `customerClaimedAt` bigint,
  `paidAt` bigint,
  `paidByUserId` int,
  `cancelledAt` bigint,
  `downloadToken` varchar(100),
  `downloadExpiresAt` bigint,
  `downloadCount` int NOT NULL DEFAULT 0,
  `deliveryEmailSentAt` bigint,
  `includesSession` int NOT NULL DEFAULT 0,
  `clientId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `orders_reference_unique` UNIQUE(`reference`),
  CONSTRAINT `orders_downloadToken_unique` UNIQUE(`downloadToken`),
  INDEX `orders_status_idx` (`status`),
  INDEX `orders_customerEmail_idx` (`customerEmail`)
);
