import type { Session } from 'next-auth'
import { getAllPermissionKeys } from '@/lib/permissions'

export function createMockSession(overrides?: Partial<Session['user']>): Session {
  const allPermissions: Record<string, boolean> = {}
  for (const key of getAllPermissionKeys()) {
    allPermissions[key] = true
  }

  return {
    user: {
      id: 'user-1',
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'Admin',
      roleId: 'role-1',
      permissions: allPermissions,
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function createLimitedSession(permissionKeys: string[]): Session {
  const permissions: Record<string, boolean> = {}
  for (const key of permissionKeys) {
    permissions[key] = true
  }
  return createMockSession({ permissions })
}

export const nullSession = null
