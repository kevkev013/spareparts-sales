import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import type { ItemInput, ItemFilter, ItemsResponse, ItemDetailResponse } from '@/types/item'
import { Prisma } from '@prisma/client'

/**
 * Generate next item code (SPR-XXXX)
 */
export async function generateItemCode(): Promise<string> {
  const lastItem = await prisma.item.findFirst({
    where: {
      itemCode: {
        startsWith: DOC_PREFIX.ITEM,
      },
    },
    orderBy: {
      itemCode: 'desc',
    },
  })

  if (!lastItem) {
    return `${DOC_PREFIX.ITEM}-0001`
  }

  const lastNumber = parseInt(lastItem.itemCode.split('-')[1])
  const nextNumber = lastNumber + 1
  return `${DOC_PREFIX.ITEM}-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Get all items with filters and pagination
 */
export async function getItems(filter: ItemFilter): Promise<ItemsResponse> {
  const {
    search,
    category,
    brand,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filter

  // Build where clause
  const where: Prisma.ItemWhereInput = {
    AND: [
      isActive !== undefined ? { isActive } : {},
      category ? { category } : {},
      brand ? { brand } : {},
      search
        ? {
            OR: [
              { itemCode: { contains: search } },
              { itemName: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {},
    ],
  }

  // Get total count
  const total = await prisma.item.count({ where })

  // Get items with pagination
  const items = await prisma.item.findMany({
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

  // Map to list items with total stock
  const itemsList = items.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    category: item.category,
    brand: item.brand,
    baseUnit: item.baseUnit,
    sellingPrice: Number(item.sellingPrice),
    minStock: item.minStock,
    totalStock: item.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
    isActive: item.isActive,
    createdAt: item.createdAt,
  }))

  return {
    items: itemsList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get item by ID with relations
 */
export async function getItemById(id: string): Promise<ItemDetailResponse | null> {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      unitConversions: {
        where: { isActive: true },
        orderBy: { fromUnit: 'asc' },
      },
      unitPrices: {
        where: { isActive: true },
        orderBy: { unit: 'asc' },
      },
      batches: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      stocks: {
        include: {
          location: true,
        },
      },
    },
  })

  if (!item) {
    return null
  }

  // Calculate stock summary
  const stockSummary = {
    totalStock: item.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
    totalReserved: item.stocks.reduce((sum, stock) => sum + Number(stock.reservedQty), 0),
    totalAvailable: item.stocks.reduce((sum, stock) => sum + Number(stock.availableQty), 0),
    locations: item.stocks.map((stock) => ({
      locationCode: stock.locationCode,
      locationName: stock.location.locationName,
      quantity: Number(stock.quantity),
      availableQty: Number(stock.availableQty),
    })),
  }

  return {
    item,
    stockSummary,
  }
}

/**
 * Get item by item code
 */
export async function getItemByCode(itemCode: string) {
  return await prisma.item.findUnique({
    where: { itemCode },
    include: {
      unitConversions: true,
      unitPrices: true,
    },
  })
}

/**
 * Create new item
 */
export async function createItem(data: ItemInput) {
  // Generate item code if not provided
  const itemCode = data.itemCode || (await generateItemCode())

  // Check if item code already exists
  const existing = await prisma.item.findUnique({
    where: { itemCode },
  })

  if (existing) {
    throw new Error('Kode item sudah digunakan')
  }

  // Prepare data
  const { unitConversions, unitPrices, ...itemData } = data

  // Create item with relations
  const item = await prisma.item.create({
    data: {
      ...itemData,
      itemCode,
      compatibleMotors: itemData.compatibleMotors || [],
      unitConversions: unitConversions?.length
        ? {
            createMany: {
              data: unitConversions.map((uc) => ({
                ...uc,
                itemCode,
              })),
            },
          }
        : undefined,
      unitPrices: unitPrices?.length
        ? {
            createMany: {
              data: unitPrices.map((up) => ({
                ...up,
                itemCode,
              })),
            },
          }
        : undefined,
    },
    include: {
      unitConversions: true,
      unitPrices: true,
    },
  })

  // Log price movement for initial prices
  if (data.sellingPrice > 0) {
    await prisma.priceMovement.create({
      data: {
        itemCode,
        unit: data.baseUnit,
        priceType: 'selling',
        oldPrice: 0,
        newPrice: data.sellingPrice,
        changePercentage: 100,
        reason: 'Initial price',
        changedBy: 'System',
      },
    })
  }

  return item
}

/**
 * Update item
 */
export async function updateItem(id: string, data: ItemInput) {
  const existingItem = await prisma.item.findUnique({
    where: { id },
    include: {
      unitConversions: true,
      unitPrices: true,
    },
  })

  if (!existingItem) {
    throw new Error('Item tidak ditemukan')
  }

  const { unitConversions, unitPrices, ...itemData } = data

  // Check for price changes
  if (data.sellingPrice !== Number(existingItem.sellingPrice)) {
    const oldPrice = Number(existingItem.sellingPrice)
    const newPrice = data.sellingPrice
    const changePercentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 100

    await prisma.priceMovement.create({
      data: {
        itemCode: existingItem.itemCode,
        unit: data.baseUnit,
        priceType: 'selling',
        oldPrice,
        newPrice,
        changePercentage,
        reason: 'Price update',
        changedBy: 'System',
      },
    })
  }

  // Update item
  const item = await prisma.item.update({
    where: { id },
    data: {
      ...itemData,
      compatibleMotors: itemData.compatibleMotors || [],
    },
    include: {
      unitConversions: true,
      unitPrices: true,
    },
  })

  // Handle unit conversions
  if (unitConversions) {
    // Delete existing and create new ones
    await prisma.unitConversion.deleteMany({
      where: { itemCode: existingItem.itemCode },
    })

    if (unitConversions.length > 0) {
      await prisma.unitConversion.createMany({
        data: unitConversions.map((uc) => ({
          ...uc,
          itemCode: existingItem.itemCode,
        })),
      })
    }
  }

  // Handle unit prices
  if (unitPrices) {
    await prisma.unitPrice.deleteMany({
      where: { itemCode: existingItem.itemCode },
    })

    if (unitPrices.length > 0) {
      await prisma.unitPrice.createMany({
        data: unitPrices.map((up) => ({
          ...up,
          itemCode: existingItem.itemCode,
        })),
      })
    }
  }

  return await getItemById(id)
}

/**
 * Delete item (soft delete by setting isActive to false)
 */
export async function deleteItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      stocks: true,
    },
  })

  if (!item) {
    throw new Error('Item tidak ditemukan')
  }

  // Check if item has stock
  const totalStock = item.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
  if (totalStock > 0) {
    throw new Error('Item masih memiliki stok, tidak dapat dihapus')
  }

  // Check if item is in active orders
  const activeOrderItems = await prisma.salesOrderItem.count({
    where: {
      itemCode: item.itemCode,
      salesOrder: { status: { in: ['confirmed', 'processing', 'partial_fulfilled'] } },
    },
  })

  if (activeOrderItems > 0) {
    throw new Error('Item masih ada di order aktif, tidak dapat dihapus')
  }

  // Soft delete
  return await prisma.item.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Get categories (distinct)
 */
export async function getCategories() {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })

  return items.map((item) => item.category)
}

/**
 * Get brands (distinct)
 */
export async function getBrands() {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  })

  return items.map((item) => item.brand)
}
