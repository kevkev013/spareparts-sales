import { NextRequest, NextResponse } from 'next/server'
import { getBatchById, updateBatch, deleteBatch } from '@/services/batch.service'
import { batchSchema } from '@/validations/batch'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/batches/[id] - Get batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('batches.view')
    if (error) return error

    const batch = await getBatchById(params.id)

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(batch)
  } catch (error: any) {
    console.error('Error fetching batch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch' },
      { status: 500 }
    )
  }
}

// PUT /api/batches/[id] - Update batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('batches.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = batchSchema.parse(body)

    // Update batch
    const batch = await updateBatch(params.id, validatedData)

    return NextResponse.json(batch)
  } catch (error: any) {
    console.error('Error updating batch:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update batch' },
      { status: 500 }
    )
  }
}

// DELETE /api/batches/[id] - Delete batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('batches.delete')
    if (error) return error

    await deleteBatch(params.id)

    return NextResponse.json({ message: 'Batch berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting batch:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
