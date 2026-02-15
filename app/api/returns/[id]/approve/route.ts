import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { approveReturn } from '@/services/return.service'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await requireApiPermission('returns.approve')
        if (error) return error

        await approveReturn(params.id)
        return NextResponse.json({ message: 'Return approved successfully' })
    } catch (error: any) {
        console.error('Error approving return:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
