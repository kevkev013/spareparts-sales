import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getUsers, createUser } from '@/services/user.service'
import { createUserSchema } from '@/validations/user'
import { apiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('users.view')
    if (error) return error

    const searchParams = request.nextUrl.searchParams
    const filter = {
      search: searchParams.get('search') || undefined,
      roleId: searchParams.get('roleId') || undefined,
      isActive:
        searchParams.get('isActive') === 'true'
          ? true
          : searchParams.get('isActive') === 'false'
            ? false
            : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100),
    }

    const result = await getUsers(filter)
    return NextResponse.json(result)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data user')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('users.create')
    if (error) return error

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    const id = await createUser(validatedData)
    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    return apiError(error, 'Gagal membuat user')
  }
}
