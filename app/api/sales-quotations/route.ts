import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
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
      sortBy: (['sqDate', 'sqNumber', 'customerCode', 'grandTotal', 'status', 'createdAt'].includes(searchParams.get('sortBy') || '')
        ? searchParams.get('sortBy')
        : 'sqDate') as SalesQuotationFilter['sortBy'],
      sortOrder: (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    }

    const result = await getSalesQuotations(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data quotation')
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
    return apiError(error, 'Gagal memproses data quotation')
  }
}
