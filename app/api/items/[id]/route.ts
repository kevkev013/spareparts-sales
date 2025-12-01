import { NextRequest, NextResponse } from 'next/server'
import { getItemById, updateItem, deleteItem } from '@/services/item.service'
import { itemSchema } from '@/validations/item'

// GET /api/items/[id] - Get item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await getItemById(params.id)

    if (!item) {
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = itemSchema.parse(body)

    // Update item
    const item = await updateItem(params.id, validatedData)

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error updating item:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteItem(params.id)

    return NextResponse.json({ message: 'Item berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    )
  }
}
