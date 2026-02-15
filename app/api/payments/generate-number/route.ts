import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
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
        return apiError(error, 'Gagal generate nomor pembayaran')
    }
}
