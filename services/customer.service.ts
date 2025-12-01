import { prisma } from '@/lib/prisma'
import { DOC_PREFIX } from '@/lib/constants'
import type { CustomerInput, CustomerFilter, CustomersResponse, CustomerDetailResponse } from '@/types/customer'
import { Prisma } from '@prisma/client'

/**
 * Generate next customer code (CUS-XXXX)
 */
export async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    where: {
      customerCode: {
        startsWith: DOC_PREFIX.CUSTOMER,
      },
    },
    orderBy: {
      customerCode: 'desc',
    },
  })

  if (!lastCustomer) {
    return `${DOC_PREFIX.CUSTOMER}-0001`
  }

  const lastNumber = parseInt(lastCustomer.customerCode.split('-')[1])
  const nextNumber = lastNumber + 1
  return `${DOC_PREFIX.CUSTOMER}-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Get all customers with filters and pagination
 */
export async function getCustomers(filter: CustomerFilter): Promise<CustomersResponse> {
  const {
    search,
    customerType,
    city,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filter

  // Build where clause
  const where: Prisma.CustomerWhereInput = {
    AND: [
      isActive !== undefined ? { isActive } : {},
      customerType ? { customerType } : {},
      city ? { city } : {},
      search
        ? {
            OR: [
              { customerCode: { contains: search } },
              { customerName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {},
    ],
  }

  // Get total count
  const total = await prisma.customer.count({ where })

  // Get customers with pagination
  const customers = await prisma.customer.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  // Map to list items
  const customersList = customers.map((customer) => ({
    id: customer.id,
    customerCode: customer.customerCode,
    customerName: customer.customerName,
    customerType: customer.customerType,
    phone: customer.phone,
    email: customer.email,
    city: customer.city,
    creditLimit: Number(customer.creditLimit),
    creditTerm: customer.creditTerm,
    discountRate: Number(customer.discountRate),
    isActive: customer.isActive,
    createdAt: customer.createdAt,
  }))

  return {
    customers: customersList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get customer by ID with stats
 */
export async function getCustomerById(id: string): Promise<CustomerDetailResponse | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
  })

  if (!customer) {
    return null
  }

  // For now, return empty stats (will be populated when we implement sales)
  const stats = {
    totalOrders: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    lastOrderDate: null,
  }

  return {
    customer,
    stats,
  }
}

/**
 * Get customer by customer code
 */
export async function getCustomerByCode(customerCode: string) {
  return await prisma.customer.findUnique({
    where: { customerCode },
  })
}

/**
 * Create new customer
 */
export async function createCustomer(data: CustomerInput) {
  // Generate customer code if not provided
  const customerCode = data.customerCode || (await generateCustomerCode())

  // Check if customer code already exists
  const existing = await prisma.customer.findUnique({
    where: { customerCode },
  })

  if (existing) {
    throw new Error('Kode customer sudah digunakan')
  }

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      ...data,
      customerCode,
    },
  })

  return customer
}

/**
 * Update customer
 */
export async function updateCustomer(id: string, data: CustomerInput) {
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  })

  if (!existingCustomer) {
    throw new Error('Customer tidak ditemukan')
  }

  // Update customer
  const customer = await prisma.customer.update({
    where: { id },
    data,
  })

  return customer
}

/**
 * Delete customer (soft delete by setting isActive to false)
 */
export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
  })

  if (!customer) {
    throw new Error('Customer tidak ditemukan')
  }

  // TODO: Check if customer has orders before deleting
  // For now, just soft delete
  return await prisma.customer.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Get cities (distinct)
 */
export async function getCities() {
  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      city: {
        not: null,
      },
    },
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  })

  return customers.map((customer) => customer.city).filter(Boolean) as string[]
}

/**
 * Get customer stats
 */
export async function getCustomerStats(customerId: string) {
  // TODO: Implement when we have sales data
  return {
    totalOrders: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    lastOrderDate: null,
  }
}
