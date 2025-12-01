import Link from 'next/link'
import { ChevronLeft, Edit, Package2, CalendarDays, DollarSign } from 'lucide-react'
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
import { getBatchById } from '@/services/batch.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const batchData = await getBatchById(params.id)

  if (!batchData) {
    notFound()
  }

  const { batch, stockSummary } = batchData
  const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/master/batches">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Batch
          </Button>
        </Link>
        <Link href={`/master/batches/${params.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Batch
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">{batch.batchNumber}</h1>
          {isExpired && (
            <Badge variant="destructive">Expired</Badge>
          )}
        </div>
        <p className="text-gray-600">
          {batch.item.itemCode} - {batch.item.itemName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stockSummary.totalQuantity}</p>
                <p className="text-sm text-gray-600">{batch.item.baseUnit}</p>
              </div>
              <Package2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Stok Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stockSummary.totalAvailable}
            </p>
            <p className="text-sm text-gray-600">{batch.item.baseUnit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Stok Reserved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {stockSummary.totalReserved}
            </p>
            <p className="text-sm text-gray-600">{batch.item.baseUnit}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tanggal Pembelian</p>
                <p className="font-medium">{formatDate(batch.purchaseDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Harga Beli</p>
                <p className="font-medium">
                  {formatCurrency(Number(batch.purchasePrice))} / {batch.item.baseUnit}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-medium">{batch.supplier}</p>
              </div>
            </div>

            {batch.expiryDate && (
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tanggal Kadaluarsa</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {formatDate(batch.expiryDate)}
                  </p>
                  {isExpired && (
                    <Badge variant="destructive" className="mt-1">
                      Sudah kadaluarsa
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {batch.notes && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-1">Catatan</p>
                <p className="text-sm">{batch.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">Dibuat</p>
              <p className="text-sm">{formatDate(batch.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Item Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kode Item</p>
              <p className="text-sm font-medium font-mono">{batch.item.itemCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Nama Item</p>
              <p className="text-sm font-medium">{batch.item.itemName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kategori</p>
              <p className="text-sm">{batch.item.category}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Merk</p>
              <p className="text-sm">{batch.item.brand}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Satuan</p>
              <p className="text-sm">{batch.item.baseUnit}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <p className="text-sm text-gray-600">Harga Jual</p>
              <p className="text-sm font-medium">
                {formatCurrency(Number(batch.item.sellingPrice))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Locations */}
      {stockSummary.locations.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stok per Lokasi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Lokasi</TableHead>
                  <TableHead>Nama Lokasi</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Tersedia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockSummary.locations.map((location, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{location.locationCode}</TableCell>
                    <TableCell>{location.locationName}</TableCell>
                    <TableCell className="font-medium">{location.quantity}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {location.availableQty}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
