import Link from 'next/link'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getInvoices } from '@/services/invoice.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { INVOICE_STATUS } from '@/lib/constants'

interface PageProps {
  searchParams: {
    search?: string
    status?: string
    page?: string
  }
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const { invoices, pagination } = await getInvoices({
    search: searchParams.search,
    status: searchParams.status,
    page,
    limit: 10,
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      unpaid: 'destructive',
      partial_paid: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline',
    }
    return variants[status] || 'secondary'
  }

  const getStatusLabel = (status: string) => {
    const found = INVOICE_STATUS.find((s) => s.value === status)
    return found?.label || status
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Invoices</h1>
        <p className="text-gray-600">
          Kelola invoice penjualan dengan tracking HPP dan profit (Dibuat dari Sales Order)
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Invoice</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>SO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Grand Total</TableHead>
              <TableHead>HPP</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Margin %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  Tidak ada data invoice
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-medium">{inv.invNumber}</TableCell>
                  <TableCell>{formatDate(inv.invDate)}</TableCell>
                  <TableCell className="font-mono">{inv.soNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.customer.customerName}</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {inv.customer.customerCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(inv.grandTotal))}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {formatCurrency(Number(inv.hpp))}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(Number(inv.profit))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        Number(inv.profitMargin) > 20
                          ? 'text-green-600'
                          : Number(inv.profitMargin) > 10
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {Number(inv.profitMargin).toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(inv.status)}>
                      {getStatusLabel(inv.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/sales/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
              <Link href={`/sales/invoices?page=${pagination.page - 1}`}>Previous</Link>
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
              <Link href={`/sales/invoices?page=${pagination.page + 1}`}>Next</Link>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
