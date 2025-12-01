import { NextResponse } from 'next/server'
import { generateCustomerCode } from '@/services/customer.service'

// GET /api/customers/generate-code - Generate next customer code
export async function GET() {
  try {
    const customerCode = await generateCustomerCode()
    return NextResponse.json({ customerCode })
  } catch (error: any) {
    console.error('Error generating customer code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate customer code' },
      { status: 500 }
    )
  }
}
