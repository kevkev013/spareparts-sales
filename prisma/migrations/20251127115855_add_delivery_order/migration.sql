-- CreateTable
CREATE TABLE `delivery_orders` (
    `id` VARCHAR(191) NOT NULL,
    `do_number` VARCHAR(30) NOT NULL,
    `do_date` DATETIME(3) NOT NULL,
    `so_id` VARCHAR(191) NOT NULL,
    `so_number` VARCHAR(30) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `picker_name` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `status` ENUM('picking', 'picked', 'shipped') NOT NULL DEFAULT 'picking',
    `picked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `delivery_orders_do_number_key`(`do_number`),
    INDEX `delivery_orders_do_number_idx`(`do_number`),
    INDEX `delivery_orders_so_id_idx`(`so_id`),
    INDEX `delivery_orders_customer_code_idx`(`customer_code`),
    INDEX `delivery_orders_do_date_idx`(`do_date`),
    INDEX `delivery_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `do_id` VARCHAR(191) NOT NULL,
    `so_item_id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `ordered_qty` DECIMAL(15, 4) NOT NULL,
    `picked_qty` DECIMAL(15, 4) NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NOT NULL,
    `batch_number` VARCHAR(30) NOT NULL,
    `location_code` VARCHAR(20) NOT NULL,
    `notes` TEXT NULL,

    INDEX `delivery_order_items_do_id_idx`(`do_id`),
    INDEX `delivery_order_items_so_item_id_idx`(`so_item_id`),
    INDEX `delivery_order_items_item_code_idx`(`item_code`),
    INDEX `delivery_order_items_batch_number_idx`(`batch_number`),
    INDEX `delivery_order_items_location_code_idx`(`location_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_so_id_fkey` FOREIGN KEY (`so_id`) REFERENCES `sales_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_customer_code_fkey` FOREIGN KEY (`customer_code`) REFERENCES `customers`(`customer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_do_id_fkey` FOREIGN KEY (`do_id`) REFERENCES `delivery_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_so_item_id_fkey` FOREIGN KEY (`so_item_id`) REFERENCES `sales_order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_batch_number_fkey` FOREIGN KEY (`batch_number`) REFERENCES `batches`(`batch_number`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_location_code_fkey` FOREIGN KEY (`location_code`) REFERENCES `locations`(`location_code`) ON DELETE RESTRICT ON UPDATE CASCADE;
