import Link from 'next/link'
import { ChevronLeft, Edit, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCustomerById } from '@/services/customer.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CUSTOMER_TYPE_LABELS } from '@/types/customer'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customerData = await getCustomerById(params.id)

  if (!customerData) {
    notFound()
  }

  const { customer, stats } = customerData

  // Fetch recent orders for this customer
  const recentOrders = await prisma.salesOrder.findMany({
    where: { customerCode: customer.customerCode },
    orderBy: { soDate: 'desc' },
    take: 10,
    select: {
      id: true,
      soNumber: true,
      soDate: true,
      grandTotal: true,
      status: true,
    },
  })

  const STATUS_LABELS: Record<string, string> = {
    confirmed: 'Terkonfirmasi',
    processing: 'Diproses',
    partial_fulfilled: 'Sebagian',
    fulfilled: 'Terpenuhi',
    cancelled: 'Dibatalkan',
  }

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    partial_fulfilled: 'bg-orange-100 text-orange-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/master/customers">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Customer
          </Button>
        </Link>
        <Link href={`/master/customers/${params.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">{customer.customerName}</h1>
          {customer.isActive ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="secondary">Nonaktif</Badge>
          )}
          <Badge variant="outline">
            {CUSTOMER_TYPE_LABELS[customer.customerType]}
          </Badge>
        </div>
        <p className="text-gray-600 font-mono">{customer.customerCode}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm text-gray-600">Order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-600">Total pembelian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Piutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.outstandingBalance)}
            </p>
            <p className="text-sm text-gray-600">Belum lunas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Telepon</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            )}

            {customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Alamat</p>
                  <p className="font-medium">{customer.address}</p>
                  {customer.city && (
                    <p className="text-sm text-gray-600">{customer.city}</p>
                  )}
                </div>
              </div>
            )}

            {customer.npwp && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">NPWP</p>
                  <p className="font-medium font-mono">{customer.npwp}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit & Discount */}
        <Card>
          <CardHeader>
            <CardTitle>Kredit & Diskon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Credit Limit</p>
              <p className="text-sm font-medium">
                {formatCurrency(Number(customer.creditLimit))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Credit Term</p>
              <p className="text-sm font-medium">
                {customer.creditTerm > 0 ? `${customer.creditTerm} hari` : 'Cash'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Diskon Default</p>
              <p className="text-sm font-medium">
                {Number(customer.discountRate) > 0
                  ? `${Number(customer.discountRate)}%`
                  : 'Tidak ada'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kena Pajak</p>
              <p className="text-sm font-medium">{customer.isTaxable ? 'Ya' : 'Tidak'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <p className="text-sm text-gray-600">Terdaftar</p>
              <p className="text-sm">{formatDate(customer.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada transaksi untuk customer ini.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. SO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.soNumber}</TableCell>
                    <TableCell>{formatDate(order.soDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(order.grandTotal))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/sales/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          Lihat
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
