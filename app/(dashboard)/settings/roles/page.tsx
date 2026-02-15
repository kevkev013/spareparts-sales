'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react'

type Role = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  _count: { users: number }
}

export default function RolesPage() {
  const { can } = usePermissions()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles')
      const data = await res.json()
      setRoles(data)
    } catch {
      console.error('Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus role "${name}"?`)) return

    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchRoles()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center py-8 text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manajemen Role</h1>
        {can('roles.create') && (
          <Link href="/settings/roles/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Role
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                {role.isSystem && <Badge variant="secondary">Sistem</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{role.description || 'Tidak ada deskripsi'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Users className="h-4 w-4" />
                <span>{role._count.users} user</span>
              </div>
              <div className="flex gap-2">
                {can('roles.edit') && (
                  <Link href={`/settings/roles/${role.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Permissions
                    </Button>
                  </Link>
                )}
                {can('roles.delete') && !role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(role.id, role.name)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
