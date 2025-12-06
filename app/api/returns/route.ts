import { NextRequest, NextResponse } from 'next/server'
import { getReturns, createReturn } from '@/services/return.service'
import type { ReturnFilter } from '@/services/return.service'

/**
 * GET /api/returns
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const filter: ReturnFilter = {
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
            sortBy: searchParams.get('sortBy') || 'returnDate',
            sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        }

        const result = await getReturns(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error fetching returns:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/returns
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Parse date strings to Date objects
        if (body.returnDate) body.returnDate = new Date(body.returnDate)

        const id = await createReturn(body)

        return NextResponse.json({ id, message: 'Return created successfully' })
    } catch (error: any) {
        console.error('Error creating return:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
