import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import { generateReturnNumber } from '@/services/return.service'

export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('returns.create')
        if (error) return error

        const { returnDate } = await request.json()
        const date = returnDate ? new Date(returnDate) : new Date()

        const returnNumber = await generateReturnNumber(date)

        return NextResponse.json({ returnNumber })
    } catch (error: any) {
        return apiError(error, 'Gagal generate nomor retur')
    }
}
