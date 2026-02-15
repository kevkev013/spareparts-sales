import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getShipments, createShipment } from '@/services/shipment.service'
import { shipmentSchema, shipmentFilterSchema } from '@/validations/shipment'
import { apiError } from '@/lib/api-error'

/**
 * GET /api/shipments
 */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('shipments.view')
        if (error) return error

        const { searchParams } = new URL(request.url)

        const filter = shipmentFilterSchema.parse({
            search: searchParams.get('search') || undefined,
            customerCode: searchParams.get('customerCode') || undefined,
            status: searchParams.get('status') || undefined,
            dateFrom: searchParams.get('dateFrom') || undefined,
            dateTo: searchParams.get('dateTo') || undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit')
                ? Math.min(parseInt(searchParams.get('limit')!), 100)
                : 10,
            sortBy: searchParams.get('sortBy') || 'sjDate',
            sortOrder: searchParams.get('sortOrder') || 'desc',
        })

        const result = await getShipments(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        return apiError(error, 'Gagal mengambil data pengiriman')
    }
}

/**
 * POST /api/shipments
 */
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('shipments.create')
        if (error) return error

        const body = await request.json()
        const validatedData = shipmentSchema.parse(body)

        const id = await createShipment(validatedData)

        return NextResponse.json({ id, message: 'Shipment created successfully' })
    } catch (error: any) {
        return apiError(error, 'Gagal membuat pengiriman')
    }
}
