'use client'

import { useSession } from 'next-auth/react'

export function usePermissions() {
  const { data: session, status } = useSession()

  const can = (permission: string): boolean => {
    if (!session?.user?.permissions) return false
    return session.user.permissions[permission] === true
  }

  const canAny = (permissions: string[]): boolean => {
    return permissions.some((p) => can(p))
  }

  return {
    can,
    canAny,
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
