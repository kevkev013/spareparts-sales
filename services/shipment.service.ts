import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import { Prisma } from '@prisma/client'

export type ShipmentInput = {
    sjNumber?: string
    sjDate: Date
    doId: string
    driverName?: string
    vehicleNumber?: string
    deliveryAddress: string
    recipient?: string
    notes?: string
}

export type ShipmentFilter = {
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
 * Generate Shipment (Surat Jalan) number
 * Format: SJ-YYYYMM-XXXX
 */
export async function generateSjNumber(sjDate: Date): Promise<string> {
    const year = sjDate.getFullYear()
    const month = String(sjDate.getMonth() + 1).padStart(2, '0')
    const period = `${year}${month}`
    const prefix = `${DOC_PREFIX.SHIPMENT}-${period}`

    const lastShipment = await prisma.shipment.findFirst({
        where: {
            sjNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            sjNumber: 'desc',
        },
    })

    let nextNumber = 1
    if (lastShipment) {
        const lastNumber = parseInt(lastShipment.sjNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Get list of shipments
 */
export async function getShipments(filter: ShipmentFilter) {
    const {
        search,
        customerCode,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'sjDate',
        sortOrder = 'desc',
    } = filter

    const skip = (page - 1) * limit

    const where: Prisma.ShipmentWhereInput = {}

    if (search) {
        where.OR = [
            { sjNumber: { contains: search } },
            { doNumber: { contains: search } },
            { soNumber: { contains: search } },
            { customer: { customerName: { contains: search } } },
            { driverName: { contains: search } },
        ]
    }

    if (customerCode) where.customerCode = customerCode
    if (status) where.status = status as any

    if (dateFrom || dateTo) {
        where.sjDate = {}
        if (dateFrom) where.sjDate.gte = dateFrom
        if (dateTo) where.sjDate.lte = dateTo
    }

    const total = await prisma.shipment.count({ where })

    const orderBy: Prisma.ShipmentOrderByWithRelationInput = {}
    orderBy[sortBy] = sortOrder

    const shipments = await prisma.shipment.findMany({
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
        shipments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

/**
 * Get shipment by ID
 */
export async function getShipmentById(id: string) {
    return prisma.shipment.findUnique({
        where: { id },
        include: {
            customer: true,
            deliveryOrder: {
                include: {
                    items: {
                        include: {
                            item: true,
                        },
                    },
                },
            },
        },
    })
}

/**
 * Create shipment from Delivery Order
 */
export async function createShipment(data: ShipmentInput) {
    // Check DO
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
        where: { id: data.doId },
    })

    if (!deliveryOrder) {
        throw new Error('Delivery Order tidak ditemukan')
    }

    if (deliveryOrder.status !== 'picked') {
        throw new Error('Delivery Order harus dalam status picked')
    }

    // Generate SJ number if not provided
    const sjNumber = data.sjNumber || (await generateSjNumber(data.sjDate))

    // Create Shipment
    const shipment = await prisma.shipment.create({
        data: {
            sjNumber,
            sjDate: data.sjDate,
            doId: data.doId,
            doNumber: deliveryOrder.doNumber,
            soId: deliveryOrder.soId,
            soNumber: deliveryOrder.soNumber,
            customerCode: deliveryOrder.customerCode,
            driverName: data.driverName,
            vehicleNumber: data.vehicleNumber,
            deliveryAddress: data.deliveryAddress,
            recipient: data.recipient,
            notes: data.notes,
            status: 'in_transit',
        },
    })

    // Update DO status
    await prisma.deliveryOrder.update({
        where: { id: data.doId },
        data: { status: 'shipped' },
    })

    return shipment.id
}

/**
 * Mark shipment as delivered
 */
export async function markAsDelivered(id: string, deliveredAt: Date = new Date()) {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
    })

    if (!shipment) {
        throw new Error('Shipment tidak ditemukan')
    }

    if (shipment.status === 'delivered') {
        throw new Error('Shipment sudah delivered')
    }

    await prisma.shipment.update({
        where: { id },
        data: {
            status: 'delivered',
            deliveredAt,
        },
    })
}
