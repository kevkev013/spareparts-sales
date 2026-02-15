import { NextRequest, NextResponse } from 'next/server'
import { generateBatchNumber } from '@/services/batch.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// POST /api/batches/generate-number - Generate batch number for a date
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('batches.create')
    if (error) return error

    const body = await request.json()
    const { purchaseDate } = body

    if (!purchaseDate) {
      return NextResponse.json(
        { error: 'Purchase date is required' },
        { status: 400 }
      )
    }

    const batchNumber = await generateBatchNumber(new Date(purchaseDate))
    return NextResponse.json({ batchNumber })
  } catch (error: any) {
    return apiError(error, 'Gagal generate nomor batch')
  }
}
