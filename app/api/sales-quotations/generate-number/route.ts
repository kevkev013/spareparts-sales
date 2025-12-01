import { NextRequest, NextResponse } from 'next/server'
import { generateSqNumber } from '@/services/sales-quotation.service'

/**
 * POST /api/sales-quotations/generate-number
 * Generate next SQ number for a given date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sqDate } = body

    if (!sqDate) {
      return NextResponse.json({ error: 'sqDate is required' }, { status: 400 })
    }

    const date = new Date(sqDate)
    const sqNumber = await generateSqNumber(date)

    return NextResponse.json({ sqNumber })
  } catch (error: any) {
    console.error('Error generating SQ number:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
