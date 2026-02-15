import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
import {
  getSalesOrderById,
  updateSalesOrder,
  cancelSalesOrder,
} from '@/services/sales-order.service'
import { salesOrderSchema } from '@/validations/sales-order'

/**
 * GET /api/sales-orders/[id]
 * Get order by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('orders.view')
    if (error) return error

    const order = await getSalesOrderById(params.id)

    if (!order) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data sales order')
  }
}

/**
 * PUT /api/sales-orders/[id]
 * Update order
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('orders.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = salesOrderSchema.parse(body)

    // Update order
    await updateSalesOrder(params.id, validatedData)

    return NextResponse.json({ message: 'Sales order updated successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data sales order')
  }
}

/**
 * DELETE /api/sales-orders/[id]
 * Cancel order (soft delete via status change)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('orders.delete')
    if (error) return error

    await cancelSalesOrder(params.id)

    return NextResponse.json({ message: 'Sales order cancelled successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data sales order')
  }
}
