import { Prisma } from '@prisma/client'

// Base Batch type from Prisma
export type Batch = Prisma.BatchGetPayload<{}>

// Batch with relations
export type BatchWithRelations = Prisma.BatchGetPayload<{
  include: {
    item: true
    stocks: {
      include: {
        location: true
      }
    }
  }
}>

// Batch for list view
export type BatchListItem = {
  id: string
  batchNumber: string
  itemCode: string
  itemName: string
  purchaseDate: Date
  purchasePrice: number
  supplier: string
  expiryDate: Date | null
  totalStock: number
  createdAt: Date
}

// Batch create/update input
export type BatchInput = {
  batchNumber?: string // Optional for create (auto-generated)
  itemCode: string
  purchaseDate: Date | string
  purchasePrice: number
  supplier: string
  expiryDate?: Date | string | null
  characteristics?: Record<string, any>
  notes?: string
}

// Batch filter/search
export type BatchFilter = {
  search?: string
  itemCode?: string
  supplier?: string
  page?: number
  limit?: number
  sortBy?: 'batchNumber' | 'purchaseDate' | 'itemCode' | 'supplier' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// API Response types
export type BatchesResponse = {
  batches: BatchListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type BatchDetailResponse = {
  batch: BatchWithRelations
  stockSummary: {
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
    locations: Array<{
      locationCode: string
      locationName: string
      quantity: number
      availableQty: number
    }>
  }
}

// Common characteristics for batches
export const COMMON_CHARACTERISTICS = {
  color: ['black', 'red', 'blue', 'silver', 'white', 'yellow', 'green'],
  grade: ['A', 'B', 'C', 'Original', 'OEM', 'Aftermarket'],
  origin: ['Indonesia', 'Thailand', 'Japan', 'China', 'Taiwan', 'Malaysia'],
} as const
