import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getRoleById, updateRole, deleteRole } from '@/services/user.service'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('roles.view')
    if (error) return error

    const role = await getRoleById(params.id)
    if (!role) {
      return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(role)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch role' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('roles.edit')
    if (error) return error

    const body = await request.json()
    await updateRole(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireApiPermission('roles.delete')
    if (error) return error

    await deleteRole(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete role' }, { status: 500 })
  }
}
