import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import { getSalesOrders, createSalesOrder } from '@/services/sales-order.service'
import { salesOrderSchema } from '@/validations/sales-order'
import type { SalesOrderFilter } from '@/types/sales-order'

/**
 * GET /api/sales-orders
 * Get list of sales orders with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('orders.view')
    if (error) return error

    const { searchParams } = new URL(request.url)

    const filter: SalesOrderFilter = {
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
      sortBy: (['soDate', 'soNumber', 'customerCode', 'grandTotal', 'status', 'createdAt'].includes(searchParams.get('sortBy') || '')
        ? searchParams.get('sortBy')
        : 'soDate') as SalesOrderFilter['sortBy'],
      sortOrder: (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    }

    const result = await getSalesOrders(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data sales order')
  }
}

/**
 * POST /api/sales-orders
 * Create new sales order
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('orders.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = salesOrderSchema.parse(body)

    // Create order
    const id = await createSalesOrder(validatedData)

    return NextResponse.json({ id, message: 'Sales order created successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data sales order')
  }
}
