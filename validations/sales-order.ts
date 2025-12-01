import { z } from 'zod'

// Sales Order Item validation
export const salesOrderItemSchema = z.object({
  itemCode: z.string().min(1, 'Item harus dipilih'),
  quantity: z.number().positive('Quantity harus lebih dari 0'),
  unit: z.string().min(1, 'Satuan harus dipilih'),
  unitPrice: z.number().min(0, 'Harga tidak boleh negatif'),
  discountPercent: z.number().min(0, 'Diskon tidak boleh negatif').max(100, 'Diskon maksimal 100%'),
  notes: z.string().optional(),
})

// Sales Order validation
export const salesOrderSchema = z.object({
  soNumber: z.string().optional(),
  soDate: z.coerce.date(),
  customerCode: z.string().min(1, 'Customer harus dipilih'),
  sqId: z.string().optional(),
  sqNumber: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['confirmed', 'processing', 'partial_fulfilled', 'fulfilled', 'cancelled']),
  items: z.array(salesOrderItemSchema).min(1, 'Minimal 1 item harus ditambahkan'),
})

export type SalesOrderFormData = z.infer<typeof salesOrderSchema>
export type SalesOrderItemFormData = z.infer<typeof salesOrderItemSchema>
