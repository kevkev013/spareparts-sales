import { NextRequest, NextResponse } from 'next/server'
import { getBatches, createBatch } from '@/services/batch.service'
import { batchSchema, batchFilterSchema } from '@/validations/batch'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/batches - Get all batches with filters
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('batches.view')
    if (error) return error

    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const filter = {
      search: searchParams.get('search') || undefined,
      itemCode: searchParams.get('itemCode') || undefined,
      supplier: searchParams.get('supplier') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: (searchParams.get('sortBy') as any) || 'purchaseDate',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Validate filter
    const validatedFilter = batchFilterSchema.parse(filter)

    // Get batches
    const result = await getBatches(validatedFilter)

    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data batch')
  }
}

// POST /api/batches - Create new batch
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('batches.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = batchSchema.parse(body)

    // Create batch
    const batch = await createBatch(validatedData)

    return NextResponse.json(batch, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data batch')
  }
}
