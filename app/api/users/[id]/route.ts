import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getUserById, updateUser, deleteUser } from '@/services/user.service'
import { updateUserSchema } from '@/validations/user'
import { apiError } from '@/lib/api-error'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.view')
    if (error) return error

    const user = await getUserById(params.id)
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error: any) {
    return apiError(error, 'Gagal mengambil data user')
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.edit')
    if (error) return error

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    await updateUser(params.id, validatedData)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return apiError(error, 'Gagal mengupdate user')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.delete')
    if (error) return error

    await deleteUser(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return apiError(error, 'Gagal menghapus user')
  }
}
