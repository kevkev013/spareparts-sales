import { NextResponse } from 'next/server'
import { getCities } from '@/services/customer.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/customers/cities - Get all cities
export async function GET() {
  try {
    const { error } = await requireApiPermission('customers.view')
    if (error) return error

    const cities = await getCities()
    return NextResponse.json(cities)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data kota')
  }
}
