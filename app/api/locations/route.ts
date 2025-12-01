import { NextRequest, NextResponse } from 'next/server'
import { getLocations, createLocation } from '@/services/location.service'
import { locationSchema, locationFilterSchema } from '@/validations/location'

// GET /api/locations - Get all locations with filters
export async function GET(request: NextRequest) {
  try {
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
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = locationSchema.parse(body)

    // Create location
    const location = await createLocation(validatedData)

    return NextResponse.json(location, { status: 201 })
  } catch (error: any) {
    console.error('Error creating location:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create location' },
      { status: 500 }
    )
  }
}
