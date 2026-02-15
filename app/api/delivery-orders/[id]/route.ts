import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import {
  getDeliveryOrderById,
  completePicking,
  markAsShipped,
} from '@/services/delivery-order.service'

/**
 * GET /api/delivery-orders/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('delivery_orders.view')
    if (error) return error

    const deliveryOrder = await getDeliveryOrderById(params.id)

    if (!deliveryOrder) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 })
    }

    return NextResponse.json(deliveryOrder)
  } catch (error: any) {
    console.error('Error fetching delivery order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
