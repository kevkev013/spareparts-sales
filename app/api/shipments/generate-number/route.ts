import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import { generateSjNumber } from '@/services/shipment.service'

export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('shipments.create')
        if (error) return error

        const { sjDate } = await request.json()
        const date = sjDate ? new Date(sjDate) : new Date()

        const sjNumber = await generateSjNumber(date)

        return NextResponse.json({ sjNumber })
    } catch (error: any) {
        return apiError(error, 'Gagal generate nomor surat jalan')
    }
}
