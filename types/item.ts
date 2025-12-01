import { Prisma } from '@prisma/client'

// Base Item type from Prisma
export type Item = Prisma.ItemGetPayload<{}>

// Item with relations
export type ItemWithRelations = Prisma.ItemGetPayload<{
  include: {
    unitConversions: true
    unitPrices: true
    batches: true
    stocks: true
  }
}>

// Item for list view
export type ItemListItem = {
  id: string
  itemCode: string
  itemName: string
  category: string
  brand: string
  baseUnit: string
  sellingPrice: number
  minStock: number
  totalStock: number
  isActive: boolean
  createdAt: Date
}

// Unit Conversion types
export type UnitConversion = Prisma.UnitConversionGetPayload<{}>

export type UnitConversionInput = {
  fromUnit: string
  toUnit: string
  conversionFactor: number
  isActive?: boolean
}

// Unit Price types
export type UnitPrice = Prisma.UnitPriceGetPayload<{}>

export type UnitPriceInput = {
  unit: string
  buyingPrice: number
  sellingPrice: number
  minQty?: number
  isActive?: boolean
}

// Item create/update input
export type ItemInput = {
  itemCode?: string // Optional for create (auto-generated)
  itemName: string
  category: string
  brand: string
  baseUnit: string
  basePrice: number
  sellingPrice: number
  minStock: number
  description?: string
  compatibleMotors?: string[]
  isTaxable?: boolean
  isActive?: boolean
  unitConversions?: UnitConversionInput[]
  unitPrices?: UnitPriceInput[]
}

// Item filter/search
export type ItemFilter = {
  search?: string
  category?: string
  brand?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: 'itemCode' | 'itemName' | 'category' | 'brand' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// API Response types
export type ItemsResponse = {
  items: ItemListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ItemDetailResponse = {
  item: ItemWithRelations
  stockSummary: {
    totalStock: number
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
