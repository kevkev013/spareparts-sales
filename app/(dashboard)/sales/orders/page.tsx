import Link from 'next/link'
import { Plus, Eye, Edit, XCircle } from 'lucide-react'
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
import { getSalesOrders } from '@/services/sales-order.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/constants'

interface PageProps {
  searchParams: {
    search?: string
    customerCode?: string
    status?: string
    page?: string
  }
}

export default async function SalesOrdersPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const { orders, pagination } = await getSalesOrders({
    search: searchParams.search,
    customerCode: searchParams.customerCode,
    status: searchParams.status,
    page,
    limit: 10,
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      confirmed: 'default',
      processing: 'secondary',
      partial_fulfilled: 'outline',
      fulfilled: 'default',
      cancelled: 'destructive',
    }
    return variants[status] || 'secondary'
  }

  const getStatusLabel = (status: string) => {
    const found = ORDER_STATUS.find((s) => s.value === status)
    return found?.label || status
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Orders</h1>
          <p className="text-gray-600">Kelola pesanan penjualan dari customer</p>
        </div>
        <Link href="/sales/orders/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Order
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor SO</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>SQ Number</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Tidak ada data sales order
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">{order.soNumber}</TableCell>
                  <TableCell>{formatDate(order.soDate)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-600 font-mono">{order.customerCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.sqNumber ? (
                      <span className="font-mono text-sm">{order.sqNumber}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(order.grandTotal))}
                  </TableCell>
                  <TableCell>{order.itemCount} item</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/sales/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
                        <Link href={`/sales/orders/${order.id}/edit`}>
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
                href={`/sales/orders?page=${pagination.page - 1}${
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
                href={`/sales/orders?page=${pagination.page + 1}${
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
