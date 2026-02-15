import { prisma } from '@/lib/prisma'
import { DeliveryStatus } from '@prisma/client'
import { DOC_PREFIX } from '@/lib/constants'
import type {
  DeliveryOrderInput,
  DeliveryOrderFilter,
  DeliveryOrdersResponse,
  DeliveryOrderWithRelations,
} from '@/types/delivery-order'
import { Prisma } from '@prisma/client'

/**
 * Generate Delivery Order number
 * Format: DO-YYYYMM-XXXX (e.g., DO-202501-0001)
 */
export async function generateDoNumber(doDate: Date): Promise<string> {
  const year = doDate.getFullYear()
  const month = String(doDate.getMonth() + 1).padStart(2, '0')
  const period = `${year}${month}`
  const prefix = `${DOC_PREFIX.DELIVERY_ORDER}-${period}`

  const lastDo = await prisma.deliveryOrder.findFirst({
    where: {
      doNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      doNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastDo) {
    const lastNumber = parseInt(lastDo.doNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Auto-pick items using FIFO (First In First Out)
 * Returns picked items with batch and location
 */
async function autoPickItems(soId: string) {
  // Get SO items
  const soItems = await prisma.salesOrderItem.findMany({
    where: { soId },
    include: {
      item: true,
    },
  })

  const pickedItems = []

  for (const soItem of soItems) {
    const remainingQty = Number(soItem.quantity) - Number(soItem.fulfilledQty)

    if (remainingQty <= 0) continue

    // Get available stock with reserved qty, ordered by FIFO (purchase date)
    const stocks = await prisma.stock.findMany({
      where: {
        itemCode: soItem.itemCode,
        reservedQty: { gt: 0 },
      },
      include: {
        batch: true,
        location: true,
      },
      orderBy: [
        { batch: { purchaseDate: 'asc' } }, // FIFO
      ],
    })

    let qtyToPick = remainingQty

    for (const stock of stocks) {
      if (qtyToPick <= 0) break

      const availableToPick = Math.min(Number(stock.reservedQty), qtyToPick)

      if (availableToPick > 0) {
        pickedItems.push({
          soItemId: soItem.id,
          itemCode: soItem.itemCode,
          orderedQty: remainingQty,
          pickedQty: availableToPick,
          unit: soItem.unit,
          batchNumber: stock.batchNumber,
          locationCode: stock.locationCode,
        })

        qtyToPick -= availableToPick
      }
    }

    if (qtyToPick > 0) {
      throw new Error(
        `Stok tidak cukup untuk item ${soItem.itemCode}. Kurang ${qtyToPick} unit.`
      )
    }
  }

  return pickedItems
}

/**
 * Update stock quantities when picking
 */
async function updateStockOnPick(items: Array<{ itemCode: string; batchNumber: string; locationCode: string; pickedQty: number }>) {
  for (const item of items) {
    const stock = await prisma.stock.findFirst({
      where: {
        itemCode: item.itemCode,
        batchNumber: item.batchNumber,
        locationCode: item.locationCode,
      },
    })

    if (!stock) {
      throw new Error(`Stock tidak ditemukan untuk ${item.itemCode} di ${item.locationCode}`)
    }

    // Reduce reserved qty and total qty
    await prisma.stock.update({
      where: { id: stock.id },
      data: {
        reservedQty: { decrement: item.pickedQty },
        quantity: { decrement: item.pickedQty },
      },
    })
  }
}

/**
 * Update SO item fulfillment
 */
async function updateSoFulfillment(doItems: Array<{ soItemId: string; pickedQty: number }>) {
  for (const item of doItems) {
    await prisma.salesOrderItem.update({
      where: { id: item.soItemId },
      data: {
        fulfilledQty: { increment: item.pickedQty },
      },
    })
  }

  // Check if all SO items are fulfilled and update SO status
  const soItem = await prisma.salesOrderItem.findUnique({
    where: { id: doItems[0].soItemId },
    include: {
      salesOrder: {
        include: {
          items: true,
        },
      },
    },
  })

  if (soItem) {
    const allItems = soItem.salesOrder.items
    const allFulfilled = allItems.every(
      (item) => Number(item.fulfilledQty) >= Number(item.quantity)
    )
    const anyFulfilled = allItems.some((item) => Number(item.fulfilledQty) > 0)

    let newStatus: 'processing' | 'partial_fulfilled' | 'fulfilled' = 'processing'
    if (allFulfilled) {
      newStatus = 'fulfilled'
    } else if (anyFulfilled) {
      newStatus = 'partial_fulfilled'
    }

    await prisma.salesOrder.update({
      where: { id: soItem.soId },
      data: { status: newStatus },
    })
  }
}

/**
 * Get list of delivery orders
 */
export async function getDeliveryOrders(
  filter: DeliveryOrderFilter
): Promise<DeliveryOrdersResponse> {
  const {
    search,
    soNumber,
    customerCode,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'doDate',
    sortOrder = 'desc',
  } = filter

  const skip = (page - 1) * limit

  const where: Prisma.DeliveryOrderWhereInput = {}

  if (search) {
    where.OR = [
      { doNumber: { contains: search } },
      { soNumber: { contains: search } },
      { customer: { customerName: { contains: search } } },
    ]
  }

  if (soNumber) where.soNumber = soNumber
  if (customerCode) where.customerCode = customerCode
  if (status) where.status = status as DeliveryStatus

  if (dateFrom || dateTo) {
    where.doDate = {}
    if (dateFrom) where.doDate.gte = dateFrom
    if (dateTo) where.doDate.lte = dateTo
  }

  const total = await prisma.deliveryOrder.count({ where })

  const orderBy: Prisma.DeliveryOrderOrderByWithRelationInput = {}
  orderBy[sortBy] = sortOrder

  const deliveryOrders = await prisma.deliveryOrder.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: {
      customer: {
        select: {
          customerCode: true,
          customerName: true,
        },
      },
      items: {
        select: {
          id: true,
        },
      },
    },
  })

  const formatted = deliveryOrders.map((d) => ({
    id: d.id,
    doNumber: d.doNumber,
    doDate: d.doDate,
    soNumber: d.soNumber,
    customerCode: d.customerCode,
    customerName: d.customer.customerName,
    status: d.status,
    itemCount: d.items.length,
    pickedAt: d.pickedAt,
  }))

  return {
    deliveryOrders: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get delivery order by ID
 */
export async function getDeliveryOrderById(
  id: string
): Promise<DeliveryOrderWithRelations | null> {
  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          customerCode: true,
          customerName: true,
          customerType: true,
          phone: true,
          email: true,
        },
      },
      salesOrder: {
        select: {
          soNumber: true,
          soDate: true,
          grandTotal: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              itemCode: true,
              itemName: true,
              category: true,
              brand: true,
              baseUnit: true,
            },
          },
          batch: {
            select: {
              batchNumber: true,
              purchaseDate: true,
              purchasePrice: true,
            },
          },
          location: {
            select: {
              locationCode: true,
              locationName: true,
            },
          },
        },
      },
    },
  })

  return deliveryOrder
}

