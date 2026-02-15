import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { resetPassword } from '@/services/user.service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.edit')
    if (error) return error

    const body = await request.json()
    if (!body.newPassword) {
      return NextResponse.json({ error: 'Password baru harus diisi' }, { status: 400 })
    }

    await resetPassword(params.id, body.newPassword)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    )
  }
}
