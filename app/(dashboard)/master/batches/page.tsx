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
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BatchesResponse } from '@/types/batch'
import { Plus, Search, Edit, Trash2, Eye, Package2 } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

export default function BatchesPage() {
  const { can } = usePermissions()
  const [data, setData] = useState<BatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    fetchBatches()
  }, [page, search])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/batches?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string, batchNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus batch "${batchNumber}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete batch')
      }

      alert('Batch berhasil dihapus')
      fetchBatches()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus batch')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Master Batch</h1>
        <p className="text-gray-600">Kelola batch pembelian dan tracking supplier</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari nomor batch atau supplier..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {can('batches.create') && (
          <Link href="/master/batches/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Batch
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
        ) : !data || data.batches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Batch</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tanggal Beli</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono font-medium">
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{batch.itemName}</p>
                        <p className="text-sm text-gray-600 font-mono">
                          {batch.itemCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(batch.purchaseDate)}</TableCell>
                    <TableCell>{formatCurrency(batch.purchasePrice)}</TableCell>
                    <TableCell>{batch.supplier}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{batch.totalStock}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {batch.expiryDate ? (
                        <div>
                          <p className="text-sm">{formatDate(batch.expiryDate)}</p>
                          {new Date(batch.expiryDate) < new Date() && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Expired
                            </Badge>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link href={`/master/batches/${batch.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {can('batches.edit') && (
                          <Link href={`/master/batches/${batch.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {can('batches.delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(batch.id, batch.batchNumber)}
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
                {Math.min(page * limit, data.total)} dari {data.total} batch
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
