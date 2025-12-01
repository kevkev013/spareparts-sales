import { NextRequest, NextResponse } from 'next/server'
import { getBatches, createBatch } from '@/services/batch.service'
import { batchSchema, batchFilterSchema } from '@/validations/batch'

// GET /api/batches - Get all batches with filters
export async function GET(request: NextRequest) {
  try {
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
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}

// POST /api/batches - Create new batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = batchSchema.parse(body)

    // Create batch
    const batch = await createBatch(validatedData)

    return NextResponse.json(batch, { status: 201 })
  } catch (error: any) {
    console.error('Error creating batch:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    )
  }
}
