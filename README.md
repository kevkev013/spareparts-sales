# Sistem Inventory Sparepart Motor

Aplikasi web fullstack untuk mengelola inventory, penjualan, pembayaran, dan retur untuk usaha sparepart motor.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MySQL 8.x (via MAMP)
- **ORM**: Prisma
- **UI Components**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand / React Query
- **Charts**: Recharts

## Features Implemented

### ✅ Phase 0: Project Setup
- Next.js 14 project with TypeScript
- Tailwind CSS + shadcn/ui components
- Prisma ORM setup with MySQL
- Database schema & migrations
- Seed data for testing

### ✅ Phase 1: Master Data - Items (CRUD Complete)
- **List Page** dengan search, pagination, dan filter
- **Create Form** dengan auto-generate item code (SPR-XXXX)
- **Edit Form** untuk update item data
- **Detail Page** dengan stock summary dan informasi lengkap
- **Unit Conversions** (dynamic array form)
- **Unit Prices** (dynamic array form)
- **API Routes** untuk semua CRUD operations
- **Service Layer** untuk business logic
- **Validations** dengan Zod schemas
- **Price Movement** tracking

### ✅ Phase 1: Master Data - Customers (CRUD Complete)
- **List Page** dengan search, pagination, filter by type/city
- **Create Form** dengan auto-generate customer code (CUS-XXXX)
- **Edit Form** untuk update customer data
- **Detail Page** dengan contact info, credit/discount settings
- **Customer Types**: Retail, Wholesale, Bengkel
- **Credit Management**: Credit limit & credit term
- **Discount Settings**: Default discount rate per customer
- **API Routes** untuk semua CRUD operations
- **Service Layer** untuk business logic
- **Stats Placeholder**: Ready for sales integration

### ✅ Phase 1: Master Data - Locations (CRUD Complete)
- **List Page** dengan search, pagination, display stock info
- **Create Form** dengan kode lokasi format (GD-A1, GD-B2, dll)
- **Edit Form** untuk update location data
- **Detail Page** dengan stock summary & list items
- **Zone Management**: Receiving, Storage, Shipping, Quarantine, Return
- **Stock Tracking**: Total items, quantity, dan nilai per lokasi
- **Warehouse Grouping**: Multiple locations per warehouse
- **API Routes** untuk semua CRUD operations
- **Service Layer** untuk business logic

### ✅ Phase 1: Master Data - Batches (CRUD Complete)
- **List Page** dengan search, pagination, expiry date tracking
- **Create Form** dengan auto-generate batch number (BTH-YYYYMMDD-XXX)
- **Edit Form** untuk update batch data
- **Detail Page** dengan stock summary & item info
- **Auto Batch Number**: Format BTH-20250127-001 berdasarkan purchase date
- **Expiry Tracking**: Alert untuk batch yang sudah kadaluarsa
- **Stock Tracking**: Total qty, reserved, available per lokasi
- **Supplier Management**: Track supplier per batch
- **Purchase Price History**: HPP per batch untuk FIFO calculation
- **API Routes** untuk semua CRUD operations
- **Service Layer** untuk business logic

### ✅ Phase 2: Sales Flow - Sales Quotation (Complete)
- **Auto-generate SQ Number**: Format SQ-YYYYMM-XXXX (e.g., SQ-202501-0001)
- **Full CRUD Operations** dengan dynamic line items form
- **Status Workflow**: draft → sent → accepted/rejected/expired → converted
- **Customer Integration**: Auto-apply customer discount rates
- **Tax Calculation**: Automatic tax calculation based on customer settings
- **Price Calculation**: Subtotal, discount, tax, dan grand total
- **Convert to SO**: Functionality untuk convert quotation ke Sales Order
- **List Page**: Search, filter by status, pagination
- **Detail Page**: Complete quotation info dengan item breakdown

### ✅ Phase 2: Sales Flow - Sales Order (Complete)
- **Auto-generate SO Number**: Format SO-YYYYMM-XXXX (e.g., SO-202501-0001)
- **Stock Reservation**: Automatic stock reservation saat order dibuat
- **FIFO Stock Allocation**: Menggunakan batch dengan purchase date terlama
- **Stock Management**: Reserve qty dari available stock
- **Fulfillment Tracking**: Track fulfilled qty per item
- **Status Workflow**: confirmed → processing → partial_fulfilled → fulfilled → cancelled
- **Link to Quotation**: Otomatis link jika dibuat dari SQ
- **Stock Release**: Auto-release reserved stock saat order cancelled/updated
- **Transaction Safety**: Rollback stock reservation jika order creation gagal

### ✅ Phase 2: Sales Flow - Delivery Order (Complete)
- **Auto-generate DO Number**: Format DO-YYYYMM-XXXX (e.g., DO-202501-0001)
- **Auto-Pick Items**: FIFO picking berdasarkan batch purchase date
- **Batch & Location Tracking**: Track exact batch dan location untuk setiap item
- **Stock Reduction**: Reduce reserved qty dan total qty dari stock
- **SO Fulfillment Update**: Update fulfilled qty di Sales Order items
- **Status Workflow**: picking → picked → shipped
- **Picker Tracking**: Record nama picker untuk audit trail
- **List Page**: View semua delivery orders dengan status

