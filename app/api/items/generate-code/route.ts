import { NextResponse } from 'next/server'
import { generateItemCode } from '@/services/item.service'
import { requireApiPermission } from '@/lib/auth-helpers'
import { apiError } from '@/lib/api-error'

// GET /api/items/generate-code - Generate next item code
export async function GET() {
  try {
    const { error } = await requireApiPermission('items.create')
    if (error) return error

    const itemCode = await generateItemCode()
    return NextResponse.json({ itemCode })
  } catch (error: any) {
    return apiError(error, 'Gagal generate kode item')
  }
}
