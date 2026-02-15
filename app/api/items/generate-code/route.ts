import { NextResponse } from 'next/server'
import { generateItemCode } from '@/services/item.service'
import { requireApiPermission } from '@/lib/auth-helpers'

// GET /api/items/generate-code - Generate next item code
export async function GET() {
  try {
    const { error } = await requireApiPermission('items.create')
    if (error) return error

    const itemCode = await generateItemCode()
    return NextResponse.json({ itemCode })
  } catch (error: any) {
    console.error('Error generating item code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate item code' },
      { status: 500 }
    )
  }
}
