import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import type { BatchInput, BatchFilter, BatchesResponse, BatchDetailResponse } from '@/types/batch'
import { Prisma } from '@prisma/client'

/**
 * Generate next batch number (BTH-YYYYMMDD-XXX)
 */
export async function generateBatchNumber(purchaseDate: Date): Promise<string> {
  const year = purchaseDate.getFullYear()
  const month = String(purchaseDate.getMonth() + 1).padStart(2, '0')
  const day = String(purchaseDate.getDate()).padStart(2, '0')
  const datePrefix = `${year}${month}${day}`

  const prefix = `${DOC_PREFIX.BATCH}-${datePrefix}`

  const lastBatch = await prisma.batch.findFirst({
    where: {
      batchNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      batchNumber: 'desc',
    },
  })

  if (!lastBatch) {
    return `${prefix}-001`
  }

  const lastNumber = parseInt(lastBatch.batchNumber.split('-')[2])
  const nextNumber = lastNumber + 1
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`
}

/**
 * Get all batches with filters and pagination
 */
export async function getBatches(filter: BatchFilter): Promise<BatchesResponse> {
  const {
    search,
    itemCode,
    supplier,
    page = 1,
    limit = 10,
    sortBy = 'purchaseDate',
    sortOrder = 'desc',
  } = filter

  // Build where clause
  const where: Prisma.BatchWhereInput = {
    AND: [
      itemCode ? { itemCode } : {},
      supplier ? { supplier: { contains: supplier } } : {},
      search
        ? {
            OR: [
              { batchNumber: { contains: search } },
              { supplier: { contains: search } },
              { notes: { contains: search } },
            ],
          }
        : {},
    ],
  }

  // Get total count
  const total = await prisma.batch.count({ where })

  // Get batches with pagination
  const batches = await prisma.batch.findMany({
    where,
    include: {
      item: true,
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
  const batchesList = batches.map((batch) => ({
    id: batch.id,
    batchNumber: batch.batchNumber,
    itemCode: batch.itemCode,
    itemName: batch.item.itemName,
    purchaseDate: batch.purchaseDate,
    purchasePrice: Number(batch.purchasePrice),
    supplier: batch.supplier,
    expiryDate: batch.expiryDate,
    totalStock: batch.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
    createdAt: batch.createdAt,
  }))

  return {
    batches: batchesList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get batch by ID with relations
 */
export async function getBatchById(id: string): Promise<BatchDetailResponse | null> {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      item: true,
      stocks: {
        include: {
          location: true,
        },
      },
    },
  })

  if (!batch) {
    return null
  }

  // Calculate stock summary
  const stockSummary = {
    totalQuantity: batch.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
    totalReserved: batch.stocks.reduce((sum, stock) => sum + Number(stock.reservedQty), 0),
    totalAvailable: batch.stocks.reduce((sum, stock) => sum + Number(stock.availableQty), 0),
    locations: batch.stocks.map((stock) => ({
      locationCode: stock.locationCode,
      locationName: stock.location.locationName,
      quantity: Number(stock.quantity),
      availableQty: Number(stock.availableQty),
    })),
  }

  return {
    batch,
    stockSummary,
  }
}

/**
 * Get batch by batch number
 */
export async function getBatchByNumber(batchNumber: string) {
  return await prisma.batch.findUnique({
    where: { batchNumber },
    include: {
      item: true,
    },
  })
}

/**
 * Create new batch
 */
export async function createBatch(data: BatchInput) {
  // Convert string dates to Date objects
  const purchaseDate = typeof data.purchaseDate === 'string'
    ? new Date(data.purchaseDate)
    : data.purchaseDate

  const expiryDate = data.expiryDate
    ? typeof data.expiryDate === 'string'
      ? new Date(data.expiryDate)
      : data.expiryDate
    : null

  // Generate batch number if not provided
  const batchNumber = data.batchNumber || (await generateBatchNumber(purchaseDate))

  // Check if batch number already exists
  const existing = await prisma.batch.findUnique({
    where: { batchNumber },
  })

  if (existing) {
    throw new Error('Nomor batch sudah digunakan')
  }

  // Check if item exists
  const item = await prisma.item.findUnique({
    where: { itemCode: data.itemCode },
  })

  if (!item) {
    throw new Error('Item tidak ditemukan')
  }

  // Create batch
  const batch = await prisma.batch.create({
    data: {
      batchNumber,
      itemCode: data.itemCode,
      purchaseDate,
      purchasePrice: data.purchasePrice,
      supplier: data.supplier,
      expiryDate,
      characteristics: data.characteristics || {},
      notes: data.notes,
    },
    include: {
      item: true,
    },
  })

  return batch
}

/**
 * Update batch
 */
export async function updateBatch(id: string, data: BatchInput) {
  const existingBatch = await prisma.batch.findUnique({
    where: { id },
  })

  if (!existingBatch) {
    throw new Error('Batch tidak ditemukan')
  }

  // Convert string dates to Date objects
  const purchaseDate = typeof data.purchaseDate === 'string'
    ? new Date(data.purchaseDate)
    : data.purchaseDate

  const expiryDate = data.expiryDate
    ? typeof data.expiryDate === 'string'
      ? new Date(data.expiryDate)
      : data.expiryDate
    : null

  // Update batch
  const batch = await prisma.batch.update({
    where: { id },
    data: {
      itemCode: data.itemCode,
      purchaseDate,
      purchasePrice: data.purchasePrice,
      supplier: data.supplier,
      expiryDate,
      characteristics: data.characteristics || {},
      notes: data.notes,
    },
    include: {
      item: true,
    },
  })

  return batch
}

/**
 * Delete batch
 */
export async function deleteBatch(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      stocks: true,
    },
  })

  if (!batch) {
    throw new Error('Batch tidak ditemukan')
  }

  // Check if batch has stock
  const totalStock = batch.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
  if (totalStock > 0) {
    throw new Error('Batch masih memiliki stok, tidak dapat dihapus')
  }

  // Delete batch
  return await prisma.batch.delete({
    where: { id },
  })
}

/**
 * Get suppliers (distinct)
 */
export async function getSuppliers() {
  const batches = await prisma.batch.findMany({
    select: { supplier: true },
    distinct: ['supplier'],
    orderBy: { supplier: 'asc' },
  })

  return batches.map((batch) => batch.supplier)
}