### ✅ Phase 2: Sales Flow - Shipment (Surat Jalan)
- **Auto-generate SJ Number**: Format SJ-YYYYMM-XXXX (e.g., SJ-202501-0001)
- **Link to DO & SO**: Tracking dari Delivery Order dan Sales Order
- **Delivery Tracking**: Driver name, vehicle number, delivery address
- **Recipient Info**: Record penerima barang
- **Status Workflow**: in_transit → delivered → cancelled
- **Delivery Confirmation**: Track delivered datetime

### ✅ Phase 2: Sales Flow - Invoice (Complete)
- **Auto-generate INV Number**: Format INV-YYYYMM-XXXX (e.g., INV-202501-0001)
- **HPP Calculation**: Calculate Cost of Goods Sold dari batch purchase price
- **Profit Tracking**: Auto-calculate profit dan profit margin per invoice
- **FIFO HPP**: HPP dihitung dari actual batch yang dipick di DO
- **Payment Tracking**: Track paid amount dan remaining amount
- **Status Workflow**: unpaid → partial_paid → paid → overdue
- **Credit Term**: Support credit term dari customer settings
- **Due Date Calculation**: Auto-calculate due date based on credit term
- **Tax Integration**: Include tax in grand total calculation
- **List Page**: View dengan HPP, profit, dan margin percentage

## Database Schema

### Master Data Tables
- `items` - Master sparepart dengan multi-unit support
- `unit_conversions` - Konversi satuan (box → pcs, dll)
- `unit_prices` - Harga per satuan berbeda
- `customers` - Master customer dengan credit & discount settings
- `locations` - Master lokasi gudang dengan zone management
- `batches` - Batch tracking per pembelian dengan purchase price
- `stocks` - Stock per lokasi & batch (quantity, reserved, available)
- `tax_master` - Konfigurasi pajak
- `price_movements` - History perubahan harga

### Sales Flow Tables
- `sales_quotations` - Quotation header
- `sales_quotation_items` - Quotation line items
- `sales_orders` - Sales Order header dengan stock reservation
- `sales_order_items` - SO line items dengan fulfillment tracking
- `delivery_orders` - Delivery Order header untuk picking
- `delivery_order_items` - DO line items dengan batch & location
- `shipments` - Surat Jalan untuk delivery tracking
- `invoices` - Invoice dengan HPP dan profit calculation
- `invoice_items` - Invoice line items dengan HPP per item

## Setup Instructions

### 1. Database Setup (MAMP)
```bash
# 1. Start MAMP servers
# 2. Open phpMyAdmin (http://localhost:8888/phpMyAdmin/)
# 3. Create database: sparepart_inventory
# 4. Set collation: utf8mb4_unicode_ci
```

### 2. Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Update .env with your MAMP MySQL credentials
DATABASE_URL="mysql://root:root@localhost:8889/sparepart_inventory"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Migrations
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Seed Database (Optional)
```bash
npx prisma db seed
```

