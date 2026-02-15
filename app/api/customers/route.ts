import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, createCustomer } from '@/services/customer.service'
import { customerSchema, customerFilterSchema } from '@/validations/customer'
import { CustomerType } from '@prisma/client'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/customers - Get all customers with filters
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('customers.view')
    if (error) return error

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
    return apiError(error, 'Gagal memproses data customer')
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('customers.create')
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = customerSchema.parse(body)

    // Create customer
    const customer = await createCustomer(validatedData)

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal memproses data customer')
  }
}
