import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
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
    console.error('Error fetching sales order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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
    console.error('Error updating sales order:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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
    console.error('Error cancelling sales order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
