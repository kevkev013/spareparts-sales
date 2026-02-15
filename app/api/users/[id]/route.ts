import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getUserById, updateUser, deleteUser } from '@/services/user.service'

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
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.edit')
    if (error) return error

    const body = await request.json()
    await updateUser(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('users.delete')
    if (error) return error

    await deleteUser(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}
