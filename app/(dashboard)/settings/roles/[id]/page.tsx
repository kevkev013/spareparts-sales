'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckSquare, Square, Download } from 'lucide-react'
import Link from 'next/link'
import { PERMISSION_MODULES, ALL_ACTIONS, ACTION_LABELS, DEFAULT_ROLES } from '@/lib/permissions'

export default function EditRolePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSystem, setIsSystem] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/roles/${params.id}`)
      .then((res) => res.json())
      .then((role) => {
        setName(role.name)
        setDescription(role.description || '')
        setIsSystem(role.isSystem)
        setPermissions((role.permissions as Record<string, boolean>) || {})
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [params.id])

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const key = `${module}.${action}`
    const updated = { ...permissions, [key]: checked }

    // If unchecking "view", uncheck all actions for this module
    if (action === 'view' && !checked) {
      const mod = PERMISSION_MODULES.find((m) => m.module === module)
      if (mod) {
        for (const a of mod.actions) {
          updated[`${module}.${a}`] = false
        }
      }
    }

    // If checking any action, auto-check "view"
    if (action !== 'view' && checked) {
      updated[`${module}.view`] = true
    }

    setPermissions(updated)
  }

  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {}
    for (const mod of PERMISSION_MODULES) {
      for (const action of mod.actions) {
        updated[`${mod.module}.${action}`] = true
      }
    }
    setPermissions(updated)
  }

  const handleClearAll = () => {
    setPermissions({})
  }

  const handleLoadTemplate = (templateName: string) => {
    const template = DEFAULT_ROLES.find((r) => r.name === templateName)
    if (template) {
      setPermissions({ ...template.permissions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/roles/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Role berhasil diupdate')
      router.push('/settings/roles')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-6">
        <p className="text-center py-8 text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings/roles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Role: {name}</h1>
        {isSystem && <Badge variant="secondary">Role Sistem</Badge>}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Role Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Role</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSystem}
                  required
                />
                {isSystem && (
                  <p className="text-xs text-gray-500">Nama role sistem tidak dapat diubah</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>Permission Matrix</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleLoadTemplate(e.target.value)
                    e.target.value = ''
                  }}
                  className="border rounded-md px-3 py-1.5 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Muat dari template...
                  </option>
                  {DEFAULT_ROLES.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Centang Semua
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
                  <Square className="h-4 w-4 mr-1" />
                  Hapus Semua
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium w-48">Modul</th>
                    {ALL_ACTIONS.map((action) => (
                      <th key={action} className="text-center py-3 px-3 font-medium">
                        {ACTION_LABELS[action]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((mod) => (
                    <tr key={mod.module} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{mod.label}</td>
                      {ALL_ACTIONS.map((action) => {
                        const hasAction = (mod.actions as readonly string[]).includes(action)
                        const key = `${mod.module}.${action}`
                        return (
                          <td key={action} className="text-center py-3 px-3">
                            {hasAction ? (
                              <Checkbox
                                checked={permissions[key] === true}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(mod.module, action, checked as boolean)
                                }
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
              <Link href="/settings/roles">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
