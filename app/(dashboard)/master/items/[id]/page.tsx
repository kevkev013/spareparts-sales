import Link from 'next/link'
import { ChevronLeft, Edit, Package } from 'lucide-react'
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
import { getItemById } from '@/services/item.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const itemData = await getItemById(params.id)

  if (!itemData) {
    notFound()
  }

  const { item, stockSummary } = itemData

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/master/items">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Item
          </Button>
        </Link>
        <Link href={`/master/items/${params.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Item
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">{item.itemName}</h1>
          {item.isActive ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="secondary">Nonaktif</Badge>
          )}
        </div>
        <p className="text-gray-600 font-mono">{item.itemCode}</p>
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
                <p className="text-3xl font-bold">{stockSummary.totalStock}</p>
                <p className="text-sm text-gray-600">{item.baseUnit}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            {stockSummary.totalStock <= item.minStock && (
              <div className="mt-4 p-2 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  Stok di bawah minimum ({item.minStock})
                </p>
              </div>
            )}
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
            <p className="text-sm text-gray-600">{item.baseUnit}</p>
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
            <p className="text-sm text-gray-600">{item.baseUnit}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kategori</p>
              <p className="text-sm font-medium">{item.category}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Merk</p>
              <p className="text-sm font-medium">{item.brand}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Satuan Dasar</p>
              <p className="text-sm font-medium">{item.baseUnit}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Harga Dasar</p>
              <p className="text-sm font-medium">
                {formatCurrency(Number(item.basePrice))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Harga Jual</p>
              <p className="text-sm font-medium">
                {formatCurrency(Number(item.sellingPrice))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Stok Minimum</p>
              <p className="text-sm font-medium">{item.minStock}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Kena Pajak</p>
              <p className="text-sm font-medium">{item.isTaxable ? 'Ya' : 'Tidak'}</p>
            </div>
            {item.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Deskripsi</p>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <p className="text-sm text-gray-600">Dibuat</p>
              <p className="text-sm">{formatDate(item.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stock Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Stok per Lokasi</CardTitle>
          </CardHeader>
          <CardContent>
            {stockSummary.locations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Belum ada stok
              </p>
            ) : (
              <div className="space-y-3">
                {stockSummary.locations.map((location) => (
                  <div
                    key={location.locationCode}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{location.locationName}</p>
                      <p className="text-sm text-gray-600">
                        {location.locationCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{location.quantity}</p>
                      <p className="text-sm text-gray-600">
                        Tersedia: {location.availableQty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unit Conversions */}
      {item.unitConversions && item.unitConversions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Konversi Satuan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dari Satuan</TableHead>
                  <TableHead>Ke Satuan</TableHead>
                  <TableHead>Faktor Konversi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.unitConversions.map((uc) => (
                  <TableRow key={uc.id}>
                    <TableCell>{uc.fromUnit}</TableCell>
                    <TableCell>{uc.toUnit}</TableCell>
                    <TableCell>{Number(uc.conversionFactor)}</TableCell>
                    <TableCell>
                      {uc.isActive ? (
                        <Badge variant="success" className="text-xs">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Unit Prices */}
      {item.unitPrices && item.unitPrices.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Harga per Satuan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Min Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.unitPrices.map((up) => (
                  <TableRow key={up.id}>
                    <TableCell>{up.unit}</TableCell>
                    <TableCell>{formatCurrency(Number(up.buyingPrice))}</TableCell>
                    <TableCell>{formatCurrency(Number(up.sellingPrice))}</TableCell>
                    <TableCell>{up.minQty}</TableCell>
                    <TableCell>
                      {up.isActive ? (
                        <Badge variant="success" className="text-xs">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Batches */}
      {item.batches && item.batches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Batch Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Batch</TableHead>
                  <TableHead>Tanggal Beli</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Harga Beli</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                    <TableCell>{formatDate(batch.purchaseDate)}</TableCell>
                    <TableCell>{batch.supplier}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(batch.purchasePrice))}
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
