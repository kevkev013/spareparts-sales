import { NextRequest, NextResponse } from 'next/server'
import { getItems, createItem, generateItemCode } from '@/services/item.service'
import { itemSchema, itemFilterSchema } from '@/validations/item'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/items - Get all items with filters
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('items.view')
    if (error) return error

    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const filter = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Validate filter
    const validatedFilter = itemFilterSchema.parse(filter)

    // Get items
    const result = await getItems(validatedFilter)

    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data item')
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('items.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = itemSchema.parse(body)

    // Create item
    const item = await createItem(validatedData)

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data item')
  }
}
