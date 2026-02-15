import { z } from 'zod'

export const paymentSchema = z.object({
  invoiceId: z.string().uuid('Invoice ID tidak valid'),
  paymentDate: z.coerce.date({
    required_error: 'Tanggal pembayaran harus diisi',
    invalid_type_error: 'Format tanggal tidak valid',
  }),
  amount: z.number().positive('Jumlah pembayaran harus lebih dari 0'),
  paymentMethod: z.enum(['cash', 'transfer', 'giro', 'credit_card'], {
    required_error: 'Metode pembayaran harus dipilih',
    invalid_type_error: 'Metode pembayaran tidak valid',
  }),
  referenceNumber: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const paymentFilterSchema = z.object({
  search: z.string().optional(),
  customerCode: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['paymentDate', 'paymentNumber', 'amount', 'customerCode']).optional().default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
export type PaymentFilterData = z.infer<typeof paymentFilterSchema>
