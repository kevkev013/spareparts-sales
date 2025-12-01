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
import { formatCurrency } from '@/lib/utils'
import type { ItemsResponse } from '@/types/item'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

export default function ItemsPage() {
  const [data, setData] = useState<ItemsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    fetchItems()
  }, [page, search])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/items?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item "${itemName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete item')
      }

      alert('Item berhasil dihapus')
      fetchItems()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus item')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Master Sparepart</h1>
        <p className="text-gray-600">Kelola data sparepart dan stok barang</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari kode item, nama, atau deskripsi..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/master/items/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Item</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Merk</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">
                      {item.itemCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.totalStock <= item.minStock
                              ? 'text-red-600 font-semibold'
                              : ''
                          }
                        >
                          {item.totalStock} {item.baseUnit}
                        </span>
                        {item.totalStock <= item.minStock && (
                          <Badge variant="destructive" className="text-xs">
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link href={`/master/items/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/master/items/${item.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.itemName)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
                {Math.min(page * limit, data.total)} dari {data.total} item
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
