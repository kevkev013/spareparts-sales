import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import { markAsDelivered } from '@/services/shipment.service'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await requireApiPermission('shipments.edit')
        if (error) return error

        await markAsDelivered(params.id)
        return NextResponse.json({ message: 'Shipment marked as delivered' })
    } catch (error: any) {
        return apiError(error, 'Gagal menandai pengiriman selesai')
    }
}
