import { NextResponse } from 'next/server'
import { getWarehouses } from '@/services/location.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/locations/warehouses - Get all warehouses
export async function GET() {
  try {
    const { error } = await requireApiPermission('locations.view')
    if (error) return error

    const warehouses = await getWarehouses()
    return NextResponse.json(warehouses)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data warehouse')
  }
}
