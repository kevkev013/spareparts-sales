import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getInvoices, createInvoice } from '@/services/invoice.service'
import { apiError } from '@/lib/api-error'
import { z } from 'zod'

const invoiceFilterSchema = z.object({
  search: z.string().optional(),
  customerCode: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['invDate', 'invNumber', 'customerCode', 'grandTotal', 'status']).optional().default('invDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

const createInvoiceSchema = z.object({
  soId: z.string().uuid('Sales Order ID tidak valid'),
  creditTerm: z.number().int().min(0).max(365).optional().default(0),
})

/**
 * GET /api/invoices
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('invoices.view')
    if (error) return error

    const { searchParams } = new URL(request.url)

    const filter = invoiceFilterSchema.parse({
      search: searchParams.get('search') || undefined,
      customerCode: searchParams.get('customerCode') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? Math.min(parseInt(searchParams.get('limit')!), 100)
        : 10,
      sortBy: searchParams.get('sortBy') || 'invDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    const result = await getInvoices(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data invoice')
  }
}

/**
 * POST /api/invoices
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('invoices.create')
    if (error) return error

    const body = await request.json()
    const { soId, creditTerm } = createInvoiceSchema.parse(body)

    const id = await createInvoice(soId, creditTerm)

    return NextResponse.json({ id, message: 'Invoice created successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal membuat invoice')
  }
}
