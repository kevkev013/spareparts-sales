import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'
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
    const { error } = await requireApiPermission('quotations.view')
    if (error) return error

    const quotation = await getSalesQuotationById(params.id)

    if (!quotation) {
      return NextResponse.json({ error: 'Sales quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data quotation')
  }
}

/**
 * PUT /api/sales-quotations/[id]
 * Update quotation
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('quotations.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = salesQuotationSchema.parse(body)

    // Update quotation
    await updateSalesQuotation(params.id, validatedData)

    return NextResponse.json({ message: 'Sales quotation updated successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data quotation')
  }
}

/**
 * DELETE /api/sales-quotations/[id]
 * Delete quotation
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('quotations.delete')
    if (error) return error

    await deleteSalesQuotation(params.id)

    return NextResponse.json({ message: 'Sales quotation deleted successfully' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data quotation')
  }
}
