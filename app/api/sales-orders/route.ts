import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
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
      sortBy: (searchParams.get('sortBy') as any) || 'soDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    const result = await getSalesOrders(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching sales orders:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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
    console.error('Error creating sales order:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
