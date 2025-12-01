import { z } from 'zod'

// Batch validation schema
export const batchSchema = z.object({
  batchNumber: z.string().optional(),
  itemCode: z.string().min(1, 'Item harus dipilih'),
  purchaseDate: z.coerce.date({
    required_error: 'Tanggal pembelian harus diisi',
    invalid_type_error: 'Format tanggal tidak valid',
  }),
  purchasePrice: z.number().min(0, 'Harga beli tidak boleh negatif'),
  supplier: z.string().min(1, 'Supplier harus diisi').max(255),
  expiryDate: z.coerce.date().optional().nullable(),
  characteristics: z.record(z.any()).optional(),
  notes: z.string().optional(),
})

// Batch filter validation
export const batchFilterSchema = z.object({
  search: z.string().optional(),
  itemCode: z.string().optional(),
  supplier: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['batchNumber', 'purchaseDate', 'itemCode', 'supplier', 'createdAt']).optional().default('purchaseDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type BatchFormData = z.infer<typeof batchSchema>
export type BatchFilterData = z.infer<typeof batchFilterSchema>
