-- CreateTable
CREATE TABLE `sales_quotations` (
    `id` VARCHAR(191) NOT NULL,
    `sq_number` VARCHAR(30) NOT NULL,
    `sq_date` DATETIME(3) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `valid_until` DATETIME(3) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted') NOT NULL DEFAULT 'draft',
    `converted_to_so` BOOLEAN NOT NULL DEFAULT false,
    `so_number` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_quotations_sq_number_key`(`sq_number`),
    INDEX `sales_quotations_sq_number_idx`(`sq_number`),
    INDEX `sales_quotations_customer_code_idx`(`customer_code`),
    INDEX `sales_quotations_sq_date_idx`(`sq_date`),
    INDEX `sales_quotations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_quotation_items` (
    `id` VARCHAR(191) NOT NULL,
    `sq_id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,

    INDEX `sales_quotation_items_sq_id_idx`(`sq_id`),
    INDEX `sales_quotation_items_item_code_idx`(`item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales_quotations` ADD CONSTRAINT `sales_quotations_customer_code_fkey` FOREIGN KEY (`customer_code`) REFERENCES `customers`(`customer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_quotation_items` ADD CONSTRAINT `sales_quotation_items_sq_id_fkey` FOREIGN KEY (`sq_id`) REFERENCES `sales_quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_quotation_items` ADD CONSTRAINT `sales_quotation_items_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;
