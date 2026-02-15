import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getDeliveryOrders, createDeliveryOrder } from '@/services/delivery-order.service'
import { apiError } from '@/lib/api-error'
import { z } from 'zod'

const doFilterSchema = z.object({
  search: z.string().optional(),
  soNumber: z.string().optional(),
  customerCode: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['doDate', 'doNumber', 'soNumber', 'status', 'createdAt']).optional().default('doDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const createDoSchema = z.object({
  soId: z.string().uuid('Sales Order ID tidak valid'),
  pickerName: z.string().min(1).max(255).optional(),
})

/**
 * GET /api/delivery-orders
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('delivery_orders.view')
    if (error) return error

    const { searchParams } = new URL(request.url)

    const filter = doFilterSchema.parse({
      search: searchParams.get('search') || undefined,
      soNumber: searchParams.get('soNumber') || undefined,
      customerCode: searchParams.get('customerCode') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? Math.min(parseInt(searchParams.get('limit')!), 100)
        : 10,
      sortBy: searchParams.get('sortBy') || 'doDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    const result = await getDeliveryOrders(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data delivery order')
  }
}

/**
 * POST /api/delivery-orders
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('delivery_orders.create')
    if (error) return error

    const body = await request.json()
    const { soId, pickerName } = createDoSchema.parse(body)

    const id = await createDeliveryOrder(soId, pickerName)

    return NextResponse.json({ id, message: 'Delivery order created successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal membuat delivery order')
  }
}
