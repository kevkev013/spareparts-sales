import { NextRequest, NextResponse } from 'next/server'
import { getBatchById, updateBatch, deleteBatch } from '@/services/batch.service'
import { batchSchema } from '@/validations/batch'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

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
    return apiError(error, 'Gagal memproses data batch')
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
    return apiError(error, 'Gagal memproses data batch')
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
    return apiError(error, 'Gagal memproses data batch')
  }
}
