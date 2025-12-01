-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(191) NOT NULL,
    `sj_number` VARCHAR(30) NOT NULL,
    `sj_date` DATETIME(3) NOT NULL,
    `do_id` VARCHAR(191) NOT NULL,
    `do_number` VARCHAR(30) NOT NULL,
    `so_id` VARCHAR(191) NOT NULL,
    `so_number` VARCHAR(30) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `driver_name` VARCHAR(100) NULL,
    `vehicle_number` VARCHAR(20) NULL,
    `delivery_address` TEXT NOT NULL,
    `recipient` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `status` ENUM('in_transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'in_transit',
    `delivered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipments_sj_number_key`(`sj_number`),
    INDEX `shipments_sj_number_idx`(`sj_number`),
    INDEX `shipments_do_id_idx`(`do_id`),
    INDEX `shipments_so_id_idx`(`so_id`),
    INDEX `shipments_customer_code_idx`(`customer_code`),
    INDEX `shipments_sj_date_idx`(`sj_date`),
    INDEX `shipments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `inv_number` VARCHAR(30) NOT NULL,
    `inv_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NOT NULL,
    `so_id` VARCHAR(191) NOT NULL,
    `so_number` VARCHAR(30) NOT NULL,
    `customer_code` VARCHAR(20) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `hpp` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `profit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `profit_margin` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `remaining_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` ENUM('unpaid', 'partial_paid', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'unpaid',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_inv_number_key`(`inv_number`),
    INDEX `invoices_inv_number_idx`(`inv_number`),
    INDEX `invoices_so_id_idx`(`so_id`),
    INDEX `invoices_customer_code_idx`(`customer_code`),
    INDEX `invoices_inv_date_idx`(`inv_date`),
    INDEX `invoices_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` VARCHAR(191) NOT NULL,
    `inv_id` VARCHAR(191) NOT NULL,
    `item_code` VARCHAR(20) NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `hpp` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `profit` DECIMAL(15, 2) NOT NULL DEFAULT 0,

    INDEX `invoice_items_inv_id_idx`(`inv_id`),
    INDEX `invoice_items_item_code_idx`(`item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_do_id_fkey` FOREIGN KEY (`do_id`) REFERENCES `delivery_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_so_id_fkey` FOREIGN KEY (`so_id`) REFERENCES `sales_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_customer_code_fkey` FOREIGN KEY (`customer_code`) REFERENCES `customers`(`customer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_so_id_fkey` FOREIGN KEY (`so_id`) REFERENCES `sales_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_customer_code_fkey` FOREIGN KEY (`customer_code`) REFERENCES `customers`(`customer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_inv_id_fkey` FOREIGN KEY (`inv_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `items`(`item_code`) ON DELETE RESTRICT ON UPDATE CASCADE;
