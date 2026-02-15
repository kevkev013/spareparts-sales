import { NextResponse } from 'next/server'
import { getWarehouses } from '@/services/location.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/locations/warehouses - Get all warehouses
export async function GET() {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const warehouses = await getWarehouses()
    return NextResponse.json(warehouses)
  } catch (error: any) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}
