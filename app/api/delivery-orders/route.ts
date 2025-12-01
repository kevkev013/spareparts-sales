import { NextRequest, NextResponse } from 'next/server'
import { getDeliveryOrders, createDeliveryOrder } from '@/services/delivery-order.service'
import type { DeliveryOrderFilter } from '@/types/delivery-order'

/**
 * GET /api/delivery-orders
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filter: DeliveryOrderFilter = {
      search: searchParams.get('search') || undefined,
      soNumber: searchParams.get('soNumber') || undefined,
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
      sortBy: (searchParams.get('sortBy') as any) || 'doDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    const result = await getDeliveryOrders(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching delivery orders:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/delivery-orders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { soId, pickerName } = body

    if (!soId) {
      return NextResponse.json({ error: 'soId is required' }, { status: 400 })
    }

    const id = await createDeliveryOrder(soId, pickerName)

    return NextResponse.json({ id, message: 'Delivery order created successfully' })
  } catch (error: any) {
    console.error('Error creating delivery order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
