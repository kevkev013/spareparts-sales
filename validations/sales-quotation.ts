import { z } from 'zod'

// Sales Quotation Item validation
export const salesQuotationItemSchema = z.object({
  itemCode: z.string().min(1, 'Item harus dipilih'),
  quantity: z.number().positive('Quantity harus lebih dari 0'),
  unit: z.string().min(1, 'Satuan harus dipilih'),
  unitPrice: z.number().min(0, 'Harga tidak boleh negatif'),
  discountPercent: z.number().min(0, 'Diskon tidak boleh negatif').max(100, 'Diskon maksimal 100%'),
  notes: z.string().optional(),
})

// Sales Quotation validation
export const salesQuotationSchema = z.object({
  sqNumber: z.string().optional(),
  sqDate: z.coerce.date(),
  customerCode: z.string().min(1, 'Customer harus dipilih'),
  validUntil: z.coerce.date(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']),
  items: z.array(salesQuotationItemSchema).min(1, 'Minimal 1 item harus ditambahkan'),
}).refine(
  (data) => {
    // Validate that validUntil is after sqDate
    return data.validUntil >= data.sqDate
  },
  {
    message: 'Tanggal berlaku harus setelah atau sama dengan tanggal quotation',
    path: ['validUntil'],
  }
)

export type SalesQuotationFormData = z.infer<typeof salesQuotationSchema>
export type SalesQuotationItemFormData = z.infer<typeof salesQuotationItemSchema>
