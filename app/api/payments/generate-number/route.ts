import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { generatePaymentNumber } from '@/services/payment.service'

export async function POST(request: NextRequest) {
    try {
        const { error } = await requireApiPermission('payments.create')
        if (error) return error

        const { paymentDate } = await request.json()
        const date = paymentDate ? new Date(paymentDate) : new Date()

        const paymentNumber = await generatePaymentNumber(date)

        return NextResponse.json({ paymentNumber })
    } catch (error: any) {
        console.error('Error generating payment number:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
