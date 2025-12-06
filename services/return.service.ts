import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import { Prisma } from '@prisma/client'

export type ReturnItemInput = {
    itemCode: string
    quantity: number
    unit: string
    condition?: string
    notes?: string
}

export type ReturnInput = {
    returnNumber?: string
    returnDate: Date
    soId?: string
    customerCode: string
    reason?: string
    items: ReturnItemInput[]
}

export type ReturnFilter = {
    search?: string
    customerCode?: string
    status?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

/**
 * Generate Return number
 * Format: RET-YYYYMM-XXXX
 */
export async function generateReturnNumber(returnDate: Date): Promise<string> {
    const year = returnDate.getFullYear()
    const month = String(returnDate.getMonth() + 1).padStart(2, '0')
    const period = `${year}${month}`
    const prefix = `${DOC_PREFIX.RETURN || 'RET'}-${period}`

    const lastReturn = await prisma.return.findFirst({
        where: {
            returnNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            returnNumber: 'desc',
        },
    })

    let nextNumber = 1
    if (lastReturn) {
        const lastNumber = parseInt(lastReturn.returnNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Get list of returns
 */
export async function getReturns(filter: ReturnFilter) {
    const {
        search,
        customerCode,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'returnDate',
        sortOrder = 'desc',
    } = filter

    const skip = (page - 1) * limit

    const where: Prisma.ReturnWhereInput = {}

    if (search) {
        where.OR = [
            { returnNumber: { contains: search } },
            { soNumber: { contains: search } },
            { customer: { customerName: { contains: search } } },
        ]
    }

    if (customerCode) where.customerCode = customerCode
    if (status) where.status = status as any

    if (dateFrom || dateTo) {
        where.returnDate = {}
        if (dateFrom) where.returnDate.gte = dateFrom
        if (dateTo) where.returnDate.lte = dateTo
    }

    const total = await prisma.return.count({ where })

    const orderBy: Prisma.ReturnOrderByWithRelationInput = {}
    orderBy[sortBy] = sortOrder

    const returns = await prisma.return.findMany({
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
            items: true,
        },
    })

    return {
        returns,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

/**
 * Create return
 */
export async function createReturn(data: ReturnInput) {
    // Generate return number if not provided
    const returnNumber = data.returnNumber || (await generateReturnNumber(data.returnDate))

    // Get SO details if provided
    let soNumber = null
    if (data.soId) {
        const so = await prisma.salesOrder.findUnique({
            where: { id: data.soId },
        })
        if (so) soNumber = so.soNumber
    }

    // Create return record
    const returnRecord = await prisma.return.create({
        data: {
            returnNumber,
            returnDate: data.returnDate,
            soId: data.soId,
            soNumber,
            customerCode: data.customerCode,
            reason: data.reason,
            status: 'pending',
            items: {
                create: data.items.map((item) => ({
                    itemCode: item.itemCode,
                    quantity: item.quantity,
                    unit: item.unit,
                    condition: item.condition,
                    notes: item.notes,
                })),
            },
        },
    })

    return returnRecord.id
}

/**
 * Get return by ID
 */
export async function getReturnById(id: string) {
    return prisma.return.findUnique({
        where: { id },
        include: {
            customer: true,
            items: {
                include: {
                    item: true,
                },
            },
        },
    })
}

/**
 * Approve return (restock items)
 */
export async function approveReturn(id: string) {
    const returnRecord = await prisma.return.findUnique({
        where: { id },
        include: { items: true },
    })

    if (!returnRecord) {
        throw new Error('Return not found')
    }

    if (returnRecord.status !== 'pending') {
        throw new Error('Return must be pending to approve')
    }

    // Update status
    await prisma.return.update({
        where: { id },
        data: { status: 'approved' },
    })

    // In a real app, you might want to increase stock here
    // But for now we just mark it as approved
}

/**
 * Reject return
 */
export async function rejectReturn(id: string) {
    const returnRecord = await prisma.return.findUnique({
        where: { id },
    })

    if (!returnRecord) {
        throw new Error('Return not found')
    }

    if (returnRecord.status !== 'pending') {
        throw new Error('Return must be pending to reject')
    }

    await prisma.return.update({
        where: { id },
        data: { status: 'rejected' },
    })
}
