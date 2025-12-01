import { z } from 'zod'
import { CustomerType } from '@prisma/client'

// Customer validation schema
export const customerSchema = z.object({
  customerCode: z.string().optional(),
  customerName: z.string().min(1, 'Nama customer harus diisi').max(255),
  customerType: z.nativeEnum(CustomerType, {
    required_error: 'Tipe customer harus dipilih',
  }),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100).optional().or(z.literal('')),
  npwp: z.string().max(30).optional().or(z.literal('')),
  discountRate: z.number().min(0, 'Diskon tidak boleh negatif').max(100, 'Diskon maksimal 100%').optional().default(0),
  creditLimit: z.number().min(0, 'Credit limit tidak boleh negatif').optional().default(0),
  creditTerm: z.number().int().min(0, 'Credit term tidak boleh negatif').optional().default(0),
  isTaxable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
})

// Customer filter validation
export const customerFilterSchema = z.object({
  search: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  city: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['customerCode', 'customerName', 'customerType', 'city', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type CustomerFormData = z.infer<typeof customerSchema>
export type CustomerFilterData = z.infer<typeof customerFilterSchema>
