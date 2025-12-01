import { NextRequest, NextResponse } from 'next/server'
import { generateSoNumber } from '@/services/sales-order.service'

/**
 * POST /api/sales-orders/generate-number
 * Generate next SO number for a given date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { soDate } = body

    if (!soDate) {
      return NextResponse.json({ error: 'soDate is required' }, { status: 400 })
    }

    const date = new Date(soDate)
    const soNumber = await generateSoNumber(date)

    return NextResponse.json({ soNumber })
  } catch (error: any) {
    console.error('Error generating SO number:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
