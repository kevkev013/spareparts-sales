import { NextRequest, NextResponse } from 'next/server'
import { getLocationById, updateLocation, deleteLocation } from '@/services/location.service'
import { locationSchema } from '@/validations/location'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/locations/[id] - Get location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const location = await getLocationById(params.id)

    if (!location) {
      return NextResponse.json(
        { error: 'Lokasi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error: any) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('locations.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = locationSchema.parse(body)

    // Update location
    const location = await updateLocation(params.id, validatedData)

    return NextResponse.json(location)
  } catch (error: any) {
    console.error('Error updating location:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[id] - Delete location (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('locations.delete')
    if (error) return error

    await deleteLocation(params.id)

    return NextResponse.json({ message: 'Lokasi berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete location' },
      { status: 500 }
    )
  }
}
