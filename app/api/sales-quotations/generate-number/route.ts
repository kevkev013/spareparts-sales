import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import { generateSqNumber } from '@/services/sales-quotation.service'

/**
 * POST /api/sales-quotations/generate-number
 * Generate next SQ number for a given date
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('quotations.create')
    if (error) return error

    const body = await request.json()
    const { sqDate } = body

    if (!sqDate) {
      return NextResponse.json({ error: 'sqDate is required' }, { status: 400 })
    }

    const date = new Date(sqDate)
    const sqNumber = await generateSqNumber(date)

    return NextResponse.json({ sqNumber })
  } catch (error: any) {
    return apiError(error, 'Gagal generate nomor quotation')
  }
}
