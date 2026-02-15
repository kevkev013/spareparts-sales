import { Prisma, CustomerType } from '@prisma/client'

// Base DeliveryOrder type
export type DeliveryOrder = {
  id: string
  doNumber: string
  doDate: Date
  soId: string
  soNumber: string
  customerCode: string
  pickerName: string | null
  notes: string | null
  status: 'picking' | 'picked' | 'shipped'
  pickedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Delivery Order Line Item
export type DeliveryOrderItem = {
  id: string
  doId: string
  soItemId: string
  itemCode: string
  orderedQty: Prisma.Decimal
  pickedQty: Prisma.Decimal
  unit: string
  batchNumber: string
  locationCode: string
  notes: string | null
}

// Delivery Order with relations
export type DeliveryOrderWithRelations = DeliveryOrder & {
  customer: {
    customerCode: string
    customerName: string
    customerType: CustomerType
    phone: string | null
    email: string | null
  }
  salesOrder: {
    soNumber: string
    soDate: Date
    grandTotal: Prisma.Decimal
  }
  items: Array<
    DeliveryOrderItem & {
      item: {
        itemCode: string
        itemName: string
        category: string
        brand: string
        baseUnit: string
      }
      batch: {
        batchNumber: string
        purchaseDate: Date
        purchasePrice: Prisma.Decimal
      }
      location: {
        locationCode: string
        locationName: string
      }
    }
  >
}

// For list page
export type DeliveryOrderListItem = {
  id: string
  doNumber: string
  doDate: Date
  soNumber: string
  customerCode: string
  customerName: string
  status: string
  itemCount: number
  pickedAt: Date | null
}

// Form input types
export type DeliveryOrderItemInput = {
  soItemId: string
  itemCode: string
  orderedQty: number
  pickedQty: number
  unit: string
  batchNumber: string
  locationCode: string
  notes?: string
}

export type DeliveryOrderInput = {
  doNumber?: string
  doDate: Date
  soId: string
  pickerName?: string
  notes?: string
  status: 'picking' | 'picked' | 'shipped'
  items: DeliveryOrderItemInput[]
}

// Filter and pagination
export type DeliveryOrderFilter = {
  search?: string
  soNumber?: string
  customerCode?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortBy?: 'doNumber' | 'doDate' | 'soNumber' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export type DeliveryOrdersResponse = {
  deliveryOrders: DeliveryOrderListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Status options
export const DELIVERY_STATUS = {
  PICKING: 'picking',
  PICKED: 'picked',
  SHIPPED: 'shipped',
} as const

export type DeliveryStatusType = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS]
