import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getPayments, createPayment } from '@/services/payment.service'
import { paymentSchema, paymentFilterSchema } from '@/validations/payment'
import { apiError } from '@/lib/api-error'

/**
 * GET /api/payments
 */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('payments.view')
        if (error) return error

        const { searchParams } = new URL(request.url)

        const filter = paymentFilterSchema.parse({
            search: searchParams.get('search') || undefined,
            customerCode: searchParams.get('customerCode') || undefined,
            dateFrom: searchParams.get('dateFrom') || undefined,
            dateTo: searchParams.get('dateTo') || undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit')
                ? Math.min(parseInt(searchParams.get('limit')!), 100)
                : 10,
            sortBy: searchParams.get('sortBy') || 'paymentDate',
            sortOrder: searchParams.get('sortOrder') || 'desc',
        })

        const result = await getPayments(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        return apiError(error, 'Gagal mengambil data pembayaran')
    }
}

/**
 * POST /api/payments
 */
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('payments.create')
        if (error) return error

        const body = await request.json()
        const validatedData = paymentSchema.parse(body)

        const id = await createPayment(validatedData)

        return NextResponse.json({ id, message: 'Payment created successfully' })
    } catch (error: any) {
        return apiError(error, 'Gagal membuat pembayaran')
    }
}
