import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-helpers'
import { getRoles, createRole } from '@/services/user.service'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('roles.view')
    if (error) return error

    const roles = await getRoles()
    return NextResponse.json(roles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireApiPermission('roles.create')
    if (error) return error

    const body = await request.json()
    const id = await createRole(body)
    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 })
  }
}