Seed data includes:
- 3 Tax rates (PPN 11%, PPN 12%, Non-taxable)
- 4 Storage locations
- 3 Sample customers
- 3 Sample items (Oli, Kampas Rem, Busi)
- Unit conversions & prices
- Initial stock data

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
spareparts-sales/
├── app/
│   ├── (dashboard)/           # Dashboard layout group
│   │   ├── dashboard/         # Dashboard page
│   │   ├── master/
│   │   │   ├── items/         # Items CRUD pages
│   │   │   ├── customers/     # Coming soon
│   │   │   ├── locations/     # Coming soon
│   │   │   └── batches/       # Coming soon
│   │   └── layout.tsx         # Dashboard layout with sidebar
│   ├── api/
│   │   └── items/             # Items API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── forms/
│       └── item-form.tsx      # Reusable item form
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── utils.ts               # Utility functions
│   └── constants.ts           # App constants
├── services/
│   └── item.service.ts        # Item business logic
├── types/
│   └── item.ts                # TypeScript types
├── validations/
│   └── item.ts                # Zod schemas
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed script
└── README.md
```

## Features Detail

### Master Items

#### List Page (`/master/items`)
- Table dengan pagination (10 items per page)
- Search by kode, nama, atau deskripsi
- Display: kode, nama, kategori, merk, harga, stok, status
- Badge "Low Stock" untuk item di bawah minimum
- Actions: View, Edit, Delete (soft delete)

#### Create Page (`/master/items/create`)
- Auto-generate item code (SPR-0001, SPR-0002, ...)
- Basic info: nama, kategori, merk, satuan, harga
- Unit conversions (dynamic array)
  - Contoh: 1 box = 12 pcs, 1 galon = 4 liter
- Unit prices (dynamic array)
  - Harga berbeda per satuan
  - Harga grosir dengan min qty
- Validasi dengan Zod
- Price movement tracking otomatis

#### Edit Page (`/master/items/:id/edit`)
- Update semua field item
- Update unit conversions
- Update unit prices
- Track price changes ke price_movements table

#### Detail Page (`/master/items/:id`)
- Informasi lengkap item
- Stock summary (total, available, reserved)
- Stock per lokasi
- Unit conversions table
- Unit prices table
- Recent batches

### Dashboard (`/dashboard`)
- Summary cards:
  - Total items
  - Total customers
  - Low stock count
  - Total stock value
- Quick actions
- Low stock alerts

## API Endpoints

### Items
```
GET    /api/items                    # List items (with filters & pagination)
POST   /api/items                    # Create item
GET    /api/items/:id                # Get item detail
PUT    /api/items/:id                # Update item
DELETE /api/items/:id                # Soft delete item
GET    /api/items/generate-code      # Generate next item code
GET    /api/items/categories         # Get all categories
GET    /api/items/brands             # Get all brands
```

### Query Parameters (GET /api/items)
- `search` - Search by code, name, description
- `category` - Filter by category
- `brand` - Filter by brand
- `isActive` - Filter by status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (itemCode, itemName, category, brand, createdAt)
- `sortOrder` - Sort direction (asc, desc)

## Key Features

### Auto-Generate Item Code
- Format: `SPR-XXXX`
- Auto-increment based on last item
- Padded with zeros (SPR-0001, SPR-0002, ...)

### Multi-Unit Support
- Base unit (pcs, liter, dll)
- Unit conversions (box → pcs, galon → liter)
- Different prices per unit
- Wholesale pricing with min qty

### Stock Tracking
- Stock per location & batch
- Reserved stock for orders
- Available stock calculation
- Low stock alerts

### Price Management
- Base price (HPP)
- Selling price
- Price per unit variants
- Price movement history
- Automatic tracking on updates

### Advanced Business Features

#### Stock Management dengan FIFO
- **Automatic Reservation**: Stock otomatis di-reserve saat Sales Order dibuat
- **FIFO Allocation**: Batch dengan purchase date terlama dipilih terlebih dahulu
- **Batch Tracking**: Track exact batch dan lokasi untuk setiap item yang dipick
- **Stock Levels**: quantity (total), reservedQty, availableQty
- **Transaction Safety**: Rollback otomatis jika operasi gagal

#### HPP & Profit Calculation
- **FIFO HPP**: HPP dihitung dari batch yang actual dipick di Delivery Order
- **Per-Item HPP**: Setiap item di invoice punya HPP berdasarkan batch purchase price
- **Profit Tracking**: Otomatis calculate profit = selling price - HPP
- **Profit Margin**: Calculate margin percentage untuk analisa profitabilitas
- **Aggregate HPP**: Total HPP per invoice untuk reporting

#### Sales Flow Integration
- **Quotation to Invoice**: End-to-end flow dari SQ → SO → DO → SJ → INV
- **Document Linking**: Setiap dokumen link ke dokumen sebelumnya
- **Status Tracking**: Real-time status update di setiap tahap
- **Auto-numbering**: Konsisten format nomor dokumen per bulan
- **Fulfillment Tracking**: Track berapa qty yang sudah fulfilled vs ordered

## Implementation Status

### ✅ Phase 1: Master Data (100% Complete)
- [x] Master Items (CRUD)
- [x] Master Customers (CRUD)
- [x] Master Locations (CRUD)
- [x] Master Batches (CRUD)

### ✅ Phase 2: Sales Flow (100% Complete)
- [x] Sales Quotation (SQ) - dengan convert to SO
- [x] Sales Order (SO) - dengan stock reservation & FIFO
- [x] Delivery Order (DO) - dengan auto-pick FIFO & batch tracking
- [x] Shipment / Surat Jalan (SJ) - delivery tracking
- [x] Invoice (INV) - dengan HPP calculation & profit tracking

### 📋 Phase 3: Payment & Return (Next)
- [ ] Payment Receipt - record pembayaran invoice
- [ ] Return Request (RR) - customer return request
- [ ] Return Receipt (RCV) - terima barang return
- [ ] Credit Note (CN) - credit memo untuk return

### 📋 Phase 4: Reports & Dashboard (Future)
- [ ] Sales Report - laporan penjualan
- [ ] Stock Report - laporan stok
- [ ] Profit Report - laporan profit & margin
- [ ] AR Aging Report - piutang customer
- [ ] Dashboard Enhancement - charts & analytics

## Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run start            # Start production server

# Prisma
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations (dev)
npx prisma db seed       # Seed database
npx prisma studio        # Open Prisma Studio

# Lint
npm run lint             # Run ESLint
```

## Notes

- MAMP MySQL default port: **8889**
- Dev server auto-selects available port (3000, 3001, 3002...)
- Database connection via socket: `/Applications/MAMP/tmp/mysql/mysql.sock`
- Soft delete implemented (isActive field)
- All prices stored as Decimal for precision

## License

Private - Internal Use Only
