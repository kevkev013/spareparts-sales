import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import { Prisma } from '@prisma/client'
import { recordPayment as updateInvoicePayment } from './invoice.service'

export type PaymentInput = {
    paymentNumber?: string
    paymentDate: Date
    invoiceId: string
    amount: number
    paymentMethod: 'cash' | 'transfer' | 'check' | 'giro' | 'credit_card' | 'other'
    referenceNumber?: string
    notes?: string
}

export type PaymentFilter = {
    search?: string
    customerCode?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

/**
 * Generate Payment number
 * Format: PAY-YYYYMM-XXXX
 */
export async function generatePaymentNumber(paymentDate: Date): Promise<string> {
    const year = paymentDate.getFullYear()
    const month = String(paymentDate.getMonth() + 1).padStart(2, '0')
    const period = `${year}${month}`
    const prefix = `${DOC_PREFIX.PAYMENT || 'PAY'}-${period}`

    const lastPayment = await prisma.payment.findFirst({
        where: {
            paymentNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            paymentNumber: 'desc',
        },
    })

    let nextNumber = 1
    if (lastPayment) {
        const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Get list of payments
 */
export async function getPayments(filter: PaymentFilter) {
    const {
        search,
        customerCode,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'paymentDate',
        sortOrder = 'desc',
    } = filter

    const skip = (page - 1) * limit

    const where: Prisma.PaymentWhereInput = {}

    if (search) {
        where.OR = [
            { paymentNumber: { contains: search } },
            { invoiceNumber: { contains: search } },
            { customer: { customerName: { contains: search } } },
            { referenceNumber: { contains: search } },
        ]
    }

    if (customerCode) where.customerCode = customerCode

    if (dateFrom || dateTo) {
        where.paymentDate = {}
        if (dateFrom) where.paymentDate.gte = dateFrom
        if (dateTo) where.paymentDate.lte = dateTo
    }

    const total = await prisma.payment.count({ where })

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {}
    orderBy[sortBy] = sortOrder

    const payments = await prisma.payment.findMany({
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
        },
    })

    return {
        payments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

/**
 * Create payment
 */
export async function createPayment(data: PaymentInput) {
    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
    })

    if (!invoice) {
        throw new Error('Invoice tidak ditemukan')
    }

    // Generate payment number if not provided
    const paymentNumber = data.paymentNumber || (await generatePaymentNumber(data.paymentDate))

    // Create payment record
    const payment = await prisma.payment.create({
        data: {
            paymentNumber,
            paymentDate: data.paymentDate,
            invoiceId: data.invoiceId,
            invoiceNumber: invoice.invNumber,
            customerCode: invoice.customerCode,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
        },
    })

    // Update invoice status and paid amount
    await updateInvoicePayment(data.invoiceId, data.amount)

    return payment.id
}
