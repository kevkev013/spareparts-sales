import { NextResponse } from 'next/server'

/**
 * Safe error response that hides internal details in production.
 * In development, returns the actual error message for debugging.
 */
export function apiError(error: any, fallbackMessage: string, status = 500) {
  console.error(`${fallbackMessage}:`, error)

  if (error?.name === 'ZodError') {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }

  // Known business errors (thrown explicitly in services) are safe to expose
  const knownErrors = [
    'tidak ditemukan',
    'sudah digunakan',
    'harus diisi',
    'tidak boleh',
    'tidak dapat',
    'tidak cukup',
    'sudah ada',
    'salah',
    'minimal',
    'maksimal',
  ]

  const message = error?.message || ''
  const isKnownError = knownErrors.some((k) => message.toLowerCase().includes(k))

  if (isKnownError) {
    return NextResponse.json({ error: message }, { status: status < 500 ? status : 400 })
  }

  const isProduction = process.env.NODE_ENV === 'production'
  return NextResponse.json(
    { error: isProduction ? fallbackMessage : message || fallbackMessage },
    { status }
  )
}
