import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getReturns, createReturn } from '@/services/return.service'
import { returnSchema, returnFilterSchema } from '@/validations/return'
import { apiError } from '@/lib/api-error'

/**
 * GET /api/returns
 */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('returns.view')
        if (error) return error

        const { searchParams } = new URL(request.url)

        const filter = returnFilterSchema.parse({
            search: searchParams.get('search') || undefined,
            customerCode: searchParams.get('customerCode') || undefined,
            status: searchParams.get('status') || undefined,
            dateFrom: searchParams.get('dateFrom') || undefined,
            dateTo: searchParams.get('dateTo') || undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit')
                ? Math.min(parseInt(searchParams.get('limit')!), 100)
                : 10,
            sortBy: searchParams.get('sortBy') || 'returnDate',
            sortOrder: searchParams.get('sortOrder') || 'desc',
        })

        const result = await getReturns(filter)
        return NextResponse.json(result)
    } catch (error: any) {
        return apiError(error, 'Gagal mengambil data retur')
    }
}

/**
 * POST /api/returns
 */
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('returns.create')
        if (error) return error

        const body = await request.json()
        const validatedData = returnSchema.parse(body)

        const id = await createReturn(validatedData)

        return NextResponse.json({ id, message: 'Return created successfully' })
    } catch (error: any) {
        return apiError(error, 'Gagal membuat retur')
    }
}
