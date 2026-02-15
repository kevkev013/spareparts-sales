import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { resetPassword } from '@/services/user.service'
import { resetPasswordSchema } from '@/validations/user'
import { passwordLimiter, rateLimitResponse } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-error'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.edit')
    if (error) return error

    // Rate limit by target user ID
    const { success } = passwordLimiter(`reset-pw:${params.id}`)
    if (!success) return rateLimitResponse()

    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    await resetPassword(params.id, validatedData.newPassword)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return apiError(error, 'Gagal mereset password')
  }
}
