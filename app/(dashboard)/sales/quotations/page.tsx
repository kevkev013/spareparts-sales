import Link from 'next/link'
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSalesQuotations } from '@/services/sales-quotation.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { QUOTATION_STATUS } from '@/lib/constants'

interface PageProps {
  searchParams: {
    search?: string
    customerCode?: string
    status?: string
    page?: string
  }
}

export default async function SalesQuotationsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const { quotations, pagination } = await getSalesQuotations({
    search: searchParams.search,
    customerCode: searchParams.customerCode,
    status: searchParams.status,
    page,
    limit: 10,
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      sent: 'default',
      accepted: 'default',
      rejected: 'destructive',
      expired: 'destructive',
      converted: 'outline',
    }
    return variants[status] || 'secondary'
  }

  const getStatusLabel = (status: string) => {
    const found = QUOTATION_STATUS.find((s) => s.value === status)
    return found?.label || status
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Quotation</h1>
          <p className="text-gray-600">Kelola penawaran harga untuk customer</p>
        </div>
        <Link href="/sales/quotations/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Quotation
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nomor SQ, customer..."
            className="pl-10"
            defaultValue={searchParams.search}
            name="search"
          />
        </div>
        <Select defaultValue={searchParams.status || 'all'} name="status">
          <SelectTrigger>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {QUOTATION_STATUS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor SQ</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Berlaku Hingga</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SO Number</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Tidak ada data quotation
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono font-medium">
                    {quotation.sqNumber}
                  </TableCell>
                  <TableCell>{formatDate(quotation.sqDate)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quotation.customerName}</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {quotation.customerCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(quotation.validUntil)}
                    {new Date(quotation.validUntil) < new Date() && (
                      <Badge variant="destructive" className="ml-2">
                        Expired
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(quotation.grandTotal))}
                  </TableCell>
                  <TableCell>{quotation.itemCount} item</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(quotation.status)}>
                      {getStatusLabel(quotation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {quotation.soNumber ? (
                      <span className="font-mono text-sm">{quotation.soNumber}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/sales/quotations/${quotation.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {!quotation.convertedToSo && (
                        <Link href={`/sales/quotations/${quotation.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            asChild={pagination.page !== 1}
          >
            {pagination.page === 1 ? (
              <span>Previous</span>
            ) : (
              <Link
                href={`/sales/quotations?page=${pagination.page - 1}${
                  searchParams.search ? `&search=${searchParams.search}` : ''
                }${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              >
                Previous
              </Link>
            )}
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            asChild={pagination.page !== pagination.totalPages}
          >
            {pagination.page === pagination.totalPages ? (
              <span>Next</span>
            ) : (
              <Link
                href={`/sales/quotations?page=${pagination.page + 1}${
                  searchParams.search ? `&search=${searchParams.search}` : ''
                }${searchParams.status ? `&status=${searchParams.status}` : ''}`}
              >
                Next
              </Link>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
