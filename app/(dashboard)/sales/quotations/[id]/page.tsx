export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft, Edit, FileText } from 'lucide-react'
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
import { getSalesQuotationById } from '@/services/sales-quotation.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { QUOTATION_STATUS } from '@/lib/constants'

export default async function SalesQuotationDetailPage({ params }: { params: { id: string } }) {
  const quotation = await getSalesQuotationById(params.id)

  if (!quotation) {
    notFound()
  }

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

  const isExpired = new Date(quotation.validUntil) < new Date()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/sales/quotations">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Quotation
          </Button>
        </Link>
        <div className="flex gap-2">
          {!quotation.convertedToSo && (
            <Link href={`/sales/quotations/${params.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Quotation
              </Button>
            </Link>
          )}
          {quotation.status === 'accepted' && !quotation.convertedToSo && (
            <Link href={`/sales/orders/create?from=quotation&id=${params.id}`}>
              <Button variant="default">
                <FileText className="h-4 w-4 mr-2" />
                Konversi ke SO
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold font-mono">{quotation.sqNumber}</h1>
          <Badge variant={getStatusBadge(quotation.status)}>
            {getStatusLabel(quotation.status)}
          </Badge>
          {isExpired && <Badge variant="destructive">Expired</Badge>}
          {quotation.convertedToSo && (
            <Badge variant="outline">Converted to {quotation.soNumber}</Badge>
          )}
        </div>
        <p className="text-gray-600">Tanggal: {formatDate(quotation.sqDate)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quotation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Nomor SQ</p>
              <p className="text-sm font-medium font-mono">{quotation.sqNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Tanggal</p>
              <p className="text-sm">{formatDate(quotation.sqDate)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Berlaku Hingga</p>
              <p className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                {formatDate(quotation.validUntil)}
                {isExpired && ' (Expired)'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Status</p>
              <div>
                <Badge variant={getStatusBadge(quotation.status)}>
                  {getStatusLabel(quotation.status)}
                </Badge>
              </div>
            </div>
            {quotation.soNumber && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <p className="text-sm text-gray-600">SO Number</p>
                <Link href={`/sales/orders/${quotation.soNumber}`}>
                  <p className="text-sm font-mono text-blue-600 hover:underline">
                    {quotation.soNumber}
                  </p>
                </Link>
              </div>
            )}
            {quotation.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-1">Catatan</p>
                <p className="text-sm">{quotation.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">Dibuat</p>
              <p className="text-sm">{formatDate(quotation.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kode Customer</p>
              <p className="text-sm font-medium font-mono">{quotation.customer.customerCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Nama Customer</p>
              <p className="text-sm font-medium">{quotation.customer.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Tipe</p>
              <p className="text-sm capitalize">{quotation.customer.customerType}</p>
            </div>
            {quotation.customer.phone && (
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-gray-600">Telepon</p>
                <p className="text-sm">{quotation.customer.phone}</p>
              </div>
            )}
            {quotation.customer.email && (
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm">{quotation.customer.email}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <p className="text-sm text-gray-600">Default Discount</p>
              <p className="text-sm">{Number(quotation.customer.discountRate)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Item Quotation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Item</TableHead>
                <TableHead>Nama Item</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Disc %</TableHead>
                <TableHead className="text-right">Disc Amount</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.item.itemCode}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.item.itemName}</p>
                      <p className="text-sm text-gray-600">{item.item.brand}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.item.category}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.unitPrice))}
                  </TableCell>
                  <TableCell className="text-right">{Number(item.discountPercent)}%</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.discountAmount))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(item.subtotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-80">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(Number(quotation.subtotal))}</span>
            </div>
            <div className="flex justify-between w-80">
              <span className="text-gray-600">Total Diskon:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(Number(quotation.discountAmount))}
              </span>
            </div>
            <div className="flex justify-between w-80">
              <span className="text-gray-600">Pajak:</span>
              <span className="font-medium">{formatCurrency(Number(quotation.taxAmount))}</span>
            </div>
            <div className="flex justify-between w-80 text-xl font-bold border-t pt-2">
              <span>Grand Total:</span>
              <span>{formatCurrency(Number(quotation.grandTotal))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
