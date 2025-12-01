import Link from 'next/link'
import { ChevronLeft, Edit, MapPin, Warehouse, Package } from 'lucide-react'
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
import { getLocationById } from '@/services/location.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
  const locationData = await getLocationById(params.id)

  if (!locationData) {
    notFound()
  }

  const { location, stockSummary } = locationData

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/master/locations">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Lokasi
          </Button>
        </Link>
        <Link href={`/master/locations/${params.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lokasi
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">{location.locationName}</h1>
          {location.isActive ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="secondary">Nonaktif</Badge>
          )}
          {location.zone && (
            <Badge variant="outline" className="capitalize">
              {location.zone}
            </Badge>
          )}
        </div>
        <p className="text-gray-600 font-mono">{location.locationCode}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stockSummary.totalItems}</p>
                <p className="text-sm text-gray-600">Jenis item</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stockSummary.totalQuantity}
            </p>
            <p className="text-sm text-gray-600">Unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Nilai Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(stockSummary.totalValue)}
            </p>
            <p className="text-sm text-gray-600">Total nilai</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Lokasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Kode Lokasi</p>
                <p className="font-medium font-mono">{location.locationCode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Warehouse className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Gudang</p>
                <p className="font-medium">{location.warehouse}</p>
              </div>
            </div>

            {location.zone && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Zona</p>
                  <p className="font-medium capitalize">{location.zone}</p>
                </div>
              </div>
            )}

            {location.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Deskripsi</p>
                <p className="text-sm">{location.description}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">Dibuat</p>
              <p className="text-sm">{formatDate(location.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Stok</CardTitle>
          </CardHeader>
          <CardContent>
            {stockSummary.totalItems === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada stok di lokasi ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Item</p>
                  <p className="text-sm font-medium text-right">
                    {stockSummary.totalItems} jenis
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-sm font-medium text-right">
                    {stockSummary.totalQuantity} unit
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Nilai Total</p>
                  <p className="text-sm font-medium text-right">
                    {formatCurrency(stockSummary.totalValue)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Items */}
      {stockSummary.items.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Daftar Stok di Lokasi Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Item</TableHead>
                  <TableHead>Nama Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Tersedia</TableHead>
                  <TableHead>Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockSummary.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{item.itemCode}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {item.availableQty}
                    </TableCell>
                    <TableCell>{item.baseUnit}</TableCell>
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
