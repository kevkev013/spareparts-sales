'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { PERMISSION_MODULES, ALL_ACTIONS, ACTION_LABELS, DEFAULT_ROLES } from '@/lib/permissions'

export default function CreateRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const key = `${module}.${action}`
    const updated = { ...permissions, [key]: checked }

    if (action === 'view' && !checked) {
      const mod = PERMISSION_MODULES.find((m) => m.module === module)
      if (mod) {
        for (const a of mod.actions) {
          updated[`${module}.${a}`] = false
        }
      }
    }

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
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Role berhasil dibuat')
      router.push('/settings/roles')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings/roles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tambah Role</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Role *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
                {loading ? 'Menyimpan...' : 'Simpan'}
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
