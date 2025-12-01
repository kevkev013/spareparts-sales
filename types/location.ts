import { Prisma } from '@prisma/client'

// Base Location type from Prisma
export type Location = Prisma.LocationGetPayload<{}>

// Location with stock info
export type LocationWithStock = Prisma.LocationGetPayload<{
  include: {
    stocks: {
      include: {
        item: true
      }
    }
  }
}>

// Location for list view
export type LocationListItem = {
  id: string
  locationCode: string
  locationName: string
  warehouse: string
  zone: string | null
  itemCount: number
  totalStock: number
  isActive: boolean
  createdAt: Date
}

// Location create/update input
export type LocationInput = {
  locationCode?: string // Optional for create (can be auto-generated or manual)
  locationName: string
  warehouse: string
  zone?: string
  description?: string
  isActive?: boolean
}

// Location filter/search
export type LocationFilter = {
  search?: string
  warehouse?: string
  zone?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: 'locationCode' | 'locationName' | 'warehouse' | 'zone' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// API Response types
export type LocationsResponse = {
  locations: LocationListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type LocationDetailResponse = {
  location: Location
  stockSummary: {
    totalItems: number
    totalQuantity: number
    totalValue: number
    items: Array<{
      itemCode: string
      itemName: string
      quantity: number
      availableQty: number
      baseUnit: string
    }>
  }
}

// Zone options
export const ZONE_OPTIONS = [
  { value: 'receiving', label: 'Receiving' },
  { value: 'storage', label: 'Storage' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'quarantine', label: 'Quarantine' },
  { value: 'return', label: 'Return' },
] as const
