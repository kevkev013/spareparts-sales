import { NextRequest, NextResponse } from 'next/server'
import { getCustomerById, updateCustomer, deleteCustomer } from '@/services/customer.service'
import { customerSchema } from '@/validations/customer'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('customers.view')
    if (error) return error

    const customer = await getCustomerById(params.id)

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data customer')
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('customers.edit')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = customerSchema.parse(body)

    // Update customer
    const customer = await updateCustomer(params.id, validatedData)

    return NextResponse.json(customer)
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data customer')
  }
}

// DELETE /api/customers/[id] - Delete customer (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission('customers.delete')
    if (error) return error

    await deleteCustomer(params.id)

    return NextResponse.json({ message: 'Customer berhasil dihapus' })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data customer')
  }
}
