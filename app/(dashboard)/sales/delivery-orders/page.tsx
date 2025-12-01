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
import { getDeliveryOrders } from '@/services/delivery-order.service'
import { formatDate } from '@/lib/utils'
import { DELIVERY_STATUS } from '@/lib/constants'

interface PageProps {
  searchParams: {
    search?: string
    status?: string
    page?: string
  }
}

export default async function DeliveryOrdersPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const { deliveryOrders, pagination } = await getDeliveryOrders({
    search: searchParams.search,
    status: searchParams.status,
    page,
    limit: 10,
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      picking: 'secondary',
      picked: 'default',
      shipped: 'default',
    }
    return variants[status] || 'secondary'
  }

  const getStatusLabel = (status: string) => {
    const found = DELIVERY_STATUS.find((s) => s.value === status)
    return found?.label || status
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery Orders</h1>
        <p className="text-gray-600">
          Kelola picking dan pengiriman barang (Dibuat otomatis dari Sales Order)
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor DO</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>SO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Picked At</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Tidak ada data delivery order
                </TableCell>
              </TableRow>
            ) : (
              deliveryOrders.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono font-medium">{d.doNumber}</TableCell>
                  <TableCell>{formatDate(d.doDate)}</TableCell>
                  <TableCell className="font-mono">{d.soNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{d.customerName}</p>
                      <p className="text-sm text-gray-600 font-mono">{d.customerCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>{d.itemCount} item</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(d.status)}>{getStatusLabel(d.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {d.pickedAt ? formatDate(d.pickedAt) : <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/sales/delivery-orders/${d.id}`}>
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
              <Link href={`/sales/delivery-orders?page=${pagination.page - 1}`}>Previous</Link>
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
              <Link href={`/sales/delivery-orders?page=${pagination.page + 1}`}>Next</Link>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
