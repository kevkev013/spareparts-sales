import { NextRequest, NextResponse } from 'next/server'
import { getLocations, createLocation } from '@/services/location.service'
import { locationSchema, locationFilterSchema } from '@/validations/location'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/locations - Get all locations with filters
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const filter = {
      search: searchParams.get('search') || undefined,
      warehouse: searchParams.get('warehouse') || undefined,
      zone: searchParams.get('zone') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: (searchParams.get('sortBy') as any) || 'locationCode',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
    }

    // Validate filter
    const validatedFilter = locationFilterSchema.parse(filter)

    // Get locations
    const result = await getLocations(validatedFilter)

    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data lokasi')
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('locations.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = locationSchema.parse(body)

    // Create location
    const location = await createLocation(validatedData)

    return NextResponse.json(location, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data lokasi')
  }
}
