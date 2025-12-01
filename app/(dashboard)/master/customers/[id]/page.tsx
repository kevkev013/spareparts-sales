import Link from 'next/link'
import { ChevronLeft, Edit, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerById } from '@/services/customer.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CUSTOMER_TYPE_LABELS } from '@/types/customer'
import { notFound } from 'next/navigation'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customerData = await getCustomerById(params.id)

  if (!customerData) {
    notFound()
  }

  const { customer, stats } = customerData

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
        {/* Stats Cards (Will be populated when we have sales data) */}
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

      {/* Recent Orders - Will be implemented when we have sales */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">
              Belum ada transaksi. Data akan muncul setelah fitur Sales diimplementasikan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