/**
 * Create delivery order with auto-picking
 */
export async function createDeliveryOrder(soId: string, pickerName?: string): Promise<string> {
  // Get SO details
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: soId },
    include: {
      items: true,
    },
  })

  if (!salesOrder) {
    throw new Error('Sales Order tidak ditemukan')
  }

  if (salesOrder.status === 'fulfilled' || salesOrder.status === 'cancelled') {
    throw new Error('Sales Order sudah fulfilled atau cancelled')
  }

  // Auto-pick items using FIFO
  const pickedItems = await autoPickItems(soId)

  if (pickedItems.length === 0) {
    throw new Error('Tidak ada item yang bisa dipick')
  }

  // Generate DO number
  const doNumber = await generateDoNumber(new Date())

  // Create DO with items
  const deliveryOrder = await prisma.deliveryOrder.create({
    data: {
      doNumber,
      doDate: new Date(),
      soId,
      soNumber: salesOrder.soNumber,
      customerCode: salesOrder.customerCode,
      pickerName,
      status: 'picking',
      items: {
        create: pickedItems,
      },
    },
  })

  return deliveryOrder.id
}

/**
 * Complete picking (mark as picked and update stock)
 */
export async function completePicking(id: string): Promise<void> {
  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id },
    include: {
      items: true,
    },
  })

  if (!deliveryOrder) {
    throw new Error('Delivery Order tidak ditemukan')
  }

  if (deliveryOrder.status !== 'picking') {
    throw new Error('Delivery Order sudah tidak dalam status picking')
  }

  // Update stock quantities
  await updateStockOnPick(
    deliveryOrder.items.map((item) => ({
      itemCode: item.itemCode,
      batchNumber: item.batchNumber,
      locationCode: item.locationCode,
      pickedQty: Number(item.pickedQty),
    }))
  )

  // Update SO fulfillment
  await updateSoFulfillment(
    deliveryOrder.items.map((item) => ({
      soItemId: item.soItemId,
      pickedQty: Number(item.pickedQty),
    }))
  )

  // Update DO status
  await prisma.deliveryOrder.update({
    where: { id },
    data: {
      status: 'picked',
      pickedAt: new Date(),
    },
  })
}

/**
 * Mark as shipped
 */
export async function markAsShipped(id: string): Promise<void> {
  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id },
  })

  if (!deliveryOrder) {
    throw new Error('Delivery Order tidak ditemukan')
  }

  if (deliveryOrder.status !== 'picked') {
    throw new Error('Delivery Order harus dalam status picked')
  }

  await prisma.deliveryOrder.update({
    where: { id },
    data: { status: 'shipped' },
  })
}
