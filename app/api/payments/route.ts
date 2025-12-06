import { NextRequest, NextResponse } from 'next/server'
import { getPayments, createPayment } from '@/services/payment.service'
import type { PaymentFilter } from '@/services/payment.service'

/**
 * GET /api/payments
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const filter: PaymentFilter = {
            search: searchParams.get('search') || undefined,
            customerCode: searchParams.get('customerCode') || undefined,
            dateFrom: searchParams.get('dateFrom')
                ? new Date(searchParams.get('dateFrom')!)
                : undefined,
            dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit')
                ? Math.min(parseInt(searchParams.get('limit')!), 100)
                : 10,
            sortBy: searchParams.get('sortBy') || 'paymentDate',
            sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        }

        const result = await getPayments(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error fetching payments:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/payments
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Parse date strings to Date objects
        if (body.paymentDate) body.paymentDate = new Date(body.paymentDate)

        const id = await createPayment(body)

        return NextResponse.json({ id, message: 'Payment created successfully' })
    } catch (error: any) {
        console.error('Error creating payment:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
