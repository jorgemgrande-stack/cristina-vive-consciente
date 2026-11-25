-- Additive. Existing orders retain NULL in all print-specific fields.
ALTER TABLE `orders`
  ADD COLUMN `shippingAddress` JSON NULL,
  ADD COLUMN `shippingCents` INT NULL,
  ADD COLUMN `shippedAt` BIGINT NULL,
  ADD COLUMN `shippingTracking` VARCHAR(120) NULL,
  ADD COLUMN `pendingPrintKey` VARCHAR(64) NULL,
  ADD UNIQUE KEY `orders_pendingPrintKey_unique` (`pendingPrintKey`);
