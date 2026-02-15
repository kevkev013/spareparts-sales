import { NextResponse } from 'next/server'
import { getBrands } from '@/services/item.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/items/brands - Get all brands
export async function GET() {
  try {
    const { error } = await requireApiPermission('items.view')
    if (error) return error

    const brands = await getBrands()
    return NextResponse.json(brands)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data brand')
  }
}
