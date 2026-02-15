-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('retail', 'wholesale', 'bengkel');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('inclusive', 'exclusive');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('buying', 'selling');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('confirmed', 'processing', 'partial_fulfilled', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('picking', 'picked', 'shipped');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('in_transit', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('unpaid', 'partial_paid', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'check', 'giro', 'credit_card', 'other');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "base_unit" VARCHAR(20) NOT NULL,
    "base_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "compatible_motors" JSONB,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversions" (
    "id" SERIAL NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "from_unit" VARCHAR(20) NOT NULL,
    "to_unit" VARCHAR(20) NOT NULL,
    "conversion_factor" DECIMAL(10,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_prices" (
    "id" SERIAL NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "buying_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "min_qty" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_type" "CustomerType" NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(100),
    "npwp" VARCHAR(30),
    "discount_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_term" INTEGER NOT NULL DEFAULT 0,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "location_code" VARCHAR(20) NOT NULL,
    "location_name" VARCHAR(255) NOT NULL,
    "warehouse" VARCHAR(100) NOT NULL,
    "zone" VARCHAR(50),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "batch_number" VARCHAR(30) NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "supplier" VARCHAR(255) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "characteristics" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "location_code" VARCHAR(20) NOT NULL,
    "batch_number" VARCHAR(30) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "available_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotations" (
    "id" TEXT NOT NULL,
    "sq_number" VARCHAR(30) NOT NULL,
    "sq_date" TIMESTAMP(3) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "converted_to_so" BOOLEAN NOT NULL DEFAULT false,
    "so_number" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotation_items" (
    "id" TEXT NOT NULL,
    "sq_id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "sales_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "so_number" VARCHAR(30) NOT NULL,
    "so_date" TIMESTAMP(3) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "sq_id" TEXT,
    "sq_number" VARCHAR(30),
    "delivery_address" TEXT,
    "delivery_date" TIMESTAMP(3),
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" TEXT NOT NULL,
    "so_id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "reserved_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "fulfilled_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit" VARCHAR(20) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" TEXT NOT NULL,
    "do_number" VARCHAR(30) NOT NULL,
    "do_date" TIMESTAMP(3) NOT NULL,
    "so_id" TEXT NOT NULL,
    "so_number" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "picker_name" VARCHAR(100),
    "notes" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'picking',
    "picked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_order_items" (
    "id" TEXT NOT NULL,
    "do_id" TEXT NOT NULL,
    "so_item_id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "ordered_qty" DECIMAL(15,4) NOT NULL,
    "picked_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit" VARCHAR(20) NOT NULL,
    "batch_number" VARCHAR(30) NOT NULL,
    "location_code" VARCHAR(20) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "delivery_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "sj_number" VARCHAR(30) NOT NULL,
    "sj_date" TIMESTAMP(3) NOT NULL,
    "do_id" TEXT NOT NULL,
    "do_number" VARCHAR(30) NOT NULL,
    "so_id" TEXT NOT NULL,
    "so_number" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "driver_name" VARCHAR(100),
    "vehicle_number" VARCHAR(20),
    "delivery_address" TEXT NOT NULL,
    "recipient" VARCHAR(100),
    "notes" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'in_transit',
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "inv_number" VARCHAR(30) NOT NULL,
    "inv_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "so_id" TEXT NOT NULL,
    "so_number" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hpp" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit_margin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'unpaid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "inv_id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hpp" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_master" (
    "id" TEXT NOT NULL,
    "tax_code" VARCHAR(20) NOT NULL,
    "tax_name" VARCHAR(100) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_type" "TaxType" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_history" (
    "id" SERIAL NOT NULL,
    "tax_code" VARCHAR(20) NOT NULL,
    "old_rate" DECIMAL(5,2) NOT NULL,
    "new_rate" DECIMAL(5,2) NOT NULL,
    "changed_by" VARCHAR(100) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "tax_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_movements" (
    "id" SERIAL NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "price_type" "PriceType" NOT NULL,
    "old_price" DECIMAL(15,2) NOT NULL,
    "new_price" DECIMAL(15,2) NOT NULL,
    "change_percentage" DECIMAL(7,2) NOT NULL,
    "reason" TEXT,
    "changed_by" VARCHAR(100) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "payment_number" VARCHAR(30) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "reference_number" VARCHAR(50),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "return_number" VARCHAR(30) NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "so_id" TEXT,
    "so_number" VARCHAR(30),
    "customer_code" VARCHAR(20) NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "item_code" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "condition" VARCHAR(50),
    "notes" TEXT,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_item_code_key" ON "items"("item_code");

-- CreateIndex
CREATE INDEX "items_item_code_idx" ON "items"("item_code");

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");

-- CreateIndex
CREATE INDEX "items_brand_idx" ON "items"("brand");

-- CreateIndex
CREATE INDEX "unit_conversions_item_code_idx" ON "unit_conversions"("item_code");

-- CreateIndex
CREATE INDEX "unit_prices_item_code_idx" ON "unit_prices"("item_code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE INDEX "customers_customer_code_idx" ON "customers"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_location_code_key" ON "locations"("location_code");

-- CreateIndex
CREATE INDEX "locations_location_code_idx" ON "locations"("location_code");

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_number_key" ON "batches"("batch_number");

-- CreateIndex
CREATE INDEX "batches_item_code_idx" ON "batches"("item_code");

-- CreateIndex
CREATE INDEX "batches_batch_number_idx" ON "batches"("batch_number");

-- CreateIndex
CREATE INDEX "stocks_item_code_idx" ON "stocks"("item_code");

-- CreateIndex
CREATE INDEX "stocks_location_code_idx" ON "stocks"("location_code");

-- CreateIndex
CREATE INDEX "stocks_batch_number_idx" ON "stocks"("batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_item_code_location_code_batch_number_key" ON "stocks"("item_code", "location_code", "batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotations_sq_number_key" ON "sales_quotations"("sq_number");

-- CreateIndex
CREATE INDEX "sales_quotations_sq_number_idx" ON "sales_quotations"("sq_number");

-- CreateIndex
CREATE INDEX "sales_quotations_customer_code_idx" ON "sales_quotations"("customer_code");

-- CreateIndex
CREATE INDEX "sales_quotations_sq_date_idx" ON "sales_quotations"("sq_date");

-- CreateIndex
CREATE INDEX "sales_quotations_status_idx" ON "sales_quotations"("status");

-- CreateIndex
CREATE INDEX "sales_quotation_items_sq_id_idx" ON "sales_quotation_items"("sq_id");

-- CreateIndex
CREATE INDEX "sales_quotation_items_item_code_idx" ON "sales_quotation_items"("item_code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_so_number_key" ON "sales_orders"("so_number");

-- CreateIndex
CREATE INDEX "sales_orders_so_number_idx" ON "sales_orders"("so_number");

-- CreateIndex
CREATE INDEX "sales_orders_customer_code_idx" ON "sales_orders"("customer_code");

-- CreateIndex
CREATE INDEX "sales_orders_so_date_idx" ON "sales_orders"("so_date");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_sq_id_idx" ON "sales_orders"("sq_id");

-- CreateIndex
CREATE INDEX "sales_order_items_so_id_idx" ON "sales_order_items"("so_id");

-- CreateIndex
CREATE INDEX "sales_order_items_item_code_idx" ON "sales_order_items"("item_code");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_do_number_key" ON "delivery_orders"("do_number");

-- CreateIndex
CREATE INDEX "delivery_orders_do_number_idx" ON "delivery_orders"("do_number");

-- CreateIndex
CREATE INDEX "delivery_orders_so_id_idx" ON "delivery_orders"("so_id");

-- CreateIndex
CREATE INDEX "delivery_orders_customer_code_idx" ON "delivery_orders"("customer_code");

-- CreateIndex
CREATE INDEX "delivery_orders_do_date_idx" ON "delivery_orders"("do_date");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders"("status");

-- CreateIndex
CREATE INDEX "delivery_order_items_do_id_idx" ON "delivery_order_items"("do_id");

-- CreateIndex
CREATE INDEX "delivery_order_items_so_item_id_idx" ON "delivery_order_items"("so_item_id");

-- CreateIndex
CREATE INDEX "delivery_order_items_item_code_idx" ON "delivery_order_items"("item_code");

-- CreateIndex
CREATE INDEX "delivery_order_items_batch_number_idx" ON "delivery_order_items"("batch_number");

-- CreateIndex
CREATE INDEX "delivery_order_items_location_code_idx" ON "delivery_order_items"("location_code");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_sj_number_key" ON "shipments"("sj_number");

-- CreateIndex
CREATE INDEX "shipments_sj_number_idx" ON "shipments"("sj_number");

-- CreateIndex
CREATE INDEX "shipments_do_id_idx" ON "shipments"("do_id");

-- CreateIndex
CREATE INDEX "shipments_so_id_idx" ON "shipments"("so_id");

-- CreateIndex
CREATE INDEX "shipments_customer_code_idx" ON "shipments"("customer_code");

-- CreateIndex
CREATE INDEX "shipments_sj_date_idx" ON "shipments"("sj_date");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_inv_number_key" ON "invoices"("inv_number");

-- CreateIndex
CREATE INDEX "invoices_inv_number_idx" ON "invoices"("inv_number");

-- CreateIndex
CREATE INDEX "invoices_so_id_idx" ON "invoices"("so_id");

-- CreateIndex
CREATE INDEX "invoices_customer_code_idx" ON "invoices"("customer_code");

-- CreateIndex
CREATE INDEX "invoices_inv_date_idx" ON "invoices"("inv_date");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoice_items_inv_id_idx" ON "invoice_items"("inv_id");

-- CreateIndex
CREATE INDEX "invoice_items_item_code_idx" ON "invoice_items"("item_code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_master_tax_code_key" ON "tax_master"("tax_code");

-- CreateIndex
CREATE INDEX "tax_master_tax_code_idx" ON "tax_master"("tax_code");

-- CreateIndex
CREATE INDEX "tax_history_tax_code_idx" ON "tax_history"("tax_code");

-- CreateIndex
CREATE INDEX "price_movements_item_code_idx" ON "price_movements"("item_code");

-- CreateIndex
CREATE INDEX "price_movements_changed_at_idx" ON "price_movements"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_payment_number_idx" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_customer_code_idx" ON "payments"("customer_code");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "returns_return_number_key" ON "returns"("return_number");

-- CreateIndex
CREATE INDEX "returns_return_number_idx" ON "returns"("return_number");

-- CreateIndex
CREATE INDEX "returns_customer_code_idx" ON "returns"("customer_code");

-- CreateIndex
CREATE INDEX "returns_return_date_idx" ON "returns"("return_date");

-- CreateIndex
CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");

-- CreateIndex
CREATE INDEX "return_items_item_code_idx" ON "return_items"("item_code");

-- AddForeignKey
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_location_code_fkey" FOREIGN KEY ("location_code") REFERENCES "locations"("location_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_batch_number_fkey" FOREIGN KEY ("batch_number") REFERENCES "batches"("batch_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_sq_id_fkey" FOREIGN KEY ("sq_id") REFERENCES "sales_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sq_id_fkey" FOREIGN KEY ("sq_id") REFERENCES "sales_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_do_id_fkey" FOREIGN KEY ("do_id") REFERENCES "delivery_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_so_item_id_fkey" FOREIGN KEY ("so_item_id") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_batch_number_fkey" FOREIGN KEY ("batch_number") REFERENCES "batches"("batch_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_order_items" ADD CONSTRAINT "delivery_order_items_location_code_fkey" FOREIGN KEY ("location_code") REFERENCES "locations"("location_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_do_id_fkey" FOREIGN KEY ("do_id") REFERENCES "delivery_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_inv_id_fkey" FOREIGN KEY ("inv_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_history" ADD CONSTRAINT "tax_history_tax_code_fkey" FOREIGN KEY ("tax_code") REFERENCES "tax_master"("tax_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_movements" ADD CONSTRAINT "price_movements_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_code_fkey" FOREIGN KEY ("customer_code") REFERENCES "customers"("customer_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_item_code_fkey" FOREIGN KEY ("item_code") REFERENCES "items"("item_code") ON DELETE RESTRICT ON UPDATE CASCADE;
