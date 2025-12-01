import { Prisma } from '@prisma/client'

// Base SalesQuotation type from Prisma
export type SalesQuotation = {
  id: string
  sqNumber: string
  sqDate: Date
  customerCode: string
  validUntil: Date
  subtotal: Prisma.Decimal
  discountAmount: Prisma.Decimal
  taxAmount: Prisma.Decimal
  grandTotal: Prisma.Decimal
  notes: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  convertedToSo: boolean
  soNumber: string | null
  createdAt: Date
  updatedAt: Date
}

// Sales Quotation Line Item
export type SalesQuotationItem = {
  id: string
  sqId: string
  itemCode: string
  quantity: number
  unit: string
  unitPrice: Prisma.Decimal
  discountPercent: Prisma.Decimal
  discountAmount: Prisma.Decimal
  subtotal: Prisma.Decimal
  notes: string | null
}

// Sales Quotation with relations
export type SalesQuotationWithRelations = SalesQuotation & {
  customer: {
    customerCode: string
    customerName: string
    customerType: string
    phone: string | null
    email: string | null
    discountRate: Prisma.Decimal
  }
  items: Array<
    SalesQuotationItem & {
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
export type SalesQuotationListItem = {
  id: string
  sqNumber: string
  sqDate: Date
  customerCode: string
  customerName: string
  validUntil: Date
  grandTotal: Prisma.Decimal
  status: string
  convertedToSo: boolean
  soNumber: string | null
  itemCount: number
}

// Form input types
export type SalesQuotationItemInput = {
  itemCode: string
  quantity: number
  unit: string
  unitPrice: number
  discountPercent: number
  notes?: string
}

export type SalesQuotationInput = {
  sqNumber?: string
  sqDate: Date
  customerCode: string
  validUntil: Date
  notes?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  items: SalesQuotationItemInput[]
}

// Filter and pagination
export type SalesQuotationFilter = {
  search?: string
  customerCode?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortBy?: 'sqNumber' | 'sqDate' | 'customerName' | 'grandTotal' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export type SalesQuotationsResponse = {
  quotations: SalesQuotationListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Status options
export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted',
} as const

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS]
