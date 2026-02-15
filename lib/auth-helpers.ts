import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

/**
 * Get session or redirect to login (for Server Components)
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  return session
}

/**
 * Check permission in a Server Component. Redirects to /unauthorized if denied.
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth()
  if (!hasPermission(session.user.permissions, permission)) {
    redirect('/unauthorized')
  }
  return session
}

/**
 * Check auth + permission in an API route.
 */
export async function requireApiPermission(permission: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      ),
      session: null,
    }
  }

  if (!hasPermission(session.user.permissions, permission)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Anda tidak memiliki akses untuk operasi ini' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Check if a permissions object grants a specific permission.
 */
export function hasPermission(
  permissions: Record<string, boolean> | undefined,
  permission: string
): boolean {
  if (!permissions) return false
  return permissions[permission] === true
}

/**
 * Check if any of the given permissions are granted.
 */
export function hasAnyPermission(
  permissions: Record<string, boolean> | undefined,
  permissionList: string[]
): boolean {
  if (!permissions) return false
  return permissionList.some((p) => permissions[p] === true)
}
