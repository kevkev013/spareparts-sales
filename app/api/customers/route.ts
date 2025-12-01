import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, createCustomer } from '@/services/customer.service'
import { customerSchema, customerFilterSchema } from '@/validations/customer'
import { CustomerType } from '@prisma/client'

// GET /api/customers - Get all customers with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const customerTypeParam = searchParams.get('customerType')
    const filter = {
      search: searchParams.get('search') || undefined,
      customerType: customerTypeParam ? (customerTypeParam as CustomerType) : undefined,
      city: searchParams.get('city') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Validate filter
    const validatedFilter = customerFilterSchema.parse(filter)

    // Get customers
    const result = await getCustomers(validatedFilter)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = customerSchema.parse(body)

    // Create customer
    const customer = await createCustomer(validatedData)

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}
