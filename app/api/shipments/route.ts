import { NextRequest, NextResponse } from 'next/server'
import { getShipments, createShipment } from '@/services/shipment.service'
import type { ShipmentFilter } from '@/services/shipment.service'

/**
 * GET /api/shipments
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const filter: ShipmentFilter = {
            search: searchParams.get('search') || undefined,
            customerCode: searchParams.get('customerCode') || undefined,
            status: searchParams.get('status') || undefined,
            dateFrom: searchParams.get('dateFrom')
                ? new Date(searchParams.get('dateFrom')!)
                : undefined,
            dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit')
                ? Math.min(parseInt(searchParams.get('limit')!), 100)
                : 10,
            sortBy: searchParams.get('sortBy') || 'sjDate',
            sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        }

        const result = await getShipments(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error fetching shipments:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/shipments
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Parse date strings to Date objects
        if (body.sjDate) body.sjDate = new Date(body.sjDate)

        const id = await createShipment(body)

        return NextResponse.json({ id, message: 'Shipment created successfully' })
    } catch (error: any) {
        console.error('Error creating shipment:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
