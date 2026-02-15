'use client'

import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGateProps {
  permission: string
  children: React.ReactNode
}

export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { can } = usePermissions()

  if (!can(permission)) return null

  return <>{children}</>
}
