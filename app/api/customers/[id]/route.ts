import { NextRequest, NextResponse } from 'next/server'
import { getCustomerById, updateCustomer, deleteCustomer } from '@/services/customer.service'
import { customerSchema } from '@/validations/customer'

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await getCustomerById(params.id)

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = customerSchema.parse(body)

    // Update customer
    const customer = await updateCustomer(params.id, validatedData)

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error updating customer:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCustomer(params.id)

    return NextResponse.json({ message: 'Customer berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
