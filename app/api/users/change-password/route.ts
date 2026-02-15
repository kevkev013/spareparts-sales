import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { changePassword } from '@/services/user.service'
import { changePasswordSchema } from '@/validations/user'
import { passwordLimiter, rateLimitResponse } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by user ID
    const { success } = passwordLimiter(`change-pw:${session.user.id}`)
    if (!success) return rateLimitResponse()

    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    await changePassword(session.user.id, validatedData.currentPassword, validatedData.newPassword)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return apiError(error, 'Gagal mengubah password')
  }
}
