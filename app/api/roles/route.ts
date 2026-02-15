import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getRoles, createRole } from '@/services/user.service'
import { roleSchema } from '@/validations/role'
import { apiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('roles.view')
    if (error) return error

    const roles = await getRoles()
    return NextResponse.json(roles)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data role')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('roles.create')
    if (error) return error

    const body = await request.json()
    const validatedData = roleSchema.parse(body)
    const id = await createRole(validatedData)
    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal membuat role')
  }
}
