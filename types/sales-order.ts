import { Prisma } from '@prisma/client'

// Base SalesOrder type from Prisma
export type SalesOrder = {
  id: string
  soNumber: string
  soDate: Date
  customerCode: string
  sqId: string | null
  sqNumber: string | null
  deliveryAddress: string | null
  deliveryDate: Date | null
  subtotal: Prisma.Decimal
  discountAmount: Prisma.Decimal
  taxAmount: Prisma.Decimal
  grandTotal: Prisma.Decimal
  notes: string | null
  status: 'confirmed' | 'processing' | 'partial_fulfilled' | 'fulfilled' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

// Sales Order Line Item
export type SalesOrderItem = {
  id: string
  soId: string
  itemCode: string
  quantity: number
  reservedQty: number
  fulfilledQty: number
  unit: string
  unitPrice: Prisma.Decimal
  discountPercent: Prisma.Decimal
  discountAmount: Prisma.Decimal
  subtotal: Prisma.Decimal
  notes: string | null
}

// Sales Order with relations
export type SalesOrderWithRelations = SalesOrder & {
  customer: {
    customerCode: string
    customerName: string
    customerType: string
    phone: string | null
    email: string | null
    address: string | null
    discountRate: Prisma.Decimal
  }
  salesQuotation: {
    sqNumber: string
    sqDate: Date
  } | null
  items: Array<
    SalesOrderItem & {
      item: {
        itemCode: string
        itemName: string
        category: string
        brand: string
        baseUnit: string
        sellingPrice: Prisma.Decimal
      }
    }
  >
}

// For list page
export type SalesOrderListItem = {
  id: string
  soNumber: string
  soDate: Date
  customerCode: string
  customerName: string
  sqNumber: string | null
  deliveryDate: Date | null
  grandTotal: Prisma.Decimal
  status: string
  itemCount: number
}

// Form input types
export type SalesOrderItemInput = {
  itemCode: string
  quantity: number
  unit: string
  unitPrice: number
  discountPercent: number
  notes?: string
}

export type SalesOrderInput = {
  soNumber?: string
  soDate: Date
  customerCode: string
  sqId?: string
  sqNumber?: string
  deliveryAddress?: string
  deliveryDate?: Date
  notes?: string
  status: 'confirmed' | 'processing' | 'partial_fulfilled' | 'fulfilled' | 'cancelled'
  items: SalesOrderItemInput[]
}

// Filter and pagination
export type SalesOrderFilter = {
  search?: string
  customerCode?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortBy?: 'soNumber' | 'soDate' | 'customerName' | 'grandTotal' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export type SalesOrdersResponse = {
  orders: SalesOrderListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Status options
export const ORDER_STATUS = {
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PARTIAL_FULFILLED: 'partial_fulfilled',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
} as const

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
