import { NextResponse } from 'next/server'
import { getZones } from '@/services/location.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/locations/zones - Get all zones
export async function GET() {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const zones = await getZones()
    return NextResponse.json(zones)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data zone')
  }
}
