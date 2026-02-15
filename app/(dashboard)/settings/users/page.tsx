'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, KeyRound } from 'lucide-react'

type User = {
  id: string
  username: string
  fullName: string
  email: string | null
  isActive: boolean
  lastLoginAt: string | null
  role: { id: string; name: string }
}

export default function UsersPage() {
  const router = useRouter()
  const { can } = usePermissions()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '50')

      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus user "${name}"?`)) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchUsers()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleResetPassword = async (id: string, name: string) => {
    const newPassword = prompt(`Reset password untuk "${name}".\nMasukkan password baru:`)
    if (!newPassword) return

    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert('Password berhasil direset')
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manajemen User</h1>
        {can('users.create') && (
          <Link href="/settings/users/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Memuat...</p>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Tidak ada user ditemukan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">Nama Lengkap</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Login Terakhir</th>
                    <th className="text-right py-3 px-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{user.username}</td>
                      <td className="py-3 px-4">{user.fullName}</td>
                      <td className="py-3 px-4 text-gray-500">{user.email || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{user.role.name}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {can('users.edit') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.id, user.fullName)}
                                title="Reset Password"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Link href={`/settings/users/${user.id}/edit`}>
                                <Button variant="ghost" size="sm" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </>
                          )}
                          {can('users.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id, user.fullName)}
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
