import { NextResponse } from 'next/server'
import { getZones } from '@/services/location.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/locations/zones - Get all zones
export async function GET() {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const zones = await getZones()
    return NextResponse.json(zones)
  } catch (error: any) {
    console.error('Error fetching zones:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch zones' },
      { status: 500 }
    )
  }
}
