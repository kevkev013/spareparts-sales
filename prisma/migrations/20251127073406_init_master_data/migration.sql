-- CreateTable
CREATE TABLE `items` (
    `id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `base_unit` VARCHAR(20) NOT NULL,
    `base_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `min_stock` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `compatible_motors` JSON NULL,
    `is_taxable` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `items_item_code_key`(`item_code`),
    INDEX `items_item_code_idx`(`item_code`),
    INDEX `items_category_idx`(`category`),
    INDEX `items_brand_idx`(`brand`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_conversions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_code` VARCHAR(20) NOT NULL,
    `from_unit` VARCHAR(20) NOT NULL,
    `to_unit` VARCHAR(20) NOT NULL,
    `conversion_factor` DECIMAL(10, 4) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `unit_conversions_item_code_idx`(`item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_code` VARCHAR(20) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `buying_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `min_qty` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `unit_prices_item_code_idx`(`item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_type` ENUM('retail', 'wholesale', 'bengkel') NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `npwp` VARCHAR(30) NULL,
    `discount_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `credit_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `credit_term` INTEGER NOT NULL DEFAULT 0,
    `is_taxable` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_customer_code_key`(`customer_code`),
    INDEX `customers_customer_code_idx`(`customer_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` VARCHAR(191) NOT NULL,
    `location_code` VARCHAR(20) NOT NULL,
    `location_name` VARCHAR(255) NOT NULL,
    `warehouse` VARCHAR(100) NOT NULL,
    `zone` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_location_code_key`(`location_code`),
    INDEX `locations_location_code_idx`(`location_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(30) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `purchase_date` DATETIME(3) NOT NULL,
    `purchase_price` DECIMAL(15, 2) NOT NULL,
    `supplier` VARCHAR(255) NOT NULL,
    `expiry_date` DATETIME(3) NULL,
    `characteristics` JSON NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `batches_batch_number_key`(`batch_number`),
    INDEX `batches_item_code_idx`(`item_code`),
    INDEX `batches_batch_number_idx`(`batch_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocks` (
    `id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `location_code` VARCHAR(20) NOT NULL,
    `batch_number` VARCHAR(30) NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `reserved_qty` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `available_qty` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stocks_item_code_idx`(`item_code`),
    INDEX `stocks_location_code_idx`(`location_code`),
    INDEX `stocks_batch_number_idx`(`batch_number`),
    UNIQUE INDEX `stocks_item_code_location_code_batch_number_key`(`item_code`, `location_code`, `batch_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_master` (
    `id` VARCHAR(191) NOT NULL,
    `tax_code` VARCHAR(20) NOT NULL,
    `tax_name` VARCHAR(100) NOT NULL,
    `tax_rate` DECIMAL(5, 2) NOT NULL,
    `tax_type` ENUM('inclusive', 'exclusive') NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `effective_from` DATETIME(3) NOT NULL,
    `effective_to` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tax_master_tax_code_key`(`tax_code`),
    INDEX `tax_master_tax_code_idx`(`tax_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tax_code` VARCHAR(20) NOT NULL,
    `old_rate` DECIMAL(5, 2) NOT NULL,
    `new_rate` DECIMAL(5, 2) NOT NULL,
    `changed_by` VARCHAR(100) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` TEXT NULL,

    INDEX `tax_history_tax_code_idx`(`tax_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_code` VARCHAR(20) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `price_type` ENUM('buying', 'selling') NOT NULL,
    `old_price` DECIMAL(15, 2) NOT NULL,
    `new_price` DECIMAL(15, 2) NOT NULL,
    `change_percentage` DECIMAL(7, 2) NOT NULL,
    `reason` TEXT NULL,
    `changed_by` VARCHAR(100) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_movements_item_code_idx`(`item_code`),
    INDEX `price_movements_changed_at_idx`(`changed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_conversions` ADD CONSTRAINT `unit_conversions_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_prices` ADD CONSTRAINT `unit_prices_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_location_code_fkey` FOREIGN KEY (`location_code`) REFERENCES `locations`(`location_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_batch_number_fkey` FOREIGN KEY (`batch_number`) REFERENCES `batches`(`batch_number`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tax_history` ADD CONSTRAINT `tax_history_tax_code_fkey` FOREIGN KEY (`tax_code`) REFERENCES `tax_master`(`tax_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_movements` ADD CONSTRAINT `price_movements_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;
