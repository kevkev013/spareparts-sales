import { NextResponse } from 'next/server'
import { getSuppliers } from '@/services/batch.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/batches/suppliers - Get all suppliers
export async function GET() {
  try {
    const { error } = await requireApiPermission('batches.view')
    if (error) return error

    const suppliers = await getSuppliers()
    return NextResponse.json(suppliers)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data supplier')
  }
}
