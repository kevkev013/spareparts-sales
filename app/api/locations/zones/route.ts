import { NextResponse } from 'next/server'
import { getZones } from '@/services/location.service'

// GET /api/locations/zones - Get all zones
export async function GET() {
  try {
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
