import { NextRequest, NextResponse } from 'next/server'
import { getInvoices, createInvoice } from '@/services/invoice.service'

/**
 * GET /api/invoices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filter = {
      search: searchParams.get('search') || undefined,
      customerCode: searchParams.get('customerCode') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? Math.min(parseInt(searchParams.get('limit')!), 100)
        : 10,
      sortBy: searchParams.get('sortBy') || 'invDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    const result = await getInvoices(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/invoices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { soId, creditTerm } = body

    if (!soId) {
      return NextResponse.json({ error: 'soId is required' }, { status: 400 })
    }

    const id = await createInvoice(soId, creditTerm)

    return NextResponse.json({ id, message: 'Invoice created successfully' })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
