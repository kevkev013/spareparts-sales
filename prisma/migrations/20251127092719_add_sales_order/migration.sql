-- CreateTable
CREATE TABLE `sales_orders` (
    `id` VARCHAR(191) NOT NULL,
    `so_number` VARCHAR(30) NOT NULL,
    `so_date` DATETIME(3) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `sq_id` VARCHAR(191) NULL,
    `sq_number` VARCHAR(30) NULL,
    `delivery_address` TEXT NULL,
    `delivery_date` DATETIME(3) NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` ENUM('confirmed', 'processing', 'partial_fulfilled', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'confirmed',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_orders_so_number_key`(`so_number`),
    INDEX `sales_orders_so_number_idx`(`so_number`),
    INDEX `sales_orders_customer_code_idx`(`customer_code`),
    INDEX `sales_orders_so_date_idx`(`so_date`),
    INDEX `sales_orders_status_idx`(`status`),
    INDEX `sales_orders_sq_id_idx`(`sq_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `so_id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `reserved_qty` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `fulfilled_qty` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,

    INDEX `sales_order_items_so_id_idx`(`so_id`),
    INDEX `sales_order_items_item_code_idx`(`item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_customer_code_fkey` FOREIGN KEY (`customer_code`) REFERENCES `customers`(`customer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_sq_id_fkey` FOREIGN KEY (`sq_id`) REFERENCES `sales_quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_so_id_fkey` FOREIGN KEY (`so_id`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_items` ADD CONSTRAINT `sales_order_items_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;
