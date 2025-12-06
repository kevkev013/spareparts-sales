import { NextRequest, NextResponse } from 'next/server'
import { completePicking } from '@/services/delivery-order.service'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await completePicking(params.id)
        return NextResponse.json({ message: 'Picking completed successfully' })
    } catch (error: any) {
        console.error('Error completing picking:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
