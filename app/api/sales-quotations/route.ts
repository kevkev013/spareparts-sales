import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import {
  getSalesQuotations,
  createSalesQuotation,
} from '@/services/sales-quotation.service'
import { salesQuotationSchema } from '@/validations/sales-quotation'
import type { SalesQuotationFilter } from '@/types/sales-quotation'

/**
 * GET /api/sales-quotations
 * Get list of sales quotations with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('quotations.view')
    if (error) return error

    const { searchParams } = new URL(request.url)

    const filter: SalesQuotationFilter = {
      search: searchParams.get('search') || undefined,
      customerCode: searchParams.get('customerCode') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? Math.min(parseInt(searchParams.get('limit')!), 100)
        : 10,
      sortBy: (searchParams.get('sortBy') as any) || 'sqDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    const result = await getSalesQuotations(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching sales quotations:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/sales-quotations
 * Create new sales quotation
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('quotations.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = salesQuotationSchema.parse(body)

    // Create quotation
    const id = await createSalesQuotation(validatedData)

    return NextResponse.json({ id, message: 'Sales quotation created successfully' })
  } catch (error: any) {
    console.error('Error creating sales quotation:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
