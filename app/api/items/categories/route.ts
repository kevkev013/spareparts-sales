import { NextResponse } from 'next/server'
import { getCategories } from '@/services/item.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/items/categories - Get all categories
export async function GET() {
  try {
    const { error } = await requireApiPermission('items.view')
    if (error) return error

    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data kategori')
  }
}
