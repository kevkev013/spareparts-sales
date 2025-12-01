import { z } from 'zod'

// Location validation schema
export const locationSchema = z.object({
  locationCode: z.string().min(1, 'Kode lokasi harus diisi').max(20).regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf besar, angka, dan dash'),
  locationName: z.string().min(1, 'Nama lokasi harus diisi').max(255),
  warehouse: z.string().min(1, 'Nama gudang harus diisi').max(100),
  zone: z.string().max(50).optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

// Location filter validation
export const locationFilterSchema = z.object({
  search: z.string().optional(),
  warehouse: z.string().optional(),
  zone: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['locationCode', 'locationName', 'warehouse', 'zone', 'createdAt']).optional().default('locationCode'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export type LocationFormData = z.infer<typeof locationSchema>
export type LocationFilterData = z.infer<typeof locationFilterSchema>
