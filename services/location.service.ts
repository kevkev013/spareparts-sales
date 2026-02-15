import { prisma } from '@/lib/prisma'
import type { LocationInput, LocationFilter, LocationsResponse, LocationDetailResponse } from '@/types/location'
import { Prisma } from '@prisma/client'

/**
 * Get all locations with filters and pagination
 */
export async function getLocations(filter: LocationFilter): Promise<LocationsResponse> {
  const {
    search,
    warehouse,
    zone,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'locationCode',
    sortOrder = 'asc',
  } = filter

  // Build where clause
  const where: Prisma.LocationWhereInput = {
    AND: [
      isActive !== undefined ? { isActive } : {},
      warehouse ? { warehouse } : {},
      zone ? { zone } : {},
      search
        ? {
            OR: [
              { locationCode: { contains: search } },
              { locationName: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {},
    ],
  }

  // Get total count
  const total = await prisma.location.count({ where })

  // Get locations with pagination
  const locations = await prisma.location.findMany({
    where,
    include: {
      stocks: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  // Map to list items with stock info
  const locationsList = locations.map((location) => {
    const uniqueItems = new Set(location.stocks.map(() => 1))
    const totalStock = location.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)

    return {
      id: location.id,
      locationCode: location.locationCode,
      locationName: location.locationName,
      warehouse: location.warehouse,
      zone: location.zone,
      itemCount: location.stocks.length,
      totalStock,
      isActive: location.isActive,
      createdAt: location.createdAt,
    }
  })

  return {
    locations: locationsList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get location by ID with stock details
 */
export async function getLocationById(id: string): Promise<LocationDetailResponse | null> {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      stocks: {
        include: {
          item: true,
        },
        orderBy: {
          item: {
            itemCode: 'asc',
          },
        },
      },
    },
  })

  if (!location) {
    return null
  }

  // Calculate stock summary
  const stockSummary = {
    totalItems: location.stocks.length,
    totalQuantity: location.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
    totalValue: location.stocks.reduce((sum, stock) => {
      return sum + Number(stock.quantity) * Number(stock.item.basePrice)
    }, 0),
    items: location.stocks.map((stock) => ({
      itemCode: stock.item.itemCode,
      itemName: stock.item.itemName,
      quantity: Number(stock.quantity),
      availableQty: Number(stock.availableQty),
      baseUnit: stock.item.baseUnit,
    })),
  }

  return {
    location,
    stockSummary,
  }
}

/**
 * Get location by location code
 */
export async function getLocationByCode(locationCode: string) {
  return await prisma.location.findUnique({
    where: { locationCode },
  })
}

/**
 * Create new location
 */
export async function createLocation(data: LocationInput) {
  if (!data.locationCode) {
    throw new Error('Kode lokasi wajib diisi')
  }

  // Check if location code already exists
  const existing = await prisma.location.findUnique({
    where: { locationCode: data.locationCode },
  })

  if (existing) {
    throw new Error('Kode lokasi sudah digunakan')
  }

  // Create location
  const location = await prisma.location.create({
    data: data as LocationInput & { locationCode: string },
  })

  return location
}

/**
 * Update location
 */
export async function updateLocation(id: string, data: LocationInput) {
  const existingLocation = await prisma.location.findUnique({
    where: { id },
  })

  if (!existingLocation) {
    throw new Error('Lokasi tidak ditemukan')
  }

  // If location code is being changed, check if new code exists
  if (data.locationCode && data.locationCode !== existingLocation.locationCode) {
    const codeExists = await prisma.location.findUnique({
      where: { locationCode: data.locationCode },
    })

    if (codeExists) {
      throw new Error('Kode lokasi sudah digunakan')
    }
  }

  // Update location
  const location = await prisma.location.update({
    where: { id },
    data,
  })

  return location
}

/**
 * Delete location (soft delete by setting isActive to false)
 */
export async function deleteLocation(id: string) {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      stocks: true,
    },
  })

  if (!location) {
    throw new Error('Lokasi tidak ditemukan')
  }

  // Check if location has stock
  const totalStock = location.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
  if (totalStock > 0) {
    throw new Error('Lokasi masih memiliki stok, tidak dapat dihapus')
  }

  // Soft delete
  return await prisma.location.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Get warehouses (distinct)
 */
export async function getWarehouses() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    select: { warehouse: true },
    distinct: ['warehouse'],
    orderBy: { warehouse: 'asc' },
  })

  return locations.map((location) => location.warehouse)
}

/**
 * Get zones (distinct)
 */
export async function getZones() {
  const locations = await prisma.location.findMany({
    where: {
      isActive: true,
      zone: {
        not: null,
      },
    },
    select: { zone: true },
    distinct: ['zone'],
    orderBy: { zone: 'asc' },
  })

  return locations.map((location) => location.zone).filter(Boolean) as string[]
}
