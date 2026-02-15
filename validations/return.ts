import { z } from 'zod'

const returnItemSchema = z.object({
  itemCode: z.string().min(1, 'Item harus dipilih'),
  quantity: z.number().positive('Jumlah harus lebih dari 0'),
  unit: z.string().min(1, 'Satuan harus diisi'),
  condition: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const returnSchema = z.object({
  returnDate: z.coerce.date({
    required_error: 'Tanggal retur harus diisi',
    invalid_type_error: 'Format tanggal tidak valid',
  }),
  customerCode: z.string().min(1, 'Customer harus dipilih'),
  soNumber: z.string().optional().or(z.literal('')),
  reason: z.string().max(500).optional().or(z.literal('')),
  items: z.array(returnItemSchema).min(1, 'Minimal 1 item harus ditambahkan'),
})

export const returnFilterSchema = z.object({
  search: z.string().optional(),
  customerCode: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['returnDate', 'returnNumber', 'customerCode', 'status']).optional().default('returnDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ReturnFormData = z.infer<typeof returnSchema>
export type ReturnFilterData = z.infer<typeof returnFilterSchema>
