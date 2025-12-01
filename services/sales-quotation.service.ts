import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import type {
  SalesQuotationInput,
  SalesQuotationFilter,
  SalesQuotationsResponse,
  SalesQuotationWithRelations,
} from '@/types/sales-quotation'
import { Prisma } from '@prisma/client'

/**
 * Generate Sales Quotation number
 * Format: SQ-YYYYMM-XXXX (e.g., SQ-202501-0001)
 */
export async function generateSqNumber(sqDate: Date): Promise<string> {
  const year = sqDate.getFullYear()
  const month = String(sqDate.getMonth() + 1).padStart(2, '0')
  const period = `${year}${month}`
  const prefix = `${DOC_PREFIX.SALES_QUOTATION}-${period}`

  // Get the last quotation number for this period
  const lastQuotation = await prisma.salesQuotation.findFirst({
    where: {
      sqNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      sqNumber: 'desc',
    },
  })

  let nextNumber = 1
  if (lastQuotation) {
    const lastNumber = parseInt(lastQuotation.sqNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Calculate totals for quotation
 */
function calculateTotals(items: SalesQuotationInput['items'], taxRate: number = 0) {
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
 * Get list of quotations with filters and pagination
 */
export async function getSalesQuotations(
  filter: SalesQuotationFilter
): Promise<SalesQuotationsResponse> {
  const {
    search,
    customerCode,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'sqDate',
    sortOrder = 'desc',
  } = filter

  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.SalesQuotationWhereInput = {}

  if (search) {
    where.OR = [
      { sqNumber: { contains: search } },
      { customer: { customerName: { contains: search } } },
      { notes: { contains: search } },
    ]
  }

  if (customerCode) {
    where.customerCode = customerCode
  }

  if (status) {
    where.status = status as any
  }

  if (dateFrom || dateTo) {
    where.sqDate = {}
    if (dateFrom) where.sqDate.gte = dateFrom
    if (dateTo) where.sqDate.lte = dateTo
  }

  // Get total count
  const total = await prisma.salesQuotation.count({ where })

  // Build order by
  const orderBy: Prisma.SalesQuotationOrderByWithRelationInput = {}
  if (sortBy === 'customerName') {
    orderBy.customer = { customerName: sortOrder }
  } else {
    orderBy[sortBy] = sortOrder
  }

  // Get quotations
  const quotations = await prisma.salesQuotation.findMany({
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
  const formattedQuotations = quotations.map((q) => ({
    id: q.id,
    sqNumber: q.sqNumber,
    sqDate: q.sqDate,
    customerCode: q.customerCode,
    customerName: q.customer.customerName,
    validUntil: q.validUntil,
    grandTotal: q.grandTotal,
    status: q.status,
    convertedToSo: q.convertedToSo,
    soNumber: q.soNumber,
    itemCount: q.items.length,
  }))

  return {
    quotations: formattedQuotations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get quotation by ID with full details
 */
export async function getSalesQuotationById(
  id: string
): Promise<SalesQuotationWithRelations | null> {
  const quotation = await prisma.salesQuotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          customerCode: true,
          customerName: true,
          customerType: true,
          phone: true,
          email: true,
          discountRate: true,
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

  return quotation
}

/**
 * Create new sales quotation
 */
export async function createSalesQuotation(data: SalesQuotationInput): Promise<string> {
  // Generate SQ number if not provided
  const sqNumber = data.sqNumber || (await generateSqNumber(data.sqDate))

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

  // Create quotation with items
  const quotation = await prisma.salesQuotation.create({
    data: {
      sqNumber,
      sqDate: data.sqDate,
      customerCode: data.customerCode,
      validUntil: data.validUntil,
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

  return quotation.id
}

/**
 * Update sales quotation
 */
export async function updateSalesQuotation(
  id: string,
  data: SalesQuotationInput
): Promise<void> {
  // Check if quotation exists and not converted
  const existing = await prisma.salesQuotation.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('Sales Quotation tidak ditemukan')
  }

  if (existing.convertedToSo) {
    throw new Error('Tidak dapat mengubah quotation yang sudah dikonversi ke SO')
  }

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

  // Update quotation in transaction
  await prisma.$transaction([
    // Delete existing items
    prisma.salesQuotationItem.deleteMany({
      where: { sqId: id },
    }),
    // Update quotation with new items
    prisma.salesQuotation.update({
      where: { id },
      data: {
        sqDate: data.sqDate,
        customerCode: data.customerCode,
        validUntil: data.validUntil,
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
}

/**
 * Delete sales quotation
 */
export async function deleteSalesQuotation(id: string): Promise<void> {
  // Check if quotation exists and not converted
  const existing = await prisma.salesQuotation.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('Sales Quotation tidak ditemukan')
  }

  if (existing.convertedToSo) {
    throw new Error('Tidak dapat menghapus quotation yang sudah dikonversi ke SO')
  }

  // Delete quotation (items will be cascaded)
  await prisma.salesQuotation.delete({
    where: { id },
  })
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
  id: string,
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
): Promise<void> {
  await prisma.salesQuotation.update({
    where: { id },
    data: { status },
  })
}
