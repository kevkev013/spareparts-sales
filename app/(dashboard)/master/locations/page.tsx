'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { LocationsResponse } from '@/types/location'
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

export default function LocationsPage() {
  const { can } = usePermissions()
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    fetchLocations()
  }, [page, search])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/locations?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string, locationName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lokasi "${locationName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete location')
      }

      alert('Lokasi berhasil dihapus')
      fetchLocations()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus lokasi')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Master Lokasi Gudang</h1>
        <p className="text-gray-600">Kelola lokasi penyimpanan barang di gudang</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari kode, nama, atau deskripsi lokasi..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {can('locations.create') && (
          <Link href="/master/locations/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Lokasi
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : !data || data.locations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Lokasi</TableHead>
                  <TableHead>Nama Lokasi</TableHead>
                  <TableHead>Gudang</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Total Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-mono font-medium">
                      {location.locationCode}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{location.locationName}</p>
                    </TableCell>
                    <TableCell>{location.warehouse}</TableCell>
                    <TableCell>
                      {location.zone ? (
                        <Badge variant="outline" className="capitalize">
                          {location.zone}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{location.itemCount} item</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{location.totalStock}</span>
                    </TableCell>
                    <TableCell>
                      {location.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link href={`/master/locations/${location.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {can('locations.edit') && (
                          <Link href={`/master/locations/${location.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {can('locations.delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(location.id, location.locationName)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-600">
                Menampilkan {(page - 1) * limit + 1} -{' '}
                {Math.min(page * limit, data.total)} dari {data.total} lokasi
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
