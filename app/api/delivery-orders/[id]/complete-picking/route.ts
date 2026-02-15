import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { completePicking } from '@/services/delivery-order.service'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await requireApiPermission('delivery_orders.edit')
        if (error) return error

        await completePicking(params.id)
        return NextResponse.json({ message: 'Picking completed successfully' })
    } catch (error: any) {
        console.error('Error completing picking:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
