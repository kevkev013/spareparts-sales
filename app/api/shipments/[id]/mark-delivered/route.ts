import { NextRequest, NextResponse } from 'next/server'
import { markAsDelivered } from '@/services/shipment.service'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await markAsDelivered(params.id)
        return NextResponse.json({ message: 'Shipment marked as delivered' })
    } catch (error: any) {
        console.error('Error marking shipment as delivered:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
