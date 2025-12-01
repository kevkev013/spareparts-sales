import { Prisma, CustomerType } from '@prisma/client'

// Base Customer type from Prisma
export type Customer = Prisma.CustomerGetPayload<{}>

// Customer for list view
export type CustomerListItem = {
  id: string
  customerCode: string
  customerName: string
  customerType: CustomerType
  phone: string | null
  email: string | null
  city: string | null
  creditLimit: number
  creditTerm: number
  discountRate: number
  isActive: boolean
  createdAt: Date
}

// Customer create/update input
export type CustomerInput = {
  customerCode?: string // Optional for create (auto-generated)
  customerName: string
  customerType: CustomerType
  phone?: string
  email?: string
  address?: string
  city?: string
  npwp?: string
  discountRate?: number
  creditLimit?: number
  creditTerm?: number
  isTaxable?: boolean
  isActive?: boolean
}

// Customer filter/search
export type CustomerFilter = {
  search?: string
  customerType?: CustomerType
  city?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: 'customerCode' | 'customerName' | 'customerType' | 'city' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// API Response types
export type CustomersResponse = {
  customers: CustomerListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CustomerDetailResponse = {
  customer: Customer
  stats: {
    totalOrders: number
    totalRevenue: number
    outstandingBalance: number
    lastOrderDate: Date | null
  }
}

// Customer type labels
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  retail: 'Retail',
  wholesale: 'Grosir',
  bengkel: 'Bengkel',
}
