import { NextRequest, NextResponse } from 'next/server'
import { getItemById, updateItem, deleteItem } from '@/services/item.service'
import { itemSchema } from '@/validations/item'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/items/[id] - Get item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('items.view')
    if (error) return error

    const item = await getItemById(params.id)

    if (!item) {
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data item')
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('items.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = itemSchema.parse(body)

    // Update item
    const item = await updateItem(params.id, validatedData)

    return NextResponse.json(item)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data item')
  }
}

// DELETE /api/items/[id] - Delete item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('items.delete')
    if (error) return error

    await deleteItem(params.id)

    return NextResponse.json({ message: 'Item berhasil dihapus' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data item')
  }
}
