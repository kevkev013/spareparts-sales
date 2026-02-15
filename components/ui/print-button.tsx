'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

interface PrintButtonProps {
  label?: string
  permission?: string
}

export function PrintButton({ label = 'Cetak', permission }: PrintButtonProps) {
  const { can } = usePermissions()

  if (permission && !can(permission)) {
    return null
  }

  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
