import { z } from 'zod'

// Unit Conversion validation
export const unitConversionSchema = z.object({
  fromUnit: z.string().min(1, 'Satuan asal harus diisi'),
  toUnit: z.string().min(1, 'Satuan tujuan harus diisi'),
  conversionFactor: z.number().positive('Faktor konversi harus lebih dari 0'),
  isActive: z.boolean().optional().default(true),
})

// Unit Price validation
export const unitPriceSchema = z.object({
  unit: z.string().min(1, 'Satuan harus diisi'),
  buyingPrice: z.number().min(0, 'Harga beli tidak boleh negatif'),
  sellingPrice: z.number().min(0, 'Harga jual tidak boleh negatif'),
  minQty: z.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true),
})

// Item validation schema
export const itemSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, 'Nama item harus diisi').max(255),
  category: z.string().min(1, 'Kategori harus diisi').max(100),
  brand: z.string().min(1, 'Merk harus diisi').max(100),
  baseUnit: z.string().min(1, 'Satuan dasar harus diisi').max(20),
  basePrice: z.number().min(0, 'Harga dasar tidak boleh negatif'),
  sellingPrice: z.number().min(0, 'Harga jual tidak boleh negatif'),
  minStock: z.number().int().min(0, 'Stok minimum tidak boleh negatif').default(0),
  description: z.string().optional(),
  compatibleMotors: z.array(z.string()).optional(),
  isTaxable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  unitConversions: z.array(unitConversionSchema).optional(),
  unitPrices: z.array(unitPriceSchema).optional(),
}).refine(
  (data) => data.sellingPrice >= data.basePrice,
  {
    message: 'Harga jual tidak boleh lebih rendah dari harga dasar',
    path: ['sellingPrice'],
  }
)

// Item filter validation
export const itemFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['itemCode', 'itemName', 'category', 'brand', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ItemFormData = z.infer<typeof itemSchema>
export type ItemFilterData = z.infer<typeof itemFilterSchema>
