import { z } from 'zod'

export const shipmentSchema = z.object({
  doId: z.string().uuid('Delivery Order ID tidak valid'),
  sjDate: z.coerce.date({
    required_error: 'Tanggal surat jalan harus diisi',
    invalid_type_error: 'Format tanggal tidak valid',
  }),
  driverName: z.string().min(1, 'Nama supir harus diisi').max(100),
  vehicleNumber: z.string().min(1, 'Nomor kendaraan harus diisi').max(20),
  deliveryAddress: z.string().min(1, 'Alamat pengiriman harus diisi').max(500),
  recipient: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const shipmentFilterSchema = z.object({
  search: z.string().optional(),
  customerCode: z.string().optional(),
  status: z.enum(['in_transit', 'delivered', 'cancelled']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['sjDate', 'sjNumber', 'customerCode', 'status']).optional().default('sjDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ShipmentFormData = z.infer<typeof shipmentSchema>
export type ShipmentFilterData = z.infer<typeof shipmentFilterSchema>
