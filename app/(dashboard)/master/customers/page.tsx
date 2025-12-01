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
import type { CustomersResponse } from '@/types/customer'
import { CUSTOMER_TYPE_LABELS } from '@/types/customer'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

export default function CustomersPage() {
  const [data, setData] = useState<CustomersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    fetchCustomers()
  }, [page, search])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/customers?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus customer "${customerName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete customer')
      }

      alert('Customer berhasil dihapus')
      fetchCustomers()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus customer')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Master Customer</h1>
        <p className="text-gray-600">Kelola data customer dan informasi kontak</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari kode, nama, email, atau telepon..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/master/customers/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Customer
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : !data?.customers || data?.customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Customer</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono font-medium">
                      {customer.customerCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.customerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CUSTOMER_TYPE_LABELS[customer.customerType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.phone && <p>{customer.phone}</p>}
                        {customer.email && (
                          <p className="text-gray-600">{customer.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.city || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatCurrency(customer.creditLimit)}</p>
                        {customer.creditTerm > 0 && (
                          <p className="text-gray-600">{customer.creditTerm} hari</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.discountRate > 0 ? `${customer.discountRate}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {customer.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link href={`/master/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/master/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id, customer.customerName)}
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
                {Math.min(page * limit, data.pagination?.total || 0)} dari {data.pagination?.total || 0} customer
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
                  disabled={page >= (data.pagination?.totalPages || 1)}
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
