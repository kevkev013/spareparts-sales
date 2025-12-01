// Document Number Prefixes
export const DOC_PREFIX = {
  ITEM: 'SPR',
  CUSTOMER: 'CUS',
  BATCH: 'BTH',
  SALES_QUOTATION: 'SQ',
  SALES_ORDER: 'SO',
  DELIVERY_ORDER: 'DO',
  SHIPMENT: 'SJ',
  INVOICE: 'INV',
  PAYMENT: 'PAY',
  RETURN_REQUEST: 'RR',
  RETURN_RECEIPT: 'RCV',
  CREDIT_NOTE: 'CN',
} as const

// Customer Types
export const CUSTOMER_TYPES = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Grosir' },
  { value: 'bengkel', label: 'Bengkel' },
] as const

// Tax Types
export const TAX_TYPES = [
  { value: 'inclusive', label: 'Inclusive (Harga sudah termasuk pajak)' },
  { value: 'exclusive', label: 'Exclusive (Pajak ditambahkan ke harga)' },
] as const

// Price Types
export const PRICE_TYPES = [
  { value: 'buying', label: 'Harga Beli' },
  { value: 'selling', label: 'Harga Jual' },
] as const

// Common Units
export const COMMON_UNITS = [
  'pcs',
  'unit',
  'box',
  'lusin',
  'pack',
  'set',
  'liter',
  'galon',
  'meter',
  'kg',
] as const

// Item Categories
export const ITEM_CATEGORIES = [
  'Oli Mesin',
  'Oli Gardan',
  'Filter',
  'Kampas Rem',
  'Bearing',
  'Busi',
  'V-Belt',
  'Rantai',
  'Gear',
  'Lampu',
  'Ban',
  'Aki',
  'Spion',
  'Knalpot',
  'Lainnya',
] as const

// Motor Brands
export const MOTOR_BRANDS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'TVS',
  'Vespa',
  'Benelli',
  'Aftermarket',
  'Universal',
] as const

// Quotation Status
export const QUOTATION_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'converted', label: 'Dikonversi ke SO' },
] as const

// Order Status
export const ORDER_STATUS = [
  { value: 'confirmed', label: 'Terkonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'partial_fulfilled', label: 'Terpenuhi Sebagian' },
  { value: 'fulfilled', label: 'Terpenuhi' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const

// Delivery Status
export const DELIVERY_STATUS = [
  { value: 'picking', label: 'Sedang Dipick' },
  { value: 'picked', label: 'Sudah Dipick' },
  { value: 'shipped', label: 'Sudah Dikirim' },
] as const

// Shipment Status
export const SHIPMENT_STATUS = [
  { value: 'in_transit', label: 'Dalam Pengiriman' },
  { value: 'delivered', label: 'Sudah Terkirim' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const

// Invoice Status
export const INVOICE_STATUS = [
  { value: 'unpaid', label: 'Belum Dibayar' },
  { value: 'partial_paid', label: 'Dibayar Sebagian' },
  { value: 'paid', label: 'Lunas' },
  { value: 'overdue', label: 'Jatuh Tempo' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const

// Status Colors
export const STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  confirmed: 'blue',
  processing: 'yellow',
  in_progress: 'yellow',
  in_transit: 'yellow',
  picking: 'yellow',
  picked: 'green',
  shipped: 'green',
  completed: 'green',
  fulfilled: 'green',
  partial_fulfilled: 'orange',
  paid: 'green',
  delivered: 'green',
  partial_paid: 'orange',
  partial_delivered: 'orange',
  overdue: 'red',
  cancelled: 'red',
  rejected: 'red',
  expired: 'red',
  converted: 'purple',
} as const
