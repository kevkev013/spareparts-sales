import { NextResponse } from 'next/server'
import { getBrands } from '@/services/item.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/items/brands - Get all brands
export async function GET() {
  try {
    const { error } = await requireApiPermission('items.view')
    if (error) return error

    const brands = await getBrands()
    return NextResponse.json(brands)
  } catch (error: any) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}
