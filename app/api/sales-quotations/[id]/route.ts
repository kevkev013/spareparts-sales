import { NextRequest, NextResponse } from 'next/server'
import {
  getSalesQuotationById,
  updateSalesQuotation,
  deleteSalesQuotation,
} from '@/services/sales-quotation.service'
import { salesQuotationSchema } from '@/validations/sales-quotation'

/**
 * GET /api/sales-quotations/[id]
 * Get quotation by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quotation = await getSalesQuotationById(params.id)

    if (!quotation) {
      return NextResponse.json({ error: 'Sales quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error: any) {
    console.error('Error fetching sales quotation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/sales-quotations/[id]
 * Update quotation
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = salesQuotationSchema.parse(body)

    // Update quotation
    await updateSalesQuotation(params.id, validatedData)

    return NextResponse.json({ message: 'Sales quotation updated successfully' })
  } catch (error: any) {
    console.error('Error updating sales quotation:', error)

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
 * DELETE /api/sales-quotations/[id]
 * Delete quotation
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteSalesQuotation(params.id)

    return NextResponse.json({ message: 'Sales quotation deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting sales quotation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
