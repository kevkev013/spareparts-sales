import { NextResponse } from 'next/server'
import { getCities } from '@/services/customer.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/customers/cities - Get all cities
export async function GET() {
  try {
    const { error } = await requireApiPermission('customers.view')
    if (error) return error

    const cities = await getCities()
    return NextResponse.json(cities)
  } catch (error: any) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cities' },
      { status: 500 }
    )
  }
}
