import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'

/**
 * Generate Invoice number
 * Format: INV-YYYYMM-XXXX (e.g., INV-202501-0001)
 */
export async function generateInvNumber(invDate: Date): Promise<string> {
  const year = invDate.getFullYear()
  const month = String(invDate.getMonth() + 1).padStart(2, '0')
  const period = `${year}${month}`
  const prefix = `${DOC_PREFIX.INVOICE}-${period}`

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Calculate HPP (Harga Pokok Penjualan) from delivered items
 * Uses purchase price from batches that were picked in DO
 */
async function calculateHPP(soId: string) {
  // Get all delivery orders for this SO
  const deliveryOrders = await prisma.deliveryOrder.findMany({
    where: { soId },
    include: {
      items: {
        include: {
          batch: true,
        },
      },
    },
  })

  const hppByItem: Record<string, { totalHpp: number; totalQty: number }> = {}

  for (const d of deliveryOrders) {
    for (const item of d.items) {
      const itemCode = item.itemCode
      const pickedQty = Number(item.pickedQty)
      const purchasePrice = Number(item.batch.purchasePrice)
      const hpp = pickedQty * purchasePrice

      if (!hppByItem[itemCode]) {
        hppByItem[itemCode] = { totalHpp: 0, totalQty: 0 }
      }

      hppByItem[itemCode].totalHpp += hpp
      hppByItem[itemCode].totalQty += pickedQty
    }
  }

  return hppByItem
}

/**
 * Create invoice from Sales Order
 */
export async function createInvoice(soId: string, creditTerm?: number): Promise<string> {
  // Get SO details
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: soId },
    include: {
      customer: true,
      items: true,
    },
  })

  if (!salesOrder) {
    throw new Error('Sales Order tidak ditemukan')
  }

  if (salesOrder.status !== 'fulfilled' && salesOrder.status !== 'partial_fulfilled') {
    throw new Error('Sales Order harus sudah fulfilled atau partial fulfilled')
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: { soId },
  })

  if (existingInvoice) {
    throw new Error('Invoice untuk SO ini sudah dibuat')
  }

  // Calculate HPP
  const hppByItem = await calculateHPP(soId)

  // Get customer credit term
  const term = creditTerm || salesOrder.customer.creditTerm

  // Generate invoice number
  const invNumber = await generateInvNumber(new Date())
  const invDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + term)

  // Calculate totals and HPP
  let totalHpp = 0
  const invoiceItems = salesOrder.items.map((item) => {
    const itemCode = item.itemCode
    const quantity = Number(item.fulfilledQty) // Use fulfilled qty
    const unitPrice = Number(item.unitPrice)
    const discountPercent = Number(item.discountPercent)

    const itemSubtotal = quantity * unitPrice
    const discountAmount = (itemSubtotal * discountPercent) / 100
    const subtotal = itemSubtotal - discountAmount

    // Get HPP for this item
    const itemHppData = hppByItem[itemCode]
    const avgHpp = itemHppData ? itemHppData.totalHpp / itemHppData.totalQty : 0
    const itemHpp = quantity * avgHpp
    const profit = subtotal - itemHpp

    totalHpp += itemHpp

    return {
      itemCode,
      quantity,
      unit: item.unit,
      unitPrice,
      discountPercent,
      discountAmount,
      subtotal,
      hpp: itemHpp,
      profit,
    }
  })

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = invoiceItems.reduce((sum, item) => sum + item.discountAmount, 0)

  // Get tax
  let taxAmount = 0
  if (salesOrder.customer.isTaxable) {
    const defaultTax = await prisma.taxMaster.findFirst({
      where: { isDefault: true, isActive: true },
    })
    if (defaultTax) {
      taxAmount = (subtotal * Number(defaultTax.taxRate)) / 100
    }
  }

  const grandTotal = subtotal + taxAmount
  const profit = subtotal - totalHpp
  const profitMargin = subtotal > 0 ? (profit / subtotal) * 100 : 0

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invNumber,
      invDate,
      dueDate,
      soId,
      soNumber: salesOrder.soNumber,
      customerCode: salesOrder.customerCode,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      hpp: totalHpp,
      profit,
      profitMargin,
      paidAmount: 0,
      remainingAmount: grandTotal,
      status: 'unpaid',
      items: {
        create: invoiceItems,
      },
    },
  })

  return invoice.id
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
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
        },
      },
      salesOrder: {
        select: {
          soNumber: true,
          soDate: true,
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
        },
      },
    },
  })
}

/**
 * Get list of invoices
 */
export async function getInvoices(filter: any = {}) {
  const {
    search,
    customerCode,
    status,
    page = 1,
    limit = 10,
    sortBy = 'invDate',
    sortOrder = 'desc',
  } = filter

  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { invNumber: { contains: search } },
      { soNumber: { contains: search } },
      { customer: { customerName: { contains: search } } },
    ]
  }

  if (customerCode) where.customerCode = customerCode
  if (status) where.status = status

  const total = await prisma.invoice.count({ where })

  const invoices = await prisma.invoice.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      customer: {
        select: {
          customerCode: true,
          customerName: true,
        },
      },
    },
  })

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Record payment for invoice
 */
export async function recordPayment(id: string, amount: number): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
  })

  if (!invoice) {
    throw new Error('Invoice tidak ditemukan')
  }

  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    throw new Error('Invoice sudah lunas atau dibatalkan')
  }

  const newPaidAmount = Number(invoice.paidAmount) + amount
  const newRemainingAmount = Number(invoice.grandTotal) - newPaidAmount

  let newStatus: 'unpaid' | 'partial_paid' | 'paid' = 'unpaid'
  if (newRemainingAmount <= 0) {
    newStatus = 'paid'
  } else if (newPaidAmount > 0) {
    newStatus = 'partial_paid'
  }

  await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0,
      status: newStatus,
    },
  })
}
