import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { DOC_PREFIX } from '@/lib/constants'
import type {
  SalesOrderInput,
  SalesOrderFilter,
  SalesOrdersResponse,
  SalesOrderWithRelations,
} from '@/types/sales-order'
import { Prisma } from '@prisma/client'

/**
 * Generate Sales Order number
 * Format: SO-YYYYMM-XXXX (e.g., SO-202501-0001)
 */
export async function generateSoNumber(soDate: Date): Promise<string> {
  const year = soDate.getFullYear()
  const month = String(soDate.getMonth() + 1).padStart(2, '0')
  const period = `${year}${month}`
  const prefix = `${DOC_PREFIX.SALES_ORDER}-${period}`

  // Get the last order number for this period
  const lastOrder = await prisma.salesOrder.findFirst({
    where: {
      soNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      soNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.soNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Calculate totals for order
 */
function calculateTotals(items: SalesOrderInput['items'], taxRate: number = 0) {
  let subtotal = 0
  let totalDiscount = 0

  const calculatedItems = items.map((item) => {
    const itemSubtotal = item.quantity * item.unitPrice
    const discountAmount = (itemSubtotal * item.discountPercent) / 100
    const finalSubtotal = itemSubtotal - discountAmount

    subtotal += finalSubtotal
    totalDiscount += discountAmount

    return {
      ...item,
      discountAmount,
      subtotal: finalSubtotal,
    }
  })

  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount

  return {
    items: calculatedItems,
    subtotal,
    discountAmount: totalDiscount,
    taxAmount,
    grandTotal,
  }
}

/**
 * Reserve stock for order items
 */
async function reserveStock(items: Array<{ itemCode: string; quantity: number }>) {
  for (const item of items) {
    // Get available stock for this item
    const stocks = await prisma.stock.findMany({
      where: {
        itemCode: item.itemCode,
        availableQty: { gt: 0 },
      },
      orderBy: [
        { batch: { purchaseDate: 'asc' } }, // FIFO
      ],
    })

    let remainingToReserve = item.quantity
    const updates: Array<{ id: string; reserveQty: number }> = []

    for (const stock of stocks) {
      if (remainingToReserve <= 0) break

      const availableQty = Number(stock.availableQty)
      const reserveQty = Math.min(availableQty, remainingToReserve)

      updates.push({ id: stock.id, reserveQty })
      remainingToReserve -= reserveQty
    }

    if (remainingToReserve > 0) {
      throw new Error(
        `Stok tidak cukup untuk item ${item.itemCode}. Kurang ${remainingToReserve} unit.`
      )
    }

    // Apply stock reservations
    for (const update of updates) {
      await prisma.stock.update({
        where: { id: update.id },
        data: {
          reservedQty: { increment: update.reserveQty },
          availableQty: { decrement: update.reserveQty },
        },
      })
    }
  }
}

/**
 * Release reserved stock for order items
 */
async function releaseStock(items: Array<{ itemCode: string; quantity: number }>) {
  for (const item of items) {
    const stocks = await prisma.stock.findMany({
      where: {
        itemCode: item.itemCode,
        reservedQty: { gt: 0 },
      },
    })

    let remainingToRelease = item.quantity

    for (const stock of stocks) {
      if (remainingToRelease <= 0) break

      const reservedQty = Number(stock.reservedQty)
      const releaseQty = Math.min(reservedQty, remainingToRelease)

      await prisma.stock.update({
        where: { id: stock.id },
        data: {
          reservedQty: { decrement: releaseQty },
          availableQty: { increment: releaseQty },
        },
      })

      remainingToRelease -= releaseQty
    }
  }
}

/**
 * Get list of orders with filters and pagination
 */
export async function getSalesOrders(filter: SalesOrderFilter): Promise<SalesOrdersResponse> {
  const {
    search,
    customerCode,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'soDate',
    sortOrder = 'desc',
  } = filter

  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.SalesOrderWhereInput = {}

  if (search) {
    where.OR = [
      { soNumber: { contains: search } },
      { sqNumber: { contains: search } },
      { customer: { customerName: { contains: search } } },
      { notes: { contains: search } },
    ]
  }

  if (customerCode) {
    where.customerCode = customerCode
  }

  if (status) {
    where.status = status as OrderStatus
  }

  if (dateFrom || dateTo) {
    where.soDate = {}
    if (dateFrom) where.soDate.gte = dateFrom
    if (dateTo) where.soDate.lte = dateTo
  }

  // Get total count
  const total = await prisma.salesOrder.count({ where })

  // Build order by
  const orderBy: Prisma.SalesOrderOrderByWithRelationInput = {}
  if (sortBy === 'customerName') {
    orderBy.customer = { customerName: sortOrder }
  } else {
    orderBy[sortBy] = sortOrder
  }

  // Get orders
  const orders = await prisma.salesOrder.findMany({
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

  // Format response
  const formattedOrders = orders.map((o) => ({
    id: o.id,
    soNumber: o.soNumber,
    soDate: o.soDate,
    customerCode: o.customerCode,
    customerName: o.customer.customerName,
    sqNumber: o.sqNumber,
    deliveryDate: o.deliveryDate,
    grandTotal: o.grandTotal,
    status: o.status,
    itemCount: o.items.length,
  }))

  return {
    orders: formattedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get order by ID with full details
 */
export async function getSalesOrderById(id: string): Promise<SalesOrderWithRelations | null> {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          customerCode: true,
          customerName: true,
          customerType: true,
          phone: true,
          email: true,
          address: true,
          discountRate: true,
        },
      },
      salesQuotation: {
        select: {
          sqNumber: true,
          sqDate: true,
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
              sellingPrice: true,
            },
          },
        },
      },
    },
  })

  return order
}

/**
 * Create new sales order
 */
export async function createSalesOrder(data: SalesOrderInput): Promise<string> {
  // Generate SO number if not provided
  const soNumber = data.soNumber || (await generateSoNumber(data.soDate))

  // Get customer for tax calculation
  const customer = await prisma.customer.findUnique({
    where: { customerCode: data.customerCode },
    select: { isTaxable: true },
  })

  if (!customer) {
    throw new Error('Customer tidak ditemukan')
  }

  // Get default tax rate if customer is taxable
  let taxRate = 0
  if (customer.isTaxable) {
    const defaultTax = await prisma.taxMaster.findFirst({
      where: { isDefault: true, isActive: true },
    })
    if (defaultTax) {
      taxRate = Number(defaultTax.taxRate)
    }
  }

  // Calculate totals
  const totals = calculateTotals(data.items, taxRate)

  // Reserve stock
  await reserveStock(
    data.items.map((item) => ({
      itemCode: item.itemCode,
      quantity: item.quantity,
    }))
  )

  try {
    // Create order with items
    const order = await prisma.salesOrder.create({
      data: {
        soNumber,
        soDate: data.soDate,
        customerCode: data.customerCode,
        sqId: data.sqId,
        sqNumber: data.sqNumber,
        deliveryAddress: data.deliveryAddress,
        deliveryDate: data.deliveryDate,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        notes: data.notes,
        status: data.status,
        items: {
          create: totals.items.map((item) => ({
            itemCode: item.itemCode,
            quantity: item.quantity,
            reservedQty: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            subtotal: item.subtotal,
            notes: item.notes,
          })),
        },
      },
    })

    // Update quotation if converting from SQ
    if (data.sqId) {
      await prisma.salesQuotation.update({
        where: { id: data.sqId },
        data: {
          status: 'converted',
          convertedToSo: true,
          soNumber: soNumber,
        },
      })
    }

    return order.id
  } catch (error) {
    // Release reserved stock if order creation fails
    await releaseStock(
      data.items.map((item) => ({
        itemCode: item.itemCode,
        quantity: item.quantity,
      }))
    )
    throw error
  }
}

/**
 * Update sales order
 */
export async function updateSalesOrder(id: string, data: SalesOrderInput): Promise<void> {
  // Check if order exists
  const existing = await prisma.salesOrder.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existing) {
    throw new Error('Sales Order tidak ditemukan')
  }

  if (existing.status === 'fulfilled' || existing.status === 'cancelled') {
    throw new Error('Tidak dapat mengubah order yang sudah fulfilled atau cancelled')
  }

  // Release old stock reservations
  await releaseStock(
    existing.items.map((item) => ({
      itemCode: item.itemCode,
      quantity: Number(item.reservedQty),
    }))
  )

  // Get customer for tax calculation
  const customer = await prisma.customer.findUnique({
    where: { customerCode: data.customerCode },
    select: { isTaxable: true },
  })

  if (!customer) {
    throw new Error('Customer tidak ditemukan')
  }

  // Get default tax rate if customer is taxable
  let taxRate = 0
  if (customer.isTaxable) {
    const defaultTax = await prisma.taxMaster.findFirst({
      where: { isDefault: true, isActive: true },
    })
    if (defaultTax) {
      taxRate = Number(defaultTax.taxRate)
    }
  }

  // Calculate totals
  const totals = calculateTotals(data.items, taxRate)

  // Reserve new stock
  await reserveStock(
    data.items.map((item) => ({
      itemCode: item.itemCode,
      quantity: item.quantity,
    }))
  )

  try {
    // Update order in transaction
    await prisma.$transaction([
      // Delete existing items
      prisma.salesOrderItem.deleteMany({
        where: { soId: id },
      }),
      // Update order with new items
      prisma.salesOrder.update({
        where: { id },
        data: {
          soDate: data.soDate,
          customerCode: data.customerCode,
          deliveryAddress: data.deliveryAddress,
          deliveryDate: data.deliveryDate,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          grandTotal: totals.grandTotal,
          notes: data.notes,
          status: data.status,
          items: {
            create: totals.items.map((item) => ({
              itemCode: item.itemCode,
              quantity: item.quantity,
              reservedQty: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              subtotal: item.subtotal,
              notes: item.notes,
            })),
          },
        },
      }),
    ])
  } catch (error) {
    // Release newly reserved stock if update fails
    await releaseStock(
      data.items.map((item) => ({
        itemCode: item.itemCode,
        quantity: item.quantity,
      }))
    )
    // Re-reserve old stock
    await reserveStock(
      existing.items.map((item) => ({
        itemCode: item.itemCode,
        quantity: Number(item.reservedQty),
      }))
    )
    throw error
  }
}

/**
 * Cancel sales order and release stock
 */
export async function cancelSalesOrder(id: string): Promise<void> {
  const existing = await prisma.salesOrder.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existing) {
    throw new Error('Sales Order tidak ditemukan')
  }

  if (existing.status === 'fulfilled' || existing.status === 'cancelled') {
    throw new Error('Order sudah fulfilled atau cancelled')
  }

  // Release stock reservations
  await releaseStock(
    existing.items.map((item) => ({
      itemCode: item.itemCode,
      quantity: Number(item.reservedQty),
    }))
  )

  // Update order status
  await prisma.salesOrder.update({
    where: { id },
    data: { status: 'cancelled' },
  })
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: 'confirmed' | 'processing' | 'partial_fulfilled' | 'fulfilled' | 'cancelled'
): Promise<void> {
  if (status === 'cancelled') {
    await cancelSalesOrder(id)
  } else {
    await prisma.salesOrder.update({
      where: { id },
      data: { status },
    })
  }
}
