import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
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
import { getShipmentById } from '@/services/shipment.service'
import { formatDate } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'
import { MarkDeliveredButton } from './mark-delivered-button'

interface PageProps {
    params: {
        id: string
    }
}

export default async function ShipmentDetailPage({ params }: PageProps) {
    const shipment = await getShipmentById(params.id)

    if (!shipment) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            in_transit: 'secondary',
            delivered: 'default',
            cancelled: 'destructive',
        }
        return variants[status] || 'secondary'
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales/shipments">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Surat Jalan {shipment.sjNumber}
                            <Badge variant={getStatusBadge(shipment.status)}>{shipment.status}</Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <PrintButton label="Cetak Surat Jalan" permission="shipments.print" />
                    {shipment.status === 'in_transit' && <MarkDeliveredButton id={shipment.id} />}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Nama Customer</p>
                                <p className="font-medium">{shipment.customer.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kode Customer</p>
                                <p className="font-mono text-sm">{shipment.customerCode}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Penerima</p>
                                <p className="font-medium">{shipment.recipient || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shipment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Pengiriman</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal SJ</p>
                                <p className="font-medium">{formatDate(shipment.sjDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Referensi DO</p>
                                <Link
                                    href={`/sales/delivery-orders/${shipment.doId}`}
                                    className="text-blue-600 hover:underline font-mono text-sm"
                                >
                                    {shipment.doNumber}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Supir / Kendaraan</p>
                                <p className="font-medium">
                                    {shipment.driverName || '-'} / {shipment.vehicleNumber || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alamat Tujuan</p>
                                <p className="text-sm">{shipment.deliveryAddress}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge variant={getStatusBadge(shipment.status)}>{shipment.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Waktu Sampai</p>
                                <p className="font-medium">
                                    {shipment.deliveredAt ? formatDate(shipment.deliveredAt) : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Item Pengiriman</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Batch Number</TableHead>
                                <TableHead className="text-right">Qty Dikirim</TableHead>
                                <TableHead>Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipment.deliveryOrder.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{item.item.itemName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.itemCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{item.batchNumber}</TableCell>
                                    <TableCell className="text-right font-bold">{Number(item.pickedQty)}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
