import { NextResponse } from 'next/server'
import { getSuppliers } from '@/services/batch.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/batches/suppliers - Get all suppliers
export async function GET() {
  try {
    const { error } = await requireApiPermission('batches.view')
    if (error) return error

    const suppliers = await getSuppliers()
    return NextResponse.json(suppliers)
  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
