import { NextResponse } from 'next/server'
import { generateCustomerCode } from '@/services/customer.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/customers/generate-code - Generate next customer code
export async function GET() {
  try {
    const { error } = await requireApiPermission('customers.create')
    if (error) return error

    const customerCode = await generateCustomerCode()
    return NextResponse.json({ customerCode })
  } catch (error: any) {
    return apiError(error, 'Gagal generate kode customer')
  }
}
