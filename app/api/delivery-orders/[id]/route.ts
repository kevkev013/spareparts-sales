import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
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
    return apiError(error, 'Gagal memproses delivery order')
  }
}
